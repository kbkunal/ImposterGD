import { supabase, isSupabaseConfigured } from '../supabase/client';
import { selectSecretWord, getSuitableHint } from './wordBank';
import {
  GamePhase,
  GameRound,
  Match,
  PrivatePlayerRole,
  Room,
  RoomPlayer,
  UserProfile,
} from '../../types/game';
import { roomService } from '../rooms/roomService';

const LOCAL_ROUNDS_KEY = 'imposter_local_rounds';
const LOCAL_ROLES_KEY = 'imposter_local_private_roles';
const LOCAL_MATCHES_KEY = 'imposter_local_matches';
const LOCAL_VOTES_KEY = 'imposter_local_votes';

export const gameEngine = {
  /**
   * Start a new match or advance to next round
   */
  async startNewRound(
    room: Room,
    players: RoomPlayer[],
    existingMatch?: Match
  ): Promise<{ round: GameRound; privateRole: PrivatePlayerRole; match: Match }> {
    if (players.length < room.settings.min_players) {
      throw new Error(`Minimum ${room.settings.min_players} players required to start.`);
    }

    // 1. Authoritative random selection
    const wordEntry = selectSecretWord(room.settings.category, room.settings.difficulty);
    const hint = getSuitableHint(wordEntry, room.settings.hint_mode);

    // Pick Imposter randomly
    const eligibleIndices = players.map((_, i) => i);
    const imposterIdx = eligibleIndices[Math.floor(Math.random() * eligibleIndices.length)];
    const imposterPlayer = players[imposterIdx];

    // Speaker order: start at random player, then circular order
    const startIndex = Math.floor(Math.random() * players.length);
    const speakerOrder: string[] = [];
    for (let i = 0; i < players.length; i++) {
      const idx = (startIndex + i) % players.length;
      speakerOrder.push(players[idx].user_id);
    }

    // Match setup
    const matchId = existingMatch?.id || 'match_' + Math.random().toString(36).substring(2, 10);
    const roundNumber = existingMatch ? existingMatch.current_round + 1 : 1;

    const roundId = 'rnd_' + Math.random().toString(36).substring(2, 10);
    const phaseDeadline = Date.now() + 6000; // 6 seconds for dealing cards & reveal trigger

    const newRound: GameRound = {
      id: roundId,
      match_id: matchId,
      round_number: roundNumber,
      category: wordEntry.category,
      phase: 'DEALING_CARDS',
      phase_started_at: Date.now(),
      phase_deadline: phaseDeadline,
      active_speaker_id: speakerOrder[0],
      speaker_order: speakerOrder,
      current_speaker_index: 0,
      current_clue_round: 1,
      total_clue_rounds: room.settings.clue_rounds || 1,
      imposter_user_ids: [imposterPlayer.user_id],
      votes: {},
      vote_submissions: [],
      points_awarded: {},
      // Keep secret_word and revealed_hint hidden from public round object until ROUND_RESULTS!
    };

    const match: Match = existingMatch
      ? { ...existingMatch, current_round: roundNumber }
      : {
          id: matchId,
          room_id: room.id,
          status: 'ACTIVE',
          current_round: 1,
          total_rounds: 3,
          scores: players.reduce((acc, p) => ({ ...acc, [p.user_id]: 0 }), {}),
          started_at: new Date().toISOString(),
        };

    // If Supabase is configured, execute secure RPC
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.rpc('rpc_start_game_round', {
          p_match_id: matchId,
          p_round_number: roundNumber,
          p_secret_word: wordEntry.word,
          p_category: wordEntry.category,
          p_imposter_hint: hint || '',
          p_imposter_user_ids: [imposterPlayer.user_id],
          p_speaker_order: speakerOrder,
          p_phase_deadline: new Date(phaseDeadline).toISOString(),
        });
      } catch (err) {
        console.warn('Supabase rpc_start_game_round error, fallback:', err);
      }
    }

    // Store private roles in segregated private vault
    const privateRoles: Record<string, PrivatePlayerRole> = {};
    players.forEach(p => {
      const isImposter = p.user_id === imposterPlayer.user_id;
      privateRoles[p.user_id] = {
        round_id: roundId,
        user_id: p.user_id,
        role: isImposter ? 'IMPOSTER' : 'NORMAL',
        secret_word: isImposter ? undefined : wordEntry.word,
        private_hint: isImposter ? (hint || undefined) : undefined,
        category: wordEntry.category,
        card_viewed: false,
      };
    });

    // Save locally
    const rawRounds = localStorage.getItem(LOCAL_ROUNDS_KEY);
    const rounds: Record<string, GameRound> = rawRounds ? JSON.parse(rawRounds) : {};
    rounds[roundId] = newRound;
    localStorage.setItem(LOCAL_ROUNDS_KEY, JSON.stringify(rounds));

    const rawRoles = localStorage.getItem(LOCAL_ROLES_KEY);
    const rolesVault: Record<string, Record<string, PrivatePlayerRole>> = rawRoles ? JSON.parse(rawRoles) : {};
    rolesVault[roundId] = privateRoles;
    localStorage.setItem(LOCAL_ROLES_KEY, JSON.stringify(rolesVault));

    const rawMatches = localStorage.getItem(LOCAL_MATCHES_KEY);
    const matches: Record<string, Match> = rawMatches ? JSON.parse(rawMatches) : {};
    matches[matchId] = match;
    localStorage.setItem(LOCAL_MATCHES_KEY, JSON.stringify(matches));

    // Secret word storage for end of round validation
    sessionStorage.setItem(`secret_word_${roundId}`, wordEntry.word);
    sessionStorage.setItem(`imposter_hint_${roundId}`, hint || '');

    // Broadcast new round event
    roomService.broadcastEvent(room.id, {
      type: 'ROUND_STARTED',
      round: newRound,
      match,
    });

    // Return the caller's authorized private role
    const callerId = room.host_id;
    return {
      round: newRound,
      privateRole: privateRoles[callerId],
      match,
    };
  },

  /**
   * Authoritative retrieval of caller's own private role.
   * STRICT SECURITY: Player CANNOT see other players' roles!
   */
  async getMyPrivateRole(roundId: string, userId: string): Promise<PrivatePlayerRole | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('private_player_roles')
        .select('*')
        .eq('round_id', roundId)
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) {
        return {
          round_id: data.round_id,
          user_id: data.user_id,
          role: data.role,
          secret_word: data.secret_word || undefined,
          private_hint: data.private_hint || undefined,
          category: data.category,
          card_viewed: Boolean(data.card_viewed_at),
        };
      }
    }

    const rawRoles = localStorage.getItem(LOCAL_ROLES_KEY);
    if (!rawRoles) return null;
    try {
      const rolesVault = JSON.parse(rawRoles);
      const roundVault = rolesVault[roundId];
      if (!roundVault) return null;
      return roundVault[userId] || null;
    } catch {
      return null;
    }
  },

  /**
   * Mark that a player viewed their card
   */
  async markCardViewed(roomId: string, roundId: string, userId: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.rpc('rpc_mark_card_viewed', { p_round_id: roundId });
      } catch {
        // ignore
      }
    }

    const rawRoles = localStorage.getItem(LOCAL_ROLES_KEY);
    if (rawRoles) {
      try {
        const rolesVault = JSON.parse(rawRoles);
        if (rolesVault[roundId] && rolesVault[roundId][userId]) {
          rolesVault[roundId][userId].card_viewed = true;
          localStorage.setItem(LOCAL_ROLES_KEY, JSON.stringify(rolesVault));
        }
      } catch {
        // ignore
      }
    }

    roomService.broadcastEvent(roomId, {
      type: 'CARD_VIEWED',
      roundId,
      userId,
    });
  },

  /**
   * Advance game phase
   */
  async advancePhase(roomId: string, round: GameRound, nextPhase: GamePhase): Promise<GameRound> {
    const updatedRound: GameRound = {
      ...round,
      phase: nextPhase,
      phase_started_at: Date.now(),
    };

    // Phase specific deadline calculations
    if (nextPhase === 'CLUE_ROUND') {
      updatedRound.phase_deadline = Date.now() + 35000;
    } else if (nextPhase === 'DISCUSSION') {
      updatedRound.phase_deadline = Date.now() + 60000;
    } else if (nextPhase === 'VOTING') {
      updatedRound.phase_deadline = Date.now() + 45000;
    } else if (nextPhase === 'VOTE_REVEAL') {
      updatedRound.phase_deadline = Date.now() + 10000;
    }

    const rawRounds = localStorage.getItem(LOCAL_ROUNDS_KEY);
    if (rawRounds) {
      try {
        const rounds = JSON.parse(rawRounds);
        rounds[round.id] = updatedRound;
        localStorage.setItem(LOCAL_ROUNDS_KEY, JSON.stringify(rounds));
      } catch {
        // ignore
      }
    }

    roomService.broadcastEvent(roomId, {
      type: 'PHASE_CHANGED',
      round: updatedRound,
    });

    return updatedRound;
  },

  /**
   * Advance active speaker to next player in clue round
   */
  async advanceSpeakerTurn(
    roomId: string,
    round: GameRound,
    totalClueRounds: number = 1
  ): Promise<{ round: GameRound; clueRoundFinished: boolean }> {
    const nextIndex = round.current_speaker_index + 1;

    if (nextIndex < round.speaker_order.length) {
      // Next player in this clue round
      const updatedRound: GameRound = {
        ...round,
        current_speaker_index: nextIndex,
        active_speaker_id: round.speaker_order[nextIndex],
        phase_deadline: Date.now() + 35000,
      };

      this.saveRound(updatedRound);
      roomService.broadcastEvent(roomId, { type: 'SPEAKER_TURN_CHANGED', round: updatedRound });
      return { round: updatedRound, clueRoundFinished: false };
    }

    // Clue round completed! Check if another clue round is configured
    if (round.current_clue_round < totalClueRounds) {
      const updatedRound: GameRound = {
        ...round,
        current_clue_round: round.current_clue_round + 1,
        current_speaker_index: 0,
        active_speaker_id: round.speaker_order[0],
        phase_deadline: Date.now() + 35000,
      };
      this.saveRound(updatedRound);
      roomService.broadcastEvent(roomId, { type: 'SPEAKER_TURN_CHANGED', round: updatedRound });
      return { round: updatedRound, clueRoundFinished: false };
    }

    // All clue rounds finished -> move to DISCUSSION
    const updatedRound = await this.advancePhase(roomId, round, 'DISCUSSION');
    return { round: updatedRound, clueRoundFinished: true };
  },

  /**
   * Submit secret player vote
   */
  async submitVote(
    roomId: string,
    round: GameRound,
    voterId: string,
    targetId: string,
    totalPlayers: number
  ): Promise<{ round: GameRound; allVoted: boolean }> {
    if (voterId === targetId) {
      throw new Error('You cannot vote for yourself.');
    }

    if (round.vote_submissions.includes(voterId)) {
      throw new Error('You have already submitted your vote.');
    }

    // Save vote in private votes store
    const rawVotes = localStorage.getItem(LOCAL_VOTES_KEY);
    const votesVault: Record<string, Record<string, string>> = rawVotes ? JSON.parse(rawVotes) : {};
    if (!votesVault[round.id]) {
      votesVault[round.id] = {};
    }
    votesVault[round.id][voterId] = targetId;
    localStorage.setItem(LOCAL_VOTES_KEY, JSON.stringify(votesVault));

    const updatedSubmissions = [...round.vote_submissions, voterId];
    const allVoted = updatedSubmissions.length >= totalPlayers;

    const updatedRound: GameRound = {
      ...round,
      vote_submissions: updatedSubmissions,
    };

    this.saveRound(updatedRound);

    roomService.broadcastEvent(roomId, {
      type: 'VOTE_SUBMITTED',
      roundId: round.id,
      voterId,
      voteCount: updatedSubmissions.length,
      allVoted,
    });

    return { round: updatedRound, allVoted };
  },

  /**
   * Authoritatively evaluate votes and reveal roles
   */
  async evaluateVotes(
    roomId: string,
    round: GameRound,
    match: Match,
    players: RoomPlayer[],
    allowLastChanceGuess: boolean = true
  ): Promise<{ round: GameRound; match: Match; imposterCaught: boolean }> {
    const rawVotes = localStorage.getItem(LOCAL_VOTES_KEY);
    const votesVault: Record<string, Record<string, string>> = rawVotes ? JSON.parse(rawVotes) : {};
    const votesMap = votesVault[round.id] || {};

    // Tally votes
    const tally: Record<string, number> = {};
    Object.values(votesMap).forEach(targetId => {
      tally[targetId] = (tally[targetId] || 0) + 1;
    });

    let maxVotes = 0;
    let mostVotedId: string | null = null;
    let isTie = false;

    Object.entries(tally).forEach(([targetId, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        mostVotedId = targetId;
        isTie = false;
      } else if (count === maxVotes && count > 0) {
        isTie = true;
      }
    });

    const imposterId = round.imposter_user_ids[0];
    const imposterCaught = !isTie && mostVotedId === imposterId;

    // Retrieve secret word and hint to now publicly publish
    const secretWord = sessionStorage.getItem(`secret_word_${round.id}`) || 'UNKNOWN';
    const revealedHint = sessionStorage.getItem(`imposter_hint_${round.id}`) || 'NONE';

    // If imposter caught and room allows last-chance guess, transition to IMPOSTER_GUESS
    if (imposterCaught && allowLastChanceGuess) {
      const updatedRound: GameRound = {
        ...round,
        phase: 'IMPOSTER_GUESS',
        phase_started_at: Date.now(),
        phase_deadline: Date.now() + 20000,
        votes: votesMap,
        most_voted_id: mostVotedId,
        is_tie: isTie,
        secret_word: secretWord,
        revealed_hint: revealedHint,
      };

      this.saveRound(updatedRound);
      roomService.broadcastEvent(roomId, { type: 'ROUND_EVALUATED', round: updatedRound, match });
      return { round: updatedRound, match, imposterCaught: true };
    }

    // Otherwise calculate final scores now
    return this.finalizeRoundScores(roomId, round, match, players, votesMap, mostVotedId, isTie, false, undefined);
  },

  /**
   * Evaluate Imposter's last-chance guess
   */
  async evaluateImposterGuess(
    roomId: string,
    round: GameRound,
    match: Match,
    players: RoomPlayer[],
    guess: string
  ): Promise<{ round: GameRound; match: Match; correct: boolean }> {
    const secretWord = round.secret_word || sessionStorage.getItem(`secret_word_${round.id}`) || '';
    const cleanGuess = guess.trim().toUpperCase();
    const cleanSecret = secretWord.trim().toUpperCase();

    // Check equality or very close fuzzy match
    const correct = cleanGuess === cleanSecret;

    const res = await this.finalizeRoundScores(
      roomId,
      round,
      match,
      players,
      round.votes,
      round.most_voted_id || null,
      Boolean(round.is_tie),
      true,
      { guess: cleanGuess, correct }
    );

    return { round: res.round, match: res.match, correct };
  },

  /**
   * Finalize round scores idempotently
   */
  async finalizeRoundScores(
    roomId: string,
    round: GameRound,
    match: Match,
    players: RoomPlayer[],
    votes: Record<string, string>,
    mostVotedId: string | null,
    isTie: boolean,
    hadGuessPhase: boolean,
    guessResult?: { guess: string; correct: boolean }
  ): Promise<{ round: GameRound; match: Match; imposterCaught: boolean }> {
    const imposterId = round.imposter_user_ids[0];
    const imposterCaught = !isTie && mostVotedId === imposterId;

    let winner: 'NORMAL_PLAYERS' | 'IMPOSTER' | 'TIE_ESCAPED';
    const pointsAwarded: Record<string, number> = {};

    if (imposterCaught) {
      if (guessResult?.correct) {
        // Imposter was caught but guessed secret word correctly!
        winner = 'IMPOSTER';
        pointsAwarded[imposterId] = 2;
        players.forEach(p => {
          if (p.user_id !== imposterId) pointsAwarded[p.user_id] = 0;
        });
      } else {
        // Normal players successfully identified the Imposter!
        winner = 'NORMAL_PLAYERS';
        players.forEach(p => {
          pointsAwarded[p.user_id] = p.user_id === imposterId ? 0 : 1;
        });
      }
    } else {
      // Imposter escaped!
      winner = isTie ? 'TIE_ESCAPED' : 'IMPOSTER';
      pointsAwarded[imposterId] = 2;
      players.forEach(p => {
        if (p.user_id !== imposterId) pointsAwarded[p.user_id] = 0;
      });
    }

    // Update match scores idempotently
    const updatedScores: Record<string, number> = { ...match.scores };
    Object.entries(pointsAwarded).forEach(([uid, pts]) => {
      updatedScores[uid] = (updatedScores[uid] || 0) + pts;
    });

    const secretWord = round.secret_word || sessionStorage.getItem(`secret_word_${round.id}`) || 'UNKNOWN';
    const revealedHint = round.revealed_hint || sessionStorage.getItem(`imposter_hint_${round.id}`) || 'NONE';

    const updatedRound: GameRound = {
      ...round,
      phase: 'ROUND_RESULTS',
      phase_started_at: Date.now(),
      phase_deadline: Date.now() + 15000,
      votes,
      most_voted_id: mostVotedId,
      is_tie: isTie,
      winner,
      secret_word: secretWord,
      revealed_hint: revealedHint,
      last_chance_guess: guessResult?.guess,
      last_chance_correct: guessResult?.correct,
      points_awarded: pointsAwarded,
    };

    const updatedMatch: Match = {
      ...match,
      scores: updatedScores,
    };

    this.saveRound(updatedRound);
    this.saveMatch(updatedMatch);

    roomService.broadcastEvent(roomId, {
      type: 'ROUND_COMPLETED',
      round: updatedRound,
      match: updatedMatch,
    });

    return { round: updatedRound, match: updatedMatch, imposterCaught };
  },

  saveRound(round: GameRound) {
    const rawRounds = localStorage.getItem(LOCAL_ROUNDS_KEY);
    const rounds: Record<string, GameRound> = rawRounds ? JSON.parse(rawRounds) : {};
    rounds[round.id] = round;
    localStorage.setItem(LOCAL_ROUNDS_KEY, JSON.stringify(rounds));
  },

  saveMatch(match: Match) {
    const rawMatches = localStorage.getItem(LOCAL_MATCHES_KEY);
    const matches: Record<string, Match> = rawMatches ? JSON.parse(rawMatches) : {};
    matches[match.id] = match;
    localStorage.setItem(LOCAL_MATCHES_KEY, JSON.stringify(matches));
  },
};
