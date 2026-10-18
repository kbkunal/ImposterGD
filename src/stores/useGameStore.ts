import { create } from 'zustand';
import {
  ClueEntry,
  GamePhase,
  GameRound,
  Match,
  PrivatePlayerRole,
  Room,
  RoomPlayer,
  RoomSettings,
  UserProfile,
} from '../types/game';
import { roomService } from '../services/rooms/roomService';
import { gameEngine } from '../services/game/gameEngine';
import { soundEngine } from '../services/game/soundEngine';

interface GameState {
  currentRoom: Room | null;
  players: RoomPlayer[];
  currentMatch: Match | null;
  currentRound: GameRound | null;
  myPrivateRole: PrivatePlayerRole | null;
  myVoteTargetId: string | null;
  cluesHistory: ClueEntry[];
  hasAcknowledgedCard: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  createRoom: (host: UserProfile, name: string, isPublic: boolean, settings: RoomSettings) => Promise<Room | null>;
  joinRoomByCode: (code: string, user: UserProfile) => Promise<boolean>;
  loadRoom: (roomId: string, user: UserProfile) => Promise<boolean>;
  leaveCurrentRoom: (user: UserProfile) => Promise<void>;
  toggleReady: (userId: string, ready: boolean) => Promise<void>;
  startGameRound: (host: UserProfile) => Promise<void>;
  loadMyPrivateRole: (userId: string) => Promise<void>;
  acknowledgeCardViewed: (userId: string) => Promise<void>;
  submitTextClue: (user: UserProfile, clueText: string) => Promise<void>;
  advanceSpeakerTurn: () => Promise<void>;
  advancePhase: (nextPhase: GamePhase) => Promise<void>;
  submitVote: (voterId: string, targetId: string) => Promise<void>;
  evaluateVotes: (allowLastChanceGuess?: boolean) => Promise<void>;
  submitImposterGuess: (guess: string) => Promise<boolean>;
  playAgain: (host: UserProfile) => Promise<void>;
  setRoomSettings: (settings: RoomSettings) => void;
  resetGame: () => void;
  subscribeToRoomEvents: (roomId: string, currentUserId: string) => () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  currentRoom: null,
  players: [],
  currentMatch: null,
  currentRound: null,
  myPrivateRole: null,
  myVoteTargetId: null,
  cluesHistory: [],
  hasAcknowledgedCard: false,
  isLoading: false,
  error: null,

  createRoom: async (host, name, isPublic, settings) => {
    try {
      set({ isLoading: true, error: null });
      const res = await roomService.createRoom(host, name, isPublic, settings);
      if (res.room) {
        const players = await roomService.getRoomPlayers(res.room.id);
        set({
          currentRoom: res.room,
          players,
          isLoading: false,
          error: null,
        });
        soundEngine.playPlayerJoin();
        return res.room;
      }
      set({ isLoading: false, error: res.error || 'Failed to create room' });
      return null;
    } catch (err: unknown) {
      set({ isLoading: false, error: (err as Error).message });
      return null;
    }
  },

  joinRoomByCode: async (code, user) => {
    try {
      set({ isLoading: true, error: null });
      const room = await roomService.getRoomByCode(code);
      if (!room) {
        set({ isLoading: false, error: 'Room not found or no longer active' });
        return false;
      }

      const res = await roomService.joinRoom(room, user);
      if (!res.success) {
        set({ isLoading: false, error: res.error || 'Could not join room' });
        return false;
      }

      set({
        currentRoom: room,
        players: res.players || [],
        isLoading: false,
        error: null,
      });

      soundEngine.playPlayerJoin();
      return true;
    } catch (err: unknown) {
      set({ isLoading: false, error: (err as Error).message });
      return false;
    }
  },

  loadRoom: async (roomId, user) => {
    try {
      set({ isLoading: true, error: null });
      const players = await roomService.getRoomPlayers(roomId);
      if (players.length === 0) {
        set({ isLoading: false, error: 'Room not found' });
        return false;
      }

      // Check local or Supabase rooms
      const raw = localStorage.getItem('imposter_local_rooms');
      let room: Room | null = null;
      if (raw) {
        const map = JSON.parse(raw);
        room = map[roomId] || null;
      }

      if (room) {
        set({ currentRoom: room, players, isLoading: false });
        return true;
      }
      set({ isLoading: false, error: 'Room not found' });
      return false;
    } catch (err: unknown) {
      set({ isLoading: false, error: (err as Error).message });
      return false;
    }
  },

