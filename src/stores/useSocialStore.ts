import { create } from 'zustand';
import { Friendship, NotificationItem, UserProfile } from '../types/game';
import { friendService } from '../services/friends/friendService';

interface SocialState {
  friends: Friendship[];
  notifications: NotificationItem[];
  searchResults: UserProfile[];
  isLoading: boolean;
  isSearching: boolean;
  loadSocialData: (userId: string) => Promise<void>;
  searchUsers: (query: string, currentUserId: string) => Promise<void>;
  sendFriendRequest: (currentUser: UserProfile, targetUser: UserProfile) => Promise<{ success: boolean; error?: string }>;
  acceptFriendRequest: (friendshipId: string, currentUser: UserProfile) => Promise<boolean>;
  removeFriend: (friendshipId: string) => Promise<boolean>;
  sendGameInvite: (currentUser: UserProfile, friendUserId: string, roomCode: string, roomName: string) => Promise<boolean>;
  markNotificationRead: (notifId: string) => Promise<void>;
  clearSearchResults: () => void;
}

export const useSocialStore = create<SocialState>((set, get) => ({
  friends: [],
  notifications: [],
  searchResults: [],
  isLoading: false,
  isSearching: false,

  loadSocialData: async (userId: string) => {
    if (!userId) return;
    try {
      set({ isLoading: true });
      const [friends, notifications] = await Promise.all([
        friendService.getFriendships(userId),
        friendService.getNotifications(userId),
      ]);
      set({ friends, notifications, isLoading: false });
    } catch (err) {
      console.warn('Failed to load social data:', err);
      set({ isLoading: false });
    }
  },

  searchUsers: async (query: string, currentUserId: string) => {
    if (!query.trim()) {
      set({ searchResults: [], isSearching: false });
      return;
    }
    set({ isSearching: true });
    const results = await friendService.searchUsers(query, currentUserId);
    set({ searchResults: results, isSearching: false });
  },

  sendFriendRequest: async (currentUser: UserProfile, targetUser: UserProfile) => {
    const res = await friendService.sendFriendRequest(currentUser, targetUser);
    if (res.success) {
      await get().loadSocialData(currentUser.id);
    }
    return res;
  },

  acceptFriendRequest: async (friendshipId: string, currentUser: UserProfile) => {
    const ok = await friendService.acceptFriendRequest(friendshipId, currentUser);
    if (ok) {
      await get().loadSocialData(currentUser.id);
    }
    return ok;
  },

  removeFriend: async (friendshipId: string) => {
    const ok = await friendService.removeFriendship(friendshipId);
    if (ok) {
      set(state => ({ friends: state.friends.filter(f => f.id !== friendshipId) }));
    }
    return ok;
  },

  sendGameInvite: async (currentUser: UserProfile, friendUserId: string, roomCode: string, roomName: string) => {
    return friendService.sendGameInvite(currentUser, friendUserId, roomCode, roomName);
  },

  markNotificationRead: async (notifId: string) => {
    await friendService.markNotificationRead(notifId);
    set(state => ({
      notifications: state.notifications.map(n => (n.id === notifId ? { ...n, read: true } : n)),
    }));
  },

  clearSearchResults: () => set({ searchResults: [], isSearching: false }),
}));
