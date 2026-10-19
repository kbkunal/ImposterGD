import type { Plugin, ViteDevServer } from 'vite';
import { IncomingMessage, ServerResponse } from 'node:http';

interface UserRecord {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  avatar_id: string;
  avatar_background: string;
  status_message?: string;
  password_hash: string;
  total_matches: number;
  wins: number;
  losses: number;
  imposter_wins: number;
  total_points: number;
  is_online: boolean;
  created_at: string;
}

interface RoomRecord {
  id: string;
  room_code: string;
  host_id: string;
  name: string;
  is_public: boolean;
  status: 'OPEN' | 'IN_GAME' | 'CLOSED';
  settings: any;
  created_at: string;
}

interface RoomPlayerRecord {
  user_id: string;
  seat_index: number;
  ready: boolean;
  connected: boolean;
  is_host: boolean;
  profile: any;
  clue_submitted?: string;
  card_viewed?: boolean;
}

interface FriendshipRecord {
  id: string;
  requester_id: string;
  recipient_id: string;
  requester: any;
  recipient: any;
  status: 'PENDING' | 'ACCEPTED' | 'BLOCKED';
  created_at: string;
}

interface NotificationRecord {
  id: string;
  recipient_id: string;
  actor: any;
  type: string;
  payload: any;
  read: boolean;
  created_at: string;
}

// In-Memory Global Server State (shared across all tabs, incognito windows, and network devices)
const globalUsers: Record<string, UserRecord> = {};
const globalRooms: Record<string, RoomRecord> = {};
const globalRoomPlayers: Record<string, RoomPlayerRecord[]> = {};
const globalRounds: Record<string, any> = {};
const globalPrivateRoles: Record<string, Record<string, any>> = {};
const globalVotes: Record<string, Record<string, string>> = {};
const globalMatches: Record<string, any> = {};
const globalFriendships: FriendshipRecord[] = [];
const globalNotifications: NotificationRecord[] = [];
// Store secret words and hints per round (server-side only, never exposed to clients)
const globalSecretWords: Record<string, { secretWord: string; imposterHint: string }> = {};

// SSE client listeners for real-time room events
const sseClients: Record<string, ServerResponse[]> = {};

function broadcastSse(roomId: string, data: any) {
  const clients = sseClients[roomId] || [];
  const message = `data: ${JSON.stringify(data)}\n\n`;
  clients.forEach(res => {
    try {
      res.write(message);
    } catch {
      // client disconnected
    }
  });
}

function parseBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
}

function sendJson(res: ServerResponse, status: number, data: any) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.end(JSON.stringify(data));
}