  leaveCurrentRoom: async (user) => {
    const { currentRoom } = get();
    if (currentRoom) {
      await roomService.leaveRoom(currentRoom.id, user.id);
      get().resetGame();
    }
  },

  toggleReady: async (userId, ready) => {
    const { currentRoom, players } = get();
    if (!currentRoom) return;

    await roomService.toggleReady(currentRoom.id, userId, ready);
    set({
      players: players.map(p => (p.user_id === userId ? { ...p, ready } : p)),
    });
  },

  startGameRound: async (host) => {
    const { currentRoom, players, currentMatch } = get();
    if (!currentRoom) return;

    try {
      set({ isLoading: true, error: null });
      soundEngine.playCardDeal();

      const { round, privateRole, match } = await gameEngine.startNewRound(
        currentRoom,
        players,
        currentMatch || undefined
      );

      set({
        currentRound: round,
        myPrivateRole: privateRole,
        currentMatch: match,
        myVoteTargetId: null,
        cluesHistory: [],
        hasAcknowledgedCard: false,
        isLoading: false,
      });
    } catch (err: unknown) {
      set({ isLoading: false, error: (err as Error).message });
    }
  },

  loadMyPrivateRole: async (userId) => {
    const { currentRound } = get();
    if (!currentRound) return;

    const role = await gameEngine.getMyPrivateRole(currentRound.id, userId);
    if (role) {
      set({ myPrivateRole: role });
    }
  },

  acknowledgeCardViewed: async (userId) => {
    const { currentRoom, currentRound, myPrivateRole } = get();
    if (!currentRoom || !currentRound) return;

    await gameEngine.markCardViewed(currentRoom.id, currentRound.id, userId);
    set({
      hasAcknowledgedCard: true,
      myPrivateRole: myPrivateRole ? { ...myPrivateRole, card_viewed: true } : null,
    });
  },

  submitTextClue: async (user, clueText) => {
    const { currentRoom, currentRound, cluesHistory } = get();
    if (!currentRoom || !currentRound || !clueText.trim()) return;

    const newClue: ClueEntry = {
      user_id: user.id,
      username: user.display_name,
      avatar_id: user.avatar_id,
      avatar_background: user.avatar_background,
      clue: clueText.trim(),
      round_number: currentRound.round_number,
      timestamp: Date.now(),
    };

    const updatedClues = [...cluesHistory, newClue];
    set({ cluesHistory: updatedClues });

    roomService.broadcastEvent(currentRoom.id, {
      type: 'CLUE_SUBMITTED',
      clue: newClue,
    });

    // Advance to next speaker
    await get().advanceSpeakerTurn();
  },

  advanceSpeakerTurn: async () => {
    const { currentRoom, currentRound } = get();
    if (!currentRoom || !currentRound) return;

    const res = await gameEngine.advanceSpeakerTurn(
      currentRoom.id,
      currentRound,
      currentRoom.settings.clue_rounds
    );

    set({ currentRound: res.round });
  },

  advancePhase: async (nextPhase) => {
    const { currentRoom, currentRound } = get();
    if (!currentRoom || !currentRound) return;

    const updated = await gameEngine.advancePhase(currentRoom.id, currentRound, nextPhase);
    set({ currentRound: updated });
  },

  submitVote: async (voterId, targetId) => {
    const { currentRoom, currentRound, players } = get();
    if (!currentRoom || !currentRound) return;

    soundEngine.playVoteSubmit();
    const res = await gameEngine.submitVote(
      currentRoom.id,
      currentRound,
      voterId,
      targetId,
      players.length
    );

    set({
      currentRound: res.round,
      myVoteTargetId: targetId,
    });

    // If everyone voted, automatically trigger vote evaluation
    if (res.allVoted) {
      setTimeout(() => {
        get().evaluateVotes(currentRoom.settings.allow_last_chance_guess);
      }, 1000);
    }
  },

