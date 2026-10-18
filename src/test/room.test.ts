import { describe, it, expect, beforeEach } from 'vitest';
import { roomService, generateRoomCode } from '../services/rooms/roomService';
import { UserProfile, RoomSettings } from '../types/game';

describe('Room Management & Host Migration', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  const mockUser1: UserProfile = {
    id: 'usr_h1',
    username: 'HostOne',
    display_name: 'Host One',
    avatar_id: 'detective',
    avatar_background: '#8B5CF6',
    total_matches: 0,
    wins: 0,
    losses: 0,
    imposter_wins: 0,
    total_points: 0,
    created_at: new Date().toISOString(),
  };

  const mockUser2: UserProfile = {
    id: 'usr_p2',
    username: 'PlayerTwo',
    display_name: 'Player Two',
    avatar_id: 'astronaut',
    avatar_background: '#0EA5E9',
    total_matches: 0,
    wins: 0,
    losses: 0,
    imposter_wins: 0,
    total_points: 0,
    created_at: new Date().toISOString(),
  };

  const defaultSettings: RoomSettings = {
    min_players: 3,
    max_players: 4,
    imposter_count: 1,
    category: 'All',
    difficulty: 'ALL',
    hint_mode: 'RELATED_WORD',
    clue_rounds: 1,
    clue_timer_seconds: 30,
    discussion_timer_seconds: 60,
    voting_timer_seconds: 45,
    allow_last_chance_guess: true,
    allow_text_clues: true,
    is_public: true,
  };

  it('generates 6-character room codes without ambiguous characters', () => {
    const code = generateRoomCode();
    expect(code.length).toBe(6);
    expect(code).toMatch(/^[A-Z0-9]{6}$/);
    expect(code).not.toContain('0'); // excluded
    expect(code).not.toContain('1'); // excluded
    expect(code).not.toContain('I'); // excluded
    expect(code).not.toContain('O'); // excluded
  });

  it('creates room and adds host to seat index 0', async () => {
    const res = await roomService.createRoom(mockUser1, 'Mystery Table', true, defaultSettings);
    expect(res.room).not.toBeNull();
    expect(res.room?.host_id).toBe(mockUser1.id);

    const players = await roomService.getRoomPlayers(res.room!.id);
    expect(players.length).toBe(1);
    expect(players[0].user_id).toBe(mockUser1.id);
    expect(players[0].is_host).toBe(true);
    expect(players[0].seat_index).toBe(0);
  });

  it('allows second player to join and prevents exceeding capacity', async () => {
    const smallRoomSettings = { ...defaultSettings, max_players: 2 };
    const { room } = await roomService.createRoom(mockUser1, 'Small Table', true, smallRoomSettings);

    const joinRes = await roomService.joinRoom(room!, mockUser2);
    expect(joinRes.success).toBe(true);
    expect(joinRes.players?.length).toBe(2);

    // Try to join a 3rd player when max is 2
    const mockUser3: UserProfile = { ...mockUser2, id: 'usr_p3', username: 'PlayerThree' };
    const failJoin = await roomService.joinRoom(room!, mockUser3);
    expect(failJoin.success).toBe(false);
    expect(failJoin.error).toContain('capacity');
  });

  it('migrates host safely to next player if original host leaves', async () => {
    const { room } = await roomService.createRoom(mockUser1, 'Host Migration Table', true, defaultSettings);
    await roomService.joinRoom(room!, mockUser2);

    let players = await roomService.getRoomPlayers(room!.id);
    expect(players.length).toBe(2);
    expect(players[0].user_id).toBe(mockUser1.id);

    // Host leaves
    await roomService.leaveRoom(room!.id, mockUser1.id);

    players = await roomService.getRoomPlayers(room!.id);
    expect(players.length).toBe(1);
    expect(players[0].user_id).toBe(mockUser2.id);
    expect(players[0].is_host).toBe(true); // Player 2 has now become Host!
  });
});