export function localApiPlugin(): Plugin {
  return {
    name: 'imposter-local-multiplayer-api',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';

        // CORS preflight
        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
          res.end();
          return;
        }

        // Only handle /api/* endpoints
        if (!url.startsWith('/api/')) {
          return next();
        }

        try {
          const parsedUrl = new URL(url, `http://${req.headers.host || 'localhost'}`);
          const pathname = parsedUrl.pathname;

          // 1. SSE Real-Time Room Subscription: /api/events/:roomId
          if (pathname.startsWith('/api/events/') && req.method === 'GET') {
            const roomId = pathname.split('/api/events/')[1];
            res.writeHead(200, {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
              'Access-Control-Allow-Origin': '*',
            });
            res.write(`data: ${JSON.stringify({ type: 'CONNECTED', roomId })}\n\n`);

            if (!sseClients[roomId]) {
              sseClients[roomId] = [];
            }
            sseClients[roomId].push(res);

            req.on('close', () => {
              sseClients[roomId] = (sseClients[roomId] || []).filter(c => c !== res);
            });
            return;
          }

          // 2. Auth: Sign Up
          if (pathname === '/api/auth/signup' && req.method === 'POST') {
            const body = await parseBody(req);
            const { username, password, displayName } = body;
            const cleanUser = (username || '').trim();
            const lowerUser = cleanUser.toLowerCase();

            if (globalUsers[lowerUser]) {
              return sendJson(res, 400, { error: 'Username is already taken. Please choose another one.' });
            }

            const id = 'usr_' + Math.random().toString(36).substring(2, 10);
            const userRecord: UserRecord = {
              id,
              username: cleanUser,
              display_name: (displayName || cleanUser).trim(),
              avatar_id: 'detective',
              avatar_background: '#8B5CF6',
              status_message: 'Ready for deception!',
              password_hash: password,
              total_matches: 0,
              wins: 0,
              losses: 0,
              imposter_wins: 0,
              total_points: 0,
              is_online: true,
              created_at: new Date().toISOString(),
            };

            globalUsers[lowerUser] = userRecord;
            const { password_hash: _, ...safeUser } = userRecord;
            return sendJson(res, 200, { user: safeUser });
          }

          // 3. Auth: Login
          if (pathname === '/api/auth/login' && req.method === 'POST') {
            const body = await parseBody(req);
            const { username, password } = body;
            const lowerUser = (username || '').trim().toLowerCase();
            const existing = globalUsers[lowerUser];

            if (!existing || existing.password_hash !== password) {
              return sendJson(res, 401, { error: 'Invalid username or password' });
            }

            existing.is_online = true;
            const { password_hash: _, ...safeUser } = existing;
            return sendJson(res, 200, { user: safeUser });
          }

          // 4. Auth: Update Profile
          if (pathname === '/api/auth/profile' && req.method === 'PUT') {
            const body = await parseBody(req);
            const { userId, updates } = body;
            const user = Object.values(globalUsers).find(u => u.id === userId);
            if (!user) {
              return sendJson(res, 404, { error: 'User not found' });
            }

            Object.assign(user, updates);
            const { password_hash: _, ...safeUser } = user;
            return sendJson(res, 200, { user: safeUser });
          }

          // 5. Users Search: /api/users/search?q=...&exclude=...
          if (pathname === '/api/users/search' && req.method === 'GET') {
            const q = (parsedUrl.searchParams.get('q') || '').trim().toLowerCase();
            const exclude = parsedUrl.searchParams.get('exclude') || '';

            const results = Object.values(globalUsers)
              .filter(u => u.id !== exclude && u.username.toLowerCase().includes(q))
              .map(({ password_hash: _, ...u }) => u)
              .slice(0, 10);

            return sendJson(res, 200, { users: results });
          }

          // 6. Social: Get Friendships
          if (pathname.startsWith('/api/social/friends/') && req.method === 'GET') {
            const userId = pathname.split('/api/social/friends/')[1];
            const list = globalFriendships.filter(
              f => f.requester_id === userId || f.recipient_id === userId
            ).map(f => {
              const isRequester = f.requester_id === userId;
              let status = 'ACCEPTED';
              if (f.status === 'PENDING') {
                status = isRequester ? 'PENDING_OUTGOING' : 'PENDING_INCOMING';
              }
              return {
                id: f.id,
                user_id: userId,
                friend: isRequester ? f.recipient : f.requester,
                status,
                created_at: f.created_at,
              };
            });
            return sendJson(res, 200, { friendships: list });
          }

          // 7. Social: Send Friend Request
          if (pathname === '/api/social/request' && req.method === 'POST') {
            const body = await parseBody(req);
            const { currentUser, targetUser } = body;

            if (currentUser.id === targetUser.id) {
              return sendJson(res, 400, { error: 'Cannot add yourself as a friend' });
            }

            const exists = globalFriendships.some(
              f =>
                (f.requester_id === currentUser.id && f.recipient_id === targetUser.id) ||
                (f.requester_id === targetUser.id && f.recipient_id === currentUser.id)
            );

            if (exists) {
              return sendJson(res, 400, { error: 'Friendship or request already exists' });
            }

            const friendship: FriendshipRecord = {
              id: 'fr_' + Math.random().toString(36).substring(2, 9),
              requester_id: currentUser.id,
              recipient_id: targetUser.id,
              requester: currentUser,
              recipient: targetUser,
              status: 'PENDING',
              created_at: new Date().toISOString(),
            };
            globalFriendships.push(friendship);

            // Create notification for recipient
            const notif: NotificationRecord = {
              id: 'notif_' + Math.random().toString(36).substring(2, 9),
              recipient_id: targetUser.id,
              actor: currentUser,
              type: 'FRIEND_REQUEST',
              payload: { message: `${currentUser.display_name} sent you a friend request` },
              read: false,
              created_at: new Date().toISOString(),
            };
            globalNotifications.unshift(notif);

            return sendJson(res, 200, { success: true, friendship });
          }

          // 8. Social: Accept Friend Request
          if (pathname === '/api/social/accept' && req.method === 'POST') {
            const body = await parseBody(req);
            const { friendshipId, currentUser } = body;
            const target = globalFriendships.find(f => f.id === friendshipId);
            if (target) {
              target.status = 'ACCEPTED';
              // Notification for requester
              globalNotifications.unshift({
                id: 'notif_' + Math.random().toString(36).substring(2, 9),
                recipient_id: target.requester_id,
                actor: currentUser,
                type: 'FRIEND_ACCEPTED',
                payload: { message: `${currentUser.display_name} accepted your friend request!` },
                read: false,
                created_at: new Date().toISOString(),
              });
              return sendJson(res, 200, { success: true });
            }
            return sendJson(res, 404, { error: 'Request not found' });
          }

          // 9. Social: Remove Friendship / Decline
          if (pathname.startsWith('/api/social/remove/') && req.method === 'DELETE') {
            const friendshipId = pathname.split('/api/social/remove/')[1];
            const idx = globalFriendships.findIndex(f => f.id === friendshipId);
            if (idx !== -1) {
              globalFriendships.splice(idx, 1);
            }
            return sendJson(res, 200, { success: true });
          }

          // 10. Social: Notifications
          if (pathname.startsWith('/api/social/notifications/') && req.method === 'GET') {
            // Be careful not to match /api/social/notifications/read (POST)
            const tail = pathname.split('/api/social/notifications/')[1];
            if (tail && tail !== 'read') {
              const userId = tail;
              const notifs = globalNotifications.filter(n => n.recipient_id === userId);
              return sendJson(res, 200, { notifications: notifs });
            }
          }

          if (pathname === '/api/social/notifications/read' && req.method === 'POST') {
            const body = await parseBody(req);
            const notif = globalNotifications.find(n => n.id === body.notifId);
            if (notif) notif.read = true;
            return sendJson(res, 200, { success: true });
          }

          if (pathname === '/api/social/invite' && req.method === 'POST') {
            const body = await parseBody(req);
            const { currentUser, friendUserId, roomCode, roomName } = body;
            globalNotifications.unshift({
              id: 'notif_' + Math.random().toString(36).substring(2, 9),
              recipient_id: friendUserId,
              actor: currentUser,
              type: 'GAME_INVITE',
              payload: {
                room_code: roomCode,
                room_name: roomName,
                message: `${currentUser.display_name} invited you to play in "${roomName}"!`,
              },
              read: false,
              created_at: new Date().toISOString(),
            });
            return sendJson(res, 200, { success: true });
          }

          // 11. Rooms: Create Room
          if (pathname === '/api/rooms' && req.method === 'POST') {
            const body = await parseBody(req);
            const { host, roomName, isPublic, settings, roomCode } = body;
            const roomId = 'rm_' + Math.random().toString(36).substring(2, 10);

            const room: RoomRecord = {
              id: roomId,
              room_code: roomCode,
              host_id: host.id,
              name: roomName || `${host.display_name}'s Room`,
              is_public: isPublic,
              status: 'OPEN',
              settings,
              created_at: new Date().toISOString(),
            };

            globalRooms[roomId] = room;
            globalRoomPlayers[roomId] = [
              {
                user_id: host.id,
                seat_index: 0,
                ready: true,
                connected: true,
                is_host: true,
                profile: host,
              },
            ];

            return sendJson(res, 200, { room });
          }

          // 12. Rooms: Get Room by Code
          if (pathname.startsWith('/api/rooms/code/') && req.method === 'GET') {
            const code = pathname.split('/api/rooms/code/')[1].toUpperCase();
            const room = Object.values(globalRooms).find(
              r => r.room_code === code && r.status !== 'CLOSED'
            );
            if (!room) {
              return sendJson(res, 404, { error: 'Room not found' });
            }
            return sendJson(res, 200, { room });
          }

          // 13. Rooms: Get Public Rooms
          if (pathname === '/api/rooms/public' && req.method === 'GET') {
            const list = Object.values(globalRooms).filter(r => r.is_public && r.status === 'OPEN');
            return sendJson(res, 200, { rooms: list });
          }

          // 14. Rooms: Get Room Players
          if (pathname.startsWith('/api/rooms/') && pathname.endsWith('/players') && req.method === 'GET') {
            const roomId = pathname.split('/api/rooms/')[1].split('/players')[0];
            const players = globalRoomPlayers[roomId] || [];
            return sendJson(res, 200, { players });
          }

          // 15. Rooms: Join Room
          if (pathname.startsWith('/api/rooms/') && pathname.endsWith('/join') && req.method === 'POST') {
            const roomId = pathname.split('/api/rooms/')[1].split('/join')[0];
            const body = await parseBody(req);
            const { player } = body;

            const room = globalRooms[roomId];
            if (!room) return sendJson(res, 404, { error: 'Room not found' });

            const players = globalRoomPlayers[roomId] || [];
            const existing = players.find(p => p.user_id === player.id);
            if (existing) {
              return sendJson(res, 200, { success: true, players });
            }

            if (players.length >= room.settings.max_players) {
              return sendJson(res, 400, { error: 'Room is at full capacity' });
            }

            const newPlayer: RoomPlayerRecord = {
              user_id: player.id,
              seat_index: players.length,
              ready: false,
              connected: true,
              is_host: room.host_id === player.id,
              profile: player,
            };

            players.push(newPlayer);
            globalRoomPlayers[roomId] = players;

            broadcastSse(roomId, { type: 'PLAYER_JOINED', player: newPlayer });
            return sendJson(res, 200, { success: true, players });
          }

          // 16. Rooms: Ready Toggle
          if (pathname.startsWith('/api/rooms/') && pathname.endsWith('/ready') && req.method === 'POST') {
            const roomId = pathname.split('/api/rooms/')[1].split('/ready')[0];
            const body = await parseBody(req);
            const { userId, ready } = body;

            const players = globalRoomPlayers[roomId] || [];
            const p = players.find(item => item.user_id === userId);
            if (p) {
              p.ready = ready;
              broadcastSse(roomId, { type: 'PLAYER_READY_CHANGED', userId, ready });
            }
            return sendJson(res, 200, { success: true });
          }

          // 17. Rooms: Leave Room
          if (pathname.startsWith('/api/rooms/') && pathname.endsWith('/leave') && req.method === 'POST') {
            const roomId = pathname.split('/api/rooms/')[1].split('/leave')[0];
            const body = await parseBody(req);
            const { userId } = body;

            let players = globalRoomPlayers[roomId] || [];
            const wasHost = players.some(p => p.user_id === userId && p.is_host);
            players = players.filter(p => p.user_id !== userId);

            if (players.length === 0) {
              delete globalRoomPlayers[roomId];
              if (globalRooms[roomId]) globalRooms[roomId].status = 'CLOSED';
            } else {
              players.forEach((p, idx) => {
                p.seat_index = idx;
              });
              if (wasHost && players.length > 0) {
                players[0].is_host = true;
                if (globalRooms[roomId]) globalRooms[roomId].host_id = players[0].user_id;
              }
              globalRoomPlayers[roomId] = players;
            }

            broadcastSse(roomId, { type: 'PLAYER_LEFT', userId });
            return sendJson(res, 200, { success: true });
          }

          // 18. Game: Start Round (stores round, private roles, match, and secret word on server)
          if (pathname === '/api/game/round/start' && req.method === 'POST') {
            const body = await parseBody(req);
            const { roomId, round, privateRoles, match, secretWord, imposterHint } = body;

            // Idempotent check: if this round ID is already registered, return existing
            if (globalRounds[round.id]) {
              return sendJson(res, 200, { success: true, round: globalRounds[round.id] });
            }

            globalRounds[round.id] = round;
            globalPrivateRoles[round.id] = privateRoles;
            globalMatches[match.id] = match;

            // Map room to current active round
            (globalRooms as any)[roomId + '_activeRoundId'] = round.id;
            (globalRooms as any)[roomId + '_activeMatchId'] = match.id;

            // Store secret word server-side (never leaked to public payloads)
            if (secretWord) {
              globalSecretWords[round.id] = {
                secretWord: secretWord,
                imposterHint: imposterHint || '',
              };
            }

            broadcastSse(roomId, { type: 'ROUND_STARTED', round, match });
            return sendJson(res, 200, { success: true, round });
          }

          // 18b. Game: Get Active Round for Room (for reconnects & page refresh recovery)
          if (pathname.startsWith('/api/game/current/') && req.method === 'GET') {
            const roomId = pathname.split('/api/game/current/')[1];
            const activeRoundId = (globalRooms as any)[roomId + '_activeRoundId'];
            const activeMatchId = (globalRooms as any)[roomId + '_activeMatchId'];

            if (!activeRoundId || !globalRounds[activeRoundId]) {
              return sendJson(res, 404, { error: 'No active round found for room' });
            }

            return sendJson(res, 200, {
              round: globalRounds[activeRoundId],
              match: globalMatches[activeMatchId] || null,
            });
          }

          // 19. Game: Update Round (phase changes, etc.)
          if (pathname === '/api/game/round/update' && req.method === 'POST') {
            const body = await parseBody(req);
            const { roomId, round } = body;
            if (round && round.id) {
              globalRounds[round.id] = round;
              if (roomId) {
                broadcastSse(roomId, { type: 'PHASE_CHANGED', round });
              }
            }
            return sendJson(res, 200, { success: true });
          }

          // 20. Game: Get Private Role (STRICT SECURITY: only requested userId's role returned)
          if (pathname.startsWith('/api/game/role/') && req.method === 'GET') {
            const parts = pathname.split('/api/game/role/')[1].split('/');
            const roundId = parts[0];
            const userId = parts[1];

            if (!globalRounds[roundId]) {
              return sendJson(res, 404, { error: 'Round not found or initializing', retryable: true });
            }

            const roles = globalPrivateRoles[roundId] || {};
            const role = roles[userId];
            if (!role) {
              return sendJson(res, 404, { error: 'Private role not yet generated for player', retryable: true });
            }

            // Return strictly the sanitized private role of the requester
            return sendJson(res, 200, { role });
          }

          // 21. Game: Submit Vote (stored server-side)
          if (pathname === '/api/game/vote' && req.method === 'POST') {
            const body = await parseBody(req);
            const { roomId, roundId, voterId, targetId } = body;

            if (!globalVotes[roundId]) {
              globalVotes[roundId] = {};
            }
            globalVotes[roundId][voterId] = targetId;

            // Update round vote_submissions
            if (globalRounds[roundId]) {
              const currentSubs = globalRounds[roundId].vote_submissions || [];
              if (!currentSubs.includes(voterId)) {
                globalRounds[roundId].vote_submissions = [...currentSubs, voterId];
              }
            }

            if (roomId) {
              broadcastSse(roomId, { type: 'VOTE_SUBMITTED', roundId, voterId });
            }

            return sendJson(res, 200, { success: true });
          }

          // 22. Game: Get Votes for a Round
          if (pathname.startsWith('/api/game/votes/') && req.method === 'GET') {
            const roundId = pathname.split('/api/game/votes/')[1];
            const votes = globalVotes[roundId] || {};
            return sendJson(res, 200, { votes });
          }

          // 23. Game: Get Secret Word for a Round (used during evaluation)
          if (pathname.startsWith('/api/game/secret/') && req.method === 'GET') {
            const roundId = pathname.split('/api/game/secret/')[1];
            const secret = globalSecretWords[roundId];
            if (!secret) {
              return sendJson(res, 404, { error: 'Secret not found' });
            }
            return sendJson(res, 200, secret);
          }

          // 24. Game: Mark Card Viewed
          if (pathname === '/api/game/card-viewed' && req.method === 'POST') {
            const body = await parseBody(req);
            const { roomId, roundId, userId } = body;

            const roles = globalPrivateRoles[roundId];
            if (roles && roles[userId]) {
              roles[userId].card_viewed = true;
            }

            if (roomId) {
              broadcastSse(roomId, { type: 'CARD_VIEWED', roundId, userId });
            }

            return sendJson(res, 200, { success: true });
          }

          // 25. Game: Broadcast Generic Game Event
          if (pathname === '/api/game/event' && req.method === 'POST') {
            const body = await parseBody(req);
            const { roomId, event } = body;
            broadcastSse(roomId, event);
            return sendJson(res, 200, { success: true });
          }

          return next();
        } catch (err: unknown) {
          console.error('Local API Plugin Error:', err);
          return sendJson(res, 500, { error: (err as Error).message });
        }
      });
    },
  };
}
