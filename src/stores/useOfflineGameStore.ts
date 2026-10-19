import { create } from 'zustand';
import {
  OfflinePlayer,
  OfflineSettings,
  OfflineSecretAssignment,
  offlineGameService,
  AVATAR_OPTIONS,
} from '../services/offline/offlineGameService';
import { soundEngine } from '../services/game/soundEngine';

export type OfflinePhase =
  | 'PLAYER_SETUP'
  | 'CARD_REVEAL'
  | 'CLUE_ROUND'
  | 'DISCUSSION'
  | 'VOTING'
  | 'VOTE_REVEAL'
  | 'IMPOSTER_GUESS'
  | 'ROUND_RESULTS';

interface OfflineGameState {
  players: OfflinePlayer[];
  settings: OfflineSettings;
  phase: OfflinePhase;
  roundNumber: number;

  // Active round data
  category: string;
  speakerOrder: string[];
  currentSpeakerIndex: number;
  imposterIds: string[];
  secretWord: string;
  imposterHint: string;

  // Private secret assignments (in-memory only, never persisted)
  assignments: Record<string, OfflineSecretAssignment>;

  // Card handover state
  handoverPlayerIndex: number;
  isCardRevealed: boolean;

  // Voting state
  votingPlayerIndex: number;
  votes: Record<string, string>; // voterId -> targetId
  mostVotedId: string | null;
  isTie: boolean;
  imposterCaught: boolean;
  lastChanceGuess: string | null;
  lastChanceCorrect: boolean | null;
  pointsAwarded: Record<string, number>;
  winner: 'NORMAL_PLAYERS' | 'IMPOSTER' | 'TIE_ESCAPED' | null;

  // Actions
  addPlayer: (name?: string) => void;
  editPlayerName: (id: string, name: string) => void;
  removePlayer: (id: string) => void;
  reorderPlayers: (fromIdx: number, toIdx: number) => void;
  setSettings: (settings: Partial<OfflineSettings>) => void;

  startRound: () => void;
  revealCurrentCard: () => void;
  concealCardAndNextPlayer: () => void;

  advanceSpeakerTurn: () => void;
  advancePhase: (phase: OfflinePhase) => void;

  recordVote: (voterId: string, targetId: string) => void;
  evaluateVotes: () => void;
  submitImposterGuess: (guess: string) => void;

  playNextRound: () => void;
  resetToSetup: () => void;
}

