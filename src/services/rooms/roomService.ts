import { supabase, isSupabaseConfigured } from '../supabase/client';
import { Room, RoomPlayer, RoomSettings, UserProfile } from '../../types/game';

const LOCAL_ROOMS_KEY = 'imposter_local_rooms';
const LOCAL_ROOM_PLAYERS_KEY = 'imposter_local_room_players';

/**
 * Generate a short, friendly 6-character room code (avoiding ambiguous letters like I, O, 0, 1)
 */
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const roomService = {
  /**
   * Create a new multiplayer room
   */
  async createRoom(
    host: UserProfile,
    roomName: string,
    isPublic: boolean,
    settings: RoomSettings
  ): Promise<{ room: Room | null; error?: string }> {
    const roomCode = generateRoomCode();
    const roomId = 'rm_' + Math.random().toString(36).substring(2, 10);

    const newRoom: Room = {
      id: roomId,
      room_code: roomCode,
      host_id: host.id,
      name: roomName.trim() || `${host.display_name}'s Room`,
      is_public: isPublic,
      status: 'OPEN',
      settings,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('rooms')
        .insert({
          room_code: roomCode,
          host_id: host.id,
          name: newRoom.name,
          is_public: isPublic,
          status: 'OPEN',
          settings: settings as unknown as Record<string, unknown>,
        })
        .select()
        .single();

      if (error) {
        return { room: null, error: error.message };
      }

      await supabase.from('room_players').insert({
        room_id: data.id,
        user_id: host.id,
        seat_index: 0,
        ready: true,
        connected: true,
      });

      return { room: data as Room };
    }

    // Try central server API
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host, roomName: newRoom.name, isPublic, settings, roomCode }),
      });
      if (res.ok) {
        const json = await res.json();
        const room = json.room as Room;
        this.broadcastEvent(room.id, { type: 'ROOM_CREATED', room });
        return { room };
      }
    } catch {
      // fallback to localStorage
    }

    const rawRooms = localStorage.getItem(LOCAL_ROOMS_KEY);
    const rooms: Record<string, Room> = rawRooms ? JSON.parse(rawRooms) : {};
    rooms[newRoom.id] = newRoom;
    localStorage.setItem(LOCAL_ROOMS_KEY, JSON.stringify(rooms));

    const rawPlayers = localStorage.getItem(LOCAL_ROOM_PLAYERS_KEY);
    const players: Record<string, RoomPlayer[]> = rawPlayers ? JSON.parse(rawPlayers) : {};
    players[newRoom.id] = [
      {
        user_id: host.id,
        seat_index: 0,
        ready: true,
        connected: true,
        is_host: true,
        profile: host,
      },
    ];
    localStorage.setItem(LOCAL_ROOM_PLAYERS_KEY, JSON.stringify(players));

    this.broadcastEvent(newRoom.id, { type: 'ROOM_CREATED', room: newRoom });
    return { room: newRoom };
  },

  /**
   * Find room by 6-letter room code
   */
  async getRoomByCode(code: string): Promise<Room | null> {
    const cleanCode = code.trim().toUpperCase();

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('room_code', cleanCode)
        .eq('status', 'OPEN')
        .maybeSingle();

      if (error) return null;
      return data as Room;
    }

    // Try central API server first
    try {
      const res = await fetch(`/api/rooms/code/${cleanCode}`);
      if (res.ok) {
        const json = await res.json();
        if (json.room) return json.room as Room;
      }
    } catch {
      // fallback to localStorage
    }

    const rawRooms = localStorage.getItem(LOCAL_ROOMS_KEY);
    if (!rawRooms) return null;
    try {
      const rooms: Record<string, Room> = JSON.parse(rawRooms);
      return Object.values(rooms).find(r => r.room_code === cleanCode && r.status !== 'CLOSED') || null;
    } catch {
      return null;
    }
  },

  /**
   * Get public open rooms
   */
  async getPublicRooms(): Promise<Room[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('is_public', true)
        .eq('status', 'OPEN')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) return [];
      return (data || []) as Room[];
    }

    try {
      const res = await fetch('/api/rooms/public');
      if (res.ok) {
        const json = await res.json();
        if (json.rooms) return json.rooms as Room[];
      }
    } catch {
      // fallback to localStorage
    }

    const rawRooms = localStorage.getItem(LOCAL_ROOMS_KEY);
    if (!rawRooms) return [];
    try {
      const rooms: Record<string, Room> = JSON.parse(rawRooms);
      return Object.values(rooms).filter(r => r.is_public && r.status === 'OPEN');
    } catch {
      return [];
    }
  },

  /**
   * Join a room as player
   */
  async joinRoom(
    room: Room,
    player: UserProfile
  ): Promise<{ success: boolean; players?: RoomPlayer[]; error?: string }> {
    if (isSupabaseConfigured && supabase) {
      const players = await this.getRoomPlayers(room.id);
      const existing = players.find(p => p.user_id === player.id);
      if (existing) {
        return { success: true, players };
      }

      if (players.length >= room.settings.max_players) {
        return { success: false, error: 'Room is already at full capacity' };
      }

      const { error } = await supabase.from('room_players').insert({
        room_id: room.id,
        user_id: player.id,
        seat_index: players.length,
        ready: false,
        connected: true,
      });

      if (error) return { success: false, error: error.message };
      const updated = await this.getRoomPlayers(room.id);
      return { success: true, players: updated };
    }

    // Try central API server
    try {
      const res = await fetch(`/api/rooms/${room.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player }),
      });

      if (res.ok) {
        const json = await res.json();
        this.broadcastEvent(room.id, { type: 'PLAYER_JOINED', player });
        return { success: true, players: json.players };
      } else {
        const json = await res.json();
        return { success: false, error: json.error || 'Failed to join' };
      }
    } catch {
      // fallback to localStorage
    }

    const players = await this.getRoomPlayers(room.id);
    const existing = players.find(p => p.user_id === player.id);
    if (existing) {
      return { success: true, players };
    }

    if (players.length >= room.settings.max_players) {
      return { success: false, error: 'Room is already at full capacity' };
    }

    const nextSeat = players.length;
    const newPlayer: RoomPlayer = {
      user_id: player.id,
      seat_index: nextSeat,
      ready: false,
      connected: true,
      is_host: room.host_id === player.id,
      profile: player,
    };

    const rawPlayers = localStorage.getItem(LOCAL_ROOM_PLAYERS_KEY);
    const roomPlayersMap: Record<string, RoomPlayer[]> = rawPlayers ? JSON.parse(rawPlayers) : {};
    const currentList = roomPlayersMap[room.id] || [];
    currentList.push(newPlayer);
    roomPlayersMap[room.id] = currentList;
    localStorage.setItem(LOCAL_ROOM_PLAYERS_KEY, JSON.stringify(roomPlayersMap));

    this.broadcastEvent(room.id, { type: 'PLAYER_JOINED', player: newPlayer });
    return { success: true, players: currentList };
  },

  /**
   * Get players currently in a room
   */
  async getRoomPlayers(roomId: string): Promise<RoomPlayer[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('room_players')
        .select(`
          user_id,
          seat_index,
          ready,
          connected,
          profile:user_id (*)
        `)
        .eq('room_id', roomId)
        .order('seat_index', { ascending: true });

      if (error) return [];

      const { data: roomData } = await supabase.from('rooms').select('host_id').eq('id', roomId).single();
      const hostId = roomData?.host_id;

      return (data || []).map((row: any) => ({
        user_id: row.user_id,
        seat_index: row.seat_index,
        ready: row.ready,
        connected: row.connected,
        is_host: row.user_id === hostId,
        profile: row.profile as UserProfile,
      }));
    }

    // Try central API server
    try {
      const res = await fetch(`/api/rooms/${roomId}/players`);
      if (res.ok) {
        const json = await res.json();
        if (json.players) return json.players as RoomPlayer[];
      }
    } catch {
      // fallback to localStorage
    }

    const rawPlayers = localStorage.getItem(LOCAL_ROOM_PLAYERS_KEY);
    if (!rawPlayers) return [];
    try {
      const roomPlayersMap: Record<string, RoomPlayer[]> = JSON.parse(rawPlayers);
      return roomPlayersMap[roomId] || [];
    } catch {
      return [];
    }
  },

  /**
   * Toggle player ready state
   */
  async toggleReady(roomId: string, userId: string, ready: boolean): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('room_players')
        .update({ ready })
        .eq('room_id', roomId)
        .eq('user_id', userId);

      return !error;
    }

    try {
      await fetch(`/api/rooms/${roomId}/ready`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ready }),
      });
    } catch {
      // ignore
    }

    const rawPlayers = localStorage.getItem(LOCAL_ROOM_PLAYERS_KEY);
    if (!rawPlayers) return false;
    const roomPlayersMap: Record<string, RoomPlayer[]> = JSON.parse(rawPlayers);
    const list = roomPlayersMap[roomId];
    if (list) {
      const p = list.find(item => item.user_id === userId);
      if (p) {
        p.ready = ready;
        localStorage.setItem(LOCAL_ROOM_PLAYERS_KEY, JSON.stringify(roomPlayersMap));
        this.broadcastEvent(roomId, { type: 'PLAYER_READY_CHANGED', userId, ready });
        return true;
      }
    }
    return false;
  },

  /**
   * Leave room with safe host migration
   */
  async leaveRoom(roomId: string, userId: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('room_players').delete().eq('room_id', roomId).eq('user_id', userId);
      const remaining = await this.getRoomPlayers(roomId);
      if (remaining.length === 0) {
        await supabase.from('rooms').update({ status: 'CLOSED' }).eq('id', roomId);
      } else {
        const { data: room } = await supabase.from('rooms').select('host_id').eq('id', roomId).single();
        if (room?.host_id === userId) {
          const newHost = remaining[0];
          await supabase.from('rooms').update({ host_id: newHost.user_id }).eq('id', roomId);
        }
      }
      return;
    }

    try {
      await fetch(`/api/rooms/${roomId}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
    } catch {
      // ignore
    }

    const rawPlayers = localStorage.getItem(LOCAL_ROOM_PLAYERS_KEY);
    if (!rawPlayers) return;
    const roomPlayersMap: Record<string, RoomPlayer[]> = JSON.parse(rawPlayers);
    let list = roomPlayersMap[roomId] || [];
    const wasHost = list.some(p => p.user_id === userId && p.is_host);

    list = list.filter(p => p.user_id !== userId);

    if (list.length === 0) {
      delete roomPlayersMap[roomId];
      const rawRooms = localStorage.getItem(LOCAL_ROOMS_KEY);
      if (rawRooms) {
        const rooms = JSON.parse(rawRooms);
        if (rooms[roomId]) {
          rooms[roomId].status = 'CLOSED';
          localStorage.setItem(LOCAL_ROOMS_KEY, JSON.stringify(rooms));
        }
      }
    } else {
      list.forEach((p, idx) => {
        p.seat_index = idx;
      });
      if (wasHost && list.length > 0) {
        list[0].is_host = true;
        const rawRooms = localStorage.getItem(LOCAL_ROOMS_KEY);
        if (rawRooms) {
          const rooms = JSON.parse(rawRooms);
          if (rooms[roomId]) {
            rooms[roomId].host_id = list[0].user_id;
            localStorage.setItem(LOCAL_ROOMS_KEY, JSON.stringify(rooms));
          }
        }
      }
      roomPlayersMap[roomId] = list;
    }

    localStorage.setItem(LOCAL_ROOM_PLAYERS_KEY, JSON.stringify(roomPlayersMap));
    this.broadcastEvent(roomId, { type: 'PLAYER_LEFT', userId });
  },

  /**
   * Broadcast real-time events to other browser tabs or devices
   */
  broadcastEvent(roomId: string, payload: any) {
    // 1. BroadcastChannel for same-origin tabs
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const channel = new BroadcastChannel(`imposter_room_${roomId}`);
        channel.postMessage({ ...payload, timestamp: Date.now() });
        channel.close();
      } catch {
        // ignore
      }
    }

    // 2. Server API event broadcast for cross-browser, incognito, and network devices
    try {
      fetch('/api/game/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, event: payload }),
      }).catch(() => {});
    } catch {
      // ignore
    }
  },

  /**
   * Subscribe to room events (via Server-Sent Events, BroadcastChannel, and Supabase)
   */
  subscribeToRoom(roomId: string, onEvent: (event: any) => void): () => void {
    let supabaseChannel: any = null;

    if (isSupabaseConfigured && supabase) {
      supabaseChannel = supabase.channel(`room:${roomId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'room_players', filter: `room_id=eq.${roomId}` }, (payload) => {
          onEvent({ type: 'DB_PLAYERS_CHANGED', payload });
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` }, (payload) => {
          onEvent({ type: 'DB_ROOM_CHANGED', payload });
        })
        .on('broadcast', { event: 'game_event' }, ({ payload }) => {
          onEvent(payload);
        })
        .subscribe();
    }

    // BroadcastChannel for instant same-browser updates
    let localChannel: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        localChannel = new BroadcastChannel(`imposter_room_${roomId}`);
        localChannel.onmessage = (e) => {
          onEvent(e.data);
        };
      } catch {
        // ignore
      }
    }

    // Server-Sent Events for cross-browser, incognito, and mobile phone sync
    let sseSource: EventSource | null = null;
    if (typeof window !== 'undefined' && 'EventSource' in window) {
      try {
        sseSource = new EventSource(`/api/events/${roomId}`);
        sseSource.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            if (data.type !== 'CONNECTED') {
              onEvent(data);
            }
          } catch {
            // ignore
          }
        };
      } catch {
        // ignore
      }
    }

    return () => {
      if (supabaseChannel && supabase) {
        supabase.removeChannel(supabaseChannel);
      }
      if (localChannel) {
        localChannel.close();
      }
      if (sseSource) {
        sseSource.close();
      }
    };
  },
};