  evaluateVotes: async (allowLastChanceGuess = true) => {
    const { currentRoom, currentRound, currentMatch, players } = get();
    if (!currentRoom || !currentRound || !currentMatch) return;

    const res = await gameEngine.evaluateVotes(
      currentRoom.id,
      currentRound,
      currentMatch,
      players,
      allowLastChanceGuess
    );

    soundEngine.playRoleReveal(res.imposterCaught);

    set({
      currentRound: res.round,
      currentMatch: res.match,
    });

    if (res.round.phase === 'ROUND_RESULTS') {
      if (res.round.winner === 'NORMAL_PLAYERS') {
        soundEngine.playVictory();
      } else {
        soundEngine.playDefeat();
      }
    }
  },

  submitImposterGuess: async (guess) => {
    const { currentRoom, currentRound, currentMatch, players } = get();
    if (!currentRoom || !currentRound || !currentMatch) return false;

    const res = await gameEngine.evaluateImposterGuess(
      currentRoom.id,
      currentRound,
      currentMatch,
      players,
      guess
    );

    set({
      currentRound: res.round,
      currentMatch: res.match,
    });

    if (res.correct) {
      soundEngine.playVictory();
    } else {
      soundEngine.playDefeat();
    }

    return res.correct;
  },

  playAgain: async (host) => {
    const { currentRoom, players, currentMatch } = get();
    if (!currentRoom) return;

    await get().startGameRound(host);
  },

  setRoomSettings: (settings) => {
    const { currentRoom } = get();
    if (currentRoom) {
      set({ currentRoom: { ...currentRoom, settings } });
    }
  },

  resetGame: () => {
    set({
      currentRoom: null,
      players: [],
      currentMatch: null,
      currentRound: null,
      myPrivateRole: null,
      myVoteTargetId: null,
      cluesHistory: [],
      hasAcknowledgedCard: false,
      isLoading: false,
      error: null,
    });
  },

  subscribeToRoomEvents: (roomId, currentUserId) => {
    return roomService.subscribeToRoom(roomId, async (event) => {
      if (event.type === 'PLAYER_JOINED') {
        const players = await roomService.getRoomPlayers(roomId);
        set({ players });
        soundEngine.playPlayerJoin();
      } else if (event.type === 'PLAYER_LEFT') {
        const players = await roomService.getRoomPlayers(roomId);
        set({ players });
      } else if (event.type === 'PLAYER_READY_CHANGED') {
        set(state => ({
          players: state.players.map(p =>
            p.user_id === event.userId ? { ...p, ready: event.ready } : p
          ),
        }));
      } else if (event.type === 'ROUND_STARTED') {
        soundEngine.playCardDeal();
        set({
          currentRound: event.round,
          currentMatch: event.match,
          myVoteTargetId: null,
          cluesHistory: [],
          hasAcknowledgedCard: false,
        });
        // Fetch current user's private role
        await get().loadMyPrivateRole(currentUserId);
      } else if (event.type === 'CARD_VIEWED') {
        set(state => ({
          players: state.players.map(p =>
            p.user_id === event.userId ? { ...p, card_viewed: true } : p
          ),
        }));
      } else if (event.type === 'PHASE_CHANGED') {
        set({ currentRound: event.round });
      } else if (event.type === 'SPEAKER_TURN_CHANGED') {
        set({ currentRound: event.round });
      } else if (event.type === 'CLUE_SUBMITTED') {
        set(state => ({
          cluesHistory: [...state.cluesHistory, event.clue],
        }));
      } else if (event.type === 'VOTE_SUBMITTED') {
        set(state => ({
          currentRound: state.currentRound
            ? {
                ...state.currentRound,
                vote_submissions: Array.from(
                  new Set([...state.currentRound.vote_submissions, event.voterId])
                ),
              }
            : null,
        }));
      } else if (event.type === 'ROUND_EVALUATED' || event.type === 'ROUND_COMPLETED') {
        set({
          currentRound: event.round,
          currentMatch: event.match,
        });
      }
    });
  },
}));