export const useOfflineGameStore = create<OfflineGameState>((set, get) => ({
  players: offlineGameService.createDefaultPlayers(),
  settings: offlineGameService.createDefaultSettings(),
  phase: 'PLAYER_SETUP',
  roundNumber: 1,

  category: '',
  speakerOrder: [],
  currentSpeakerIndex: 0,
  imposterIds: [],
  secretWord: '',
  imposterHint: '',
  assignments: {},

  handoverPlayerIndex: 0,
  isCardRevealed: false,

  votingPlayerIndex: 0,
  votes: {},
  mostVotedId: null,
  isTie: false,
  imposterCaught: false,
  lastChanceGuess: null,
  lastChanceCorrect: null,
  pointsAwarded: {},
  winner: null,

  addPlayer: (name) => {
    const { players } = get();
    if (players.length >= 12) return;
    const nextIdx = players.length;
    const avatar = AVATAR_OPTIONS[nextIdx % AVATAR_OPTIONS.length];
    const newPlayer: OfflinePlayer = {
      id: 'off_p_' + Math.random().toString(36).substring(2, 9),
      name: (name && name.trim()) || `Player ${nextIdx + 1}`,
      avatarId: avatar.id,
      avatarBackground: avatar.bg,
      score: 0,
    };
    set({ players: [...players, newPlayer] });
  },

  editPlayerName: (id, name) => {
    set(state => ({
      players: state.players.map(p => (p.id === id ? { ...p, name: name } : p)),
    }));
  },

  removePlayer: (id) => {
    const { players, settings } = get();
    if (players.length <= 3) return; // Keep minimum 3
    const updated = players.filter(p => p.id !== id);
    // Ensure imposter count is valid
    const maxImposters = Math.max(1, updated.length - 1);
    const newImposterCount = Math.min(settings.imposterCount, maxImposters);
    set({
      players: updated,
      settings: { ...settings, imposterCount: newImposterCount },
    });
  },

  reorderPlayers: (fromIdx, toIdx) => {
    const { players } = get();
    if (fromIdx < 0 || toIdx < 0 || fromIdx >= players.length || toIdx >= players.length) return;
    const updated = [...players];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);
    set({ players: updated });
  },

  setSettings: (newSettings) => {
    set(state => ({
      settings: { ...state.settings, ...newSettings },
    }));
  },

  startRound: () => {
    const { players, settings } = get();
    if (players.length < 3) return;

    soundEngine.playCardDeal();

    const roundData = offlineGameService.startRound(players, settings);

    set({
      phase: 'CARD_REVEAL',
      category: roundData.category,
      secretWord: roundData.secretWord,
      imposterHint: roundData.hint,
      imposterIds: roundData.imposterIds,
      assignments: roundData.assignments,
      speakerOrder: roundData.speakerOrder,
      currentSpeakerIndex: 0,
      handoverPlayerIndex: 0,
      isCardRevealed: false,
      votingPlayerIndex: 0,
      votes: {},
      mostVotedId: null,
      isTie: false,
      imposterCaught: false,
      lastChanceGuess: null,
      lastChanceCorrect: null,
      pointsAwarded: {},
      winner: null,
    });
  },

  revealCurrentCard: () => {
    soundEngine.playCardFlip();
    set({ isCardRevealed: true });
  },

  concealCardAndNextPlayer: () => {
    const { handoverPlayerIndex, players } = get();
    const nextIdx = handoverPlayerIndex + 1;

    if (nextIdx < players.length) {
      // Transition to next player's neutral handover screen immediately
      set({
        handoverPlayerIndex: nextIdx,
        isCardRevealed: false,
      });
    } else {
      // All players have reviewed their cards! Automatically begin main clue phase
      set({
        phase: 'CLUE_ROUND',
        isCardRevealed: false,
      });
    }
  },

  advanceSpeakerTurn: () => {
    const { currentSpeakerIndex, speakerOrder } = get();
    const nextIdx = currentSpeakerIndex + 1;
    if (nextIdx < speakerOrder.length) {
      set({ currentSpeakerIndex: nextIdx });
    } else {
      // Clue round complete, advance to discussion!
      set({ phase: 'DISCUSSION' });
    }
  },

  advancePhase: (nextPhase) => {
    set({ phase: nextPhase });
  },

  recordVote: (voterId, targetId) => {
    soundEngine.playVoteSubmit();
    const { votes, players } = get();
    const updated = { ...votes, [voterId]: targetId };
    set({ votes: updated });

    // If everyone voted, automatically evaluate
    if (Object.keys(updated).length >= players.length) {
      get().evaluateVotes();
    }
  },

  evaluateVotes: () => {
    const { votes, players, imposterIds, settings, secretWord } = get();

    // Tally votes
    const tally: Record<string, number> = {};
    Object.values(votes).forEach(targetId => {
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

    const imposterCaught = !isTie && Boolean(mostVotedId && imposterIds.includes(mostVotedId));
    soundEngine.playRoleReveal(imposterCaught);

    if (imposterCaught && settings.allowLastChanceGuess) {
      set({
        phase: 'IMPOSTER_GUESS',
        mostVotedId,
        isTie,
        imposterCaught: true,
      });
      return;
    }

    // Otherwise calculate final scores
    let winner: 'NORMAL_PLAYERS' | 'IMPOSTER' | 'TIE_ESCAPED';
    const pointsAwarded: Record<string, number> = {};

    if (imposterCaught) {
      winner = 'NORMAL_PLAYERS';
      players.forEach(p => {
        pointsAwarded[p.id] = imposterIds.includes(p.id) ? 0 : 2;
      });
      soundEngine.playVictory();
    } else {
      winner = isTie ? 'TIE_ESCAPED' : 'IMPOSTER';
      players.forEach(p => {
        pointsAwarded[p.id] = imposterIds.includes(p.id) ? 3 : 0;
      });
      soundEngine.playDefeat();
    }

    // Update cumulative player scores
    const updatedPlayers = players.map(p => ({
      ...p,
      score: p.score + (pointsAwarded[p.id] || 0),
    }));

    set({
      phase: 'ROUND_RESULTS',
      players: updatedPlayers,
      mostVotedId,
      isTie,
      imposterCaught,
      pointsAwarded,
      winner,
    });
  },

  submitImposterGuess: (guess) => {
    const { secretWord, players, imposterIds, isTie, mostVotedId } = get();
    const cleanGuess = guess.trim().toUpperCase();
    const cleanSecret = (secretWord || '').trim().toUpperCase();
    const correct = cleanGuess === cleanSecret && cleanGuess !== '___SKIPPED___';

    let winner: 'NORMAL_PLAYERS' | 'IMPOSTER' | 'TIE_ESCAPED';
    const pointsAwarded: Record<string, number> = {};

    if (correct) {
      winner = 'IMPOSTER';
      players.forEach(p => {
        pointsAwarded[p.id] = imposterIds.includes(p.id) ? 2 : 0;
      });
      soundEngine.playVictory();
    } else {
      winner = 'NORMAL_PLAYERS';
      players.forEach(p => {
        pointsAwarded[p.id] = imposterIds.includes(p.id) ? 0 : 2;
      });
      soundEngine.playDefeat();
    }

    const updatedPlayers = players.map(p => ({
      ...p,
      score: p.score + (pointsAwarded[p.id] || 0),
    }));

    set({
      phase: 'ROUND_RESULTS',
      players: updatedPlayers,
      lastChanceGuess: cleanGuess,
      lastChanceCorrect: correct,
      pointsAwarded,
      winner,
    });
  },

  playNextRound: () => {
    const { roundNumber } = get();
    set({
      roundNumber: roundNumber + 1,
      // Clear previous secret assignments from memory
      assignments: {},
      secretWord: '',
      imposterHint: '',
      imposterIds: [],
    });
    get().startRound();
  },

  resetToSetup: () => {
    // Clear secret assignments and return to setup
    set({
      phase: 'PLAYER_SETUP',
      assignments: {},
      secretWord: '',
      imposterHint: '',
      imposterIds: [],
      votes: {},
      mostVotedId: null,
      winner: null,
    });
  },
}));
