import { supabase, isSupabaseConfigured } from '../supabase/client';
import { Friendship, NotificationItem, UserProfile } from '../../types/game';

const LOCAL_FRIENDSHIPS_KEY = 'imposter_local_friendships';
const LOCAL_NOTIFICATIONS_KEY = 'imposter_local_notifications';
const LOCAL_USERS_DB_KEY = 'imposter_local_users_db';

export const friendService = {
  /**
   * Search registered users by username
   */
  async searchUsers(query: string, currentUserId: string): Promise<UserProfile[]> {
    if (!query || query.trim().length < 2) return [];
    const clean = query.trim().toLowerCase();

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', `%${clean}%`)
        .neq('id', currentUserId)
        .limit(10);

      if (error) {
        console.error('Error searching users:', error);
        return [];
      }
      return (data || []) as UserProfile[];
    }

    // Try central API server (finds users from any tab, incognito, or browser)
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(clean)}&exclude=${encodeURIComponent(currentUserId)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.users && json.users.length > 0) {
          return json.users as UserProfile[];
        }
      }
    } catch {
      // fallback
    }

    const rawDb = localStorage.getItem(LOCAL_USERS_DB_KEY);
    if (!rawDb) return [];
    try {
      const db: Record<string, UserProfile> = JSON.parse(rawDb);
      return Object.values(db)
        .filter(u => u.id !== currentUserId && u.username.toLowerCase().includes(clean))
        .slice(0, 10);
    } catch {
      return [];
    }
  },

  /**
   * Get friendships for current user
   */
  async getFriendships(currentUserId: string): Promise<Friendship[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('friendships')
        .select(`
          id,
          requester_id,
          recipient_id,
          status,
          created_at,
          requester:requester_id (*),
          recipient:recipient_id (*)
        `)
        .or(`requester_id.eq.${currentUserId},recipient_id.eq.${currentUserId}`);

      if (error) {
        console.error('Error fetching friendships:', error);
        return [];
      }

      return (data || []).map((row: any) => {
        const isRequester = row.requester_id === currentUserId;
        const friend = isRequester ? row.recipient : row.requester;
        let status: Friendship['status'] = 'ACCEPTED';
        if (row.status === 'PENDING') {
          status = isRequester ? 'PENDING_OUTGOING' : 'PENDING_INCOMING';
        }

        return {
          id: row.id,
          user_id: currentUserId,
          friend: friend as UserProfile,
          status,
          created_at: row.created_at,
        };
      });
    }

    // Try central API server
    try {
      const res = await fetch(`/api/social/friends/${currentUserId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.friendships) return json.friendships as Friendship[];
      }
    } catch {
      // fallback
    }

    const raw = localStorage.getItem(LOCAL_FRIENDSHIPS_KEY);
    if (!raw) return [];
    try {
      const all: any[] = JSON.parse(raw);
      return all
        .filter(f => f.requester_id === currentUserId || f.recipient_id === currentUserId)
        .map(f => {
          const isRequester = f.requester_id === currentUserId;
          let status: Friendship['status'] = 'ACCEPTED';
          if (f.status === 'PENDING') {
            status = isRequester ? 'PENDING_OUTGOING' : 'PENDING_INCOMING';
          }
          return {
            id: f.id,
            user_id: currentUserId,
            friend: isRequester ? f.recipient : f.requester,
            status,
            created_at: f.created_at,
          };
        });
    } catch {
      return [];
    }
  },

  /**
   * Send a friend request
   */
  async sendFriendRequest(currentUser: UserProfile, targetUser: UserProfile): Promise<{ success: boolean; error?: string }> {
    if (currentUser.id === targetUser.id) {
      return { success: false, error: 'You cannot add yourself as a friend' };
    }

    if (isSupabaseConfigured && supabase) {
      const { data: existing } = await supabase
        .from('friendships')
        .select('id, status')
        .or(`and(requester_id.eq.${currentUser.id},recipient_id.eq.${targetUser.id}),and(requester_id.eq.${targetUser.id},recipient_id.eq.${currentUser.id})`)
        .maybeSingle();

      if (existing) {
        return { success: false, error: 'Friendship or request already exists' };
      }

      const { data, error } = await supabase
        .from('friendships')
        .insert({
          requester_id: currentUser.id,
          recipient_id: targetUser.id,
          status: 'PENDING',
        })
        .select()
        .single();

      if (error) return { success: false, error: error.message };

      await supabase.from('notifications').insert({
        recipient_id: targetUser.id,
        actor_id: currentUser.id,
        type: 'FRIEND_REQUEST',
        payload: { message: `${currentUser.display_name} sent you a friend request` },
      });

      return { success: true };
    }

    // Try central API server
    try {
      const res = await fetch('/api/social/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentUser, targetUser }),
      });

      if (res.ok) {
        return { success: true };
      } else {
        const json = await res.json();
        return { success: false, error: json.error || 'Failed to send friend request' };
      }
    } catch {
      // fallback
    }

    const raw = localStorage.getItem(LOCAL_FRIENDSHIPS_KEY);
    const list: any[] = raw ? JSON.parse(raw) : [];

    const exists = list.some(
      f =>
        (f.requester_id === currentUser.id && f.recipient_id === targetUser.id) ||
        (f.requester_id === targetUser.id && f.recipient_id === currentUser.id)
    );

    if (exists) {
      return { success: false, error: 'Friendship or request already exists' };
    }

    const newFriendship = {
      id: 'fr_' + Math.random().toString(36).substring(2, 9),
      requester_id: currentUser.id,
      recipient_id: targetUser.id,
      requester: currentUser,
      recipient: targetUser,
      status: 'PENDING',
      created_at: new Date().toISOString(),
    };
    list.push(newFriendship);
    localStorage.setItem(LOCAL_FRIENDSHIPS_KEY, JSON.stringify(list));

    this.addNotification({
      id: 'notif_' + Math.random().toString(36).substring(2, 9),
      recipient_id: targetUser.id,
      actor: currentUser,
      type: 'FRIEND_REQUEST',
      payload: { message: `${currentUser.display_name} sent you a friend request` },
      read: false,
      created_at: new Date().toISOString(),
    });

    return { success: true };
  },

  /**
   * Accept friend request
   */
  async acceptFriendRequest(friendshipId: string, currentUser: UserProfile): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('friendships')
        .update({ status: 'ACCEPTED', updated_at: new Date().toISOString() })
        .eq('id', friendshipId)
        .select('requester_id')
        .single();

      if (error) return false;

      if (data?.requester_id) {
        await supabase.from('notifications').insert({
          recipient_id: data.requester_id,
          actor_id: currentUser.id,
          type: 'FRIEND_ACCEPTED',
          payload: { message: `${currentUser.display_name} accepted your friend request!` },
        });
      }
      return true;
    }

    try {
      const res = await fetch('/api/social/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendshipId, currentUser }),
      });
      if (res.ok) return true;
    } catch {
      // fallback
    }

    const raw = localStorage.getItem(LOCAL_FRIENDSHIPS_KEY);
    if (!raw) return false;
    const list: any[] = JSON.parse(raw);
    const target = list.find(f => f.id === friendshipId);
    if (target) {
      target.status = 'ACCEPTED';
      localStorage.setItem(LOCAL_FRIENDSHIPS_KEY, JSON.stringify(list));

      this.addNotification({
        id: 'notif_' + Math.random().toString(36).substring(2, 9),
        recipient_id: target.requester_id,
        actor: currentUser,
        type: 'FRIEND_ACCEPTED',
        payload: { message: `${currentUser.display_name} accepted your friend request!` },
        read: false,
        created_at: new Date().toISOString(),
      });
      return true;
    }
    return false;
  },

  /**
   * Decline or remove friendship / cancel request
   */
  async removeFriendship(friendshipId: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('friendships').delete().eq('id', friendshipId);
      return !error;
    }

    try {
      const res = await fetch(`/api/social/remove/${friendshipId}`, { method: 'DELETE' });
      if (res.ok) return true;
    } catch {
      // fallback
    }

    const raw = localStorage.getItem(LOCAL_FRIENDSHIPS_KEY);
    if (!raw) return false;
    const list: any[] = JSON.parse(raw);
    const filtered = list.filter(f => f.id !== friendshipId);
    localStorage.setItem(LOCAL_FRIENDSHIPS_KEY, JSON.stringify(filtered));
    return true;
  },

  /**
   * Send game room invitation to a friend
   */
  async sendGameInvite(currentUser: UserProfile, friendUserId: string, roomCode: string, roomName: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('notifications').insert({
        recipient_id: friendUserId,
        actor_id: currentUser.id,
        type: 'GAME_INVITE',
        payload: {
          room_code: roomCode,
          room_name: roomName,
          message: `${currentUser.display_name} invited you to play in "${roomName}"!`,
        },
      });
      return !error;
    }

    try {
      const res = await fetch('/api/social/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentUser, friendUserId, roomCode, roomName }),
      });
      if (res.ok) return true;
    } catch {
      // fallback
    }

    this.addNotification({
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
    return true;
  },

  /**
   * Get user notifications
   */
  async getNotifications(currentUserId: string): Promise<NotificationItem[]> {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase
        .from('notifications')
        .select(`
          id,
          recipient_id,
          type,
          payload,
          read,
          created_at,
          actor:actor_id (*)
        `)
        .eq('recipient_id', currentUserId)
        .order('created_at', { ascending: false })
        .limit(20);

      return (data || []).map((row: any) => ({
        id: row.id,
        recipient_id: row.recipient_id,
        actor: row.actor as UserProfile,
        type: row.type,
        payload: row.payload,
        read: row.read,
        created_at: row.created_at,
      }));
    }

    try {
      const res = await fetch(`/api/social/notifications/${currentUserId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.notifications) return json.notifications as NotificationItem[];
      }
    } catch {
      // fallback
    }

    const raw = localStorage.getItem(LOCAL_NOTIFICATIONS_KEY);
    if (!raw) return [];
    try {
      const all: NotificationItem[] = JSON.parse(raw);
      return all
        .filter(n => n.recipient_id === currentUserId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch {
      return [];
    }
  },

  /**
   * Mark notification as read
   */
  async markNotificationRead(notifId: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('notifications').update({ read: true }).eq('id', notifId);
      return;
    }

    try {
      await fetch('/api/social/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifId }),
      });
    } catch {
      // fallback
    }

    const raw = localStorage.getItem(LOCAL_NOTIFICATIONS_KEY);
    if (!raw) return;
    try {
      const all: NotificationItem[] = JSON.parse(raw);
      const target = all.find(n => n.id === notifId);
      if (target) {
        target.read = true;
        localStorage.setItem(LOCAL_NOTIFICATIONS_KEY, JSON.stringify(all));
      }
    } catch {
      // ignore
    }
  },

  addNotification(notif: NotificationItem) {
    const raw = localStorage.getItem(LOCAL_NOTIFICATIONS_KEY);
    const list: NotificationItem[] = raw ? JSON.parse(raw) : [];
    list.unshift(notif);
    localStorage.setItem(LOCAL_NOTIFICATIONS_KEY, JSON.stringify(list.slice(0, 50)));
  },
};
