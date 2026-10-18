import { describe, it, expect, beforeEach } from 'vitest';
import { gameEngine } from '../services/game/gameEngine';
import { Room, RoomPlayer, UserProfile } from '../types/game';

describe('Authoritative Game Engine & Multiplayer Integrity', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  const mockHost: UserProfile = {
    id: 'user_host',
    username: 'Alice',
    display_name: 'Alice Host',
    avatar_id: 'detective',
    avatar_background: '#8B5CF6',
    total_matches: 0,
    wins: 0,
    losses: 0,
    imposter_wins: 0,
    total_points: 0,
    created_at: new Date().toISOString(),
  };

  const mockPlayer2: UserProfile = {
    id: 'user_p2',
    username: 'Bob',
    display_name: 'Bob P2',
    avatar_id: 'astronaut',
    avatar_background: '#0EA5E9',
    total_matches: 0,
    wins: 0,
    losses: 0,
    imposter_wins: 0,
    total_points: 0,
    created_at: new Date().toISOString(),
  };

  const mockPlayer3: UserProfile = {
    id: 'user_p3',
    username: 'Charlie',
    display_name: 'Charlie P3',
    avatar_id: 'ninja',
    avatar_background: '#10B981',
    total_matches: 0,
    wins: 0,
    losses: 0,
    imposter_wins: 0,
    total_points: 0,
    created_at: new Date().toISOString(),
  };

  const mockRoom: Room = {
    id: 'room_test_1',
    room_code: 'TEST77',
    host_id: mockHost.id,
    name: 'Test Room',
    is_public: false,
    status: 'OPEN',
    settings: {
      min_players: 3,
      max_players: 8,
      imposter_count: 1,
      category: 'Food and Drinks',
      difficulty: 'EASY',
      hint_mode: 'RELATED_WORD',
      clue_rounds: 1,
      clue_timer_seconds: 30,
      discussion_timer_seconds: 60,
      voting_timer_seconds: 45,
      allow_last_chance_guess: true,
      allow_text_clues: true,
      is_public: false,
    },
    created_at: new Date().toISOString(),
  };

  const mockPlayers: RoomPlayer[] = [
    { user_id: mockHost.id, seat_index: 0, ready: true, connected: true, is_host: true, profile: mockHost },
    { user_id: mockPlayer2.id, seat_index: 1, ready: true, connected: true, is_host: false, profile: mockPlayer2 },
    { user_id: mockPlayer3.id, seat_index: 2, ready: true, connected: true, is_host: false, profile: mockPlayer3 },
  ];

  it('rejects starting round when fewer than minimum players are present', async () => {
    await expect(
      gameEngine.startNewRound(mockRoom, [mockPlayers[0], mockPlayers[1]])
    ).rejects.toThrow('Minimum 3 players required to start.');
  });

  it('authoritatively assigns exactly one Imposter and hides secret word from them', async () => {
    const { round, match } = await gameEngine.startNewRound(mockRoom, mockPlayers);

    expect(round.phase).toBe('DEALING_CARDS');
    expect(round.imposter_user_ids.length).toBe(1);

    const imposterId = round.imposter_user_ids[0];

    // Check imposter private role
    const imposterRole = await gameEngine.getMyPrivateRole(round.id, imposterId);
    expect(imposterRole?.role).toBe('IMPOSTER');
    expect(imposterRole?.secret_word).toBeUndefined(); // MUST NOT HAVE SECRET WORD
    expect(imposterRole?.private_hint).toBeTruthy(); // MUST HAVE HINT

    // Check normal player private role
    const normalPlayerId = mockPlayers.find(p => p.user_id !== imposterId)!.user_id;
    const normalRole = await gameEngine.getMyPrivateRole(round.id, normalPlayerId);
    expect(normalRole?.role).toBe('NORMAL');
    expect(normalRole?.secret_word).toBeTruthy(); // MUST HAVE SECRET WORD
    expect(normalRole?.private_hint).toBeUndefined();
  });

  it('prevents a player from voting for themselves', async () => {
    const { round } = await gameEngine.startNewRound(mockRoom, mockPlayers);

    await expect(
      gameEngine.submitVote(mockRoom.id, round, mockHost.id, mockHost.id, 3)
    ).rejects.toThrow('You cannot vote for yourself.');
  });

  it('resolves vote correctly and awards points to normal players when Imposter is identified', async () => {
    const { round, match } = await gameEngine.startNewRound(mockRoom, mockPlayers);
    const imposterId = round.imposter_user_ids[0];
    const normalPlayers = mockPlayers.filter(p => p.user_id !== imposterId);

    // Normal players vote for the Imposter
    const r1 = await gameEngine.submitVote(mockRoom.id, round, normalPlayers[0].user_id, imposterId, 3);
    const r2 = await gameEngine.submitVote(mockRoom.id, r1.round, normalPlayers[1].user_id, imposterId, 3);

    // Imposter votes for someone else
    const r3 = await gameEngine.submitVote(mockRoom.id, r2.round, imposterId, normalPlayers[0].user_id, 3);
    expect(r3.allVoted).toBe(true);

    // Evaluate with last-chance disabled to inspect final scores directly
    const outcome = await gameEngine.finalizeRoundScores(
      mockRoom.id,
      r3.round,
      match,
      mockPlayers,
      {
        [normalPlayers[0].user_id]: imposterId,
        [normalPlayers[1].user_id]: imposterId,
        [imposterId]: normalPlayers[0].user_id,
      },
      imposterId,
      false,
      false
    );

    expect(outcome.round.winner).toBe('NORMAL_PLAYERS');
    expect(outcome.round.points_awarded[normalPlayers[0].user_id]).toBe(1);
    expect(outcome.round.points_awarded[normalPlayers[1].user_id]).toBe(1);
    expect(outcome.round.points_awarded[imposterId]).toBe(0);
  });

  it('handles tied votes by allowing Imposter to escape with +2 points', async () => {
    const { round, match } = await gameEngine.startNewRound(mockRoom, mockPlayers);
    const imposterId = round.imposter_user_ids[0];
    const normalPlayers = mockPlayers.filter(p => p.user_id !== imposterId);

    // Tie: Player 1 votes Player 2, Player 2 votes Player 1
    const votes = {
      [normalPlayers[0].user_id]: normalPlayers[1].user_id,
      [normalPlayers[1].user_id]: normalPlayers[0].user_id,
      [imposterId]: normalPlayers[0].user_id,
    };

    const outcome = await gameEngine.finalizeRoundScores(
      mockRoom.id,
      round,
      match,
      mockPlayers,
      votes,
      null,
      true, // isTie = true
      false
    );

    expect(outcome.round.winner).toBe('TIE_ESCAPED');
    expect(outcome.round.points_awarded[imposterId]).toBe(2);
    expect(outcome.round.points_awarded[normalPlayers[0].user_id]).toBe(0);
  });
});
