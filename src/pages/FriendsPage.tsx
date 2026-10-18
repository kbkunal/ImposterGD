import React, { useState } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { useSocialStore } from '../stores/useSocialStore';
import { useGameStore } from '../stores/useGameStore';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  Users,
  Search,
  UserPlus,
  Check,
  X,
  UserMinus,
  Send,
  Gamepad2,
  Clock,
  Sparkles,
} from 'lucide-react';

export interface FriendsPageProps {
  onNavigate: (page: string) => void;
}

export const FriendsPage: React.FC<FriendsPageProps> = ({ onNavigate }) => {
  const { user } = useAuthStore();
  const {
    friends,
    searchResults,
    isSearching,
    searchUsers,
    sendFriendRequest,
    acceptFriendRequest,
    removeFriend,
    sendGameInvite,
    clearSearchResults,
  } = useSocialStore();
  const { currentRoom } = useGameStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.id) {
      searchUsers(searchQuery, user.id);
    }
  };

  const handleSendRequest = async (targetUser: any) => {
    if (!user) return;
    const res = await sendFriendRequest(user, targetUser);
    if (res.success) {
      setFeedbackMessage(`Friend request sent to ${targetUser.display_name}!`);
      setTimeout(() => setFeedbackMessage(null), 3500);
      clearSearchResults();
      setSearchQuery('');
    } else {
      setFeedbackMessage(res.error || 'Failed to send friend request');
      setTimeout(() => setFeedbackMessage(null), 3500);
    }
  };

  const handleSendGameInvite = async (friendUserId: string, friendName: string) => {
    if (!user || !currentRoom) return;
    const ok = await sendGameInvite(user, friendUserId, currentRoom.room_code, currentRoom.name);
    if (ok) {
      setFeedbackMessage(`Invitation sent to ${friendName}!`);
      setTimeout(() => setFeedbackMessage(null), 3000);
    }
  };

  const acceptedFriends = friends.filter(f => f.status === 'ACCEPTED');
  const incomingRequests = friends.filter(f => f.status === 'PENDING_INCOMING');
  const outgoingRequests = friends.filter(f => f.status === 'PENDING_OUTGOING');

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 text-left">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-purple-400">
            Social & Party Network
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2 mt-0.5">
            <Users className="w-7 h-7 text-purple-400" />
            Friends & Invitations
          </h2>
        </div>

        {currentRoom && (
          <div className="flex items-center gap-2 bg-purple-950/40 border border-purple-500/30 px-3.5 py-2 rounded-2xl">
            <Gamepad2 className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-bold text-white">
              Active Room: <span className="font-mono text-amber-400">{currentRoom.room_code}</span>
            </span>
            <Button size="sm" variant="amber" onClick={() => onNavigate('waiting-room')}>
              Back to Table
            </Button>
          </div>
        )}
      </div>

      {feedbackMessage && (
        <div className="p-3 bg-purple-500/20 border border-purple-500/40 rounded-xl text-xs text-purple-200 font-bold text-center">
          {feedbackMessage}
        </div>
      )}

      {/* User Search Bar */}
      <div className="bg-[#10162B] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h4 className="text-sm font-black uppercase tracking-wider text-white">
          Find Other Players by Username
        </h4>

        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type username to search..."
            leftIcon={<Search className="w-4 h-4" />}
            className="flex-1"
          />
          <Button
            type="submit"
            variant="primary"
            isLoading={isSearching}
            disabled={!searchQuery.trim()}
          >
            Search
          </Button>
        </form>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="pt-2 space-y-2">
            <span className="text-xs font-bold text-slate-400">Search Results:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {searchResults.map((foundUser) => {
                const isAlreadyFriend = friends.some(
                  f => f.friend.id === foundUser.id && f.status === 'ACCEPTED'
                );
                return (
                  <div
                    key={foundUser.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-[#090D1A] border border-slate-800"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <Avatar
                        avatarId={foundUser.avatar_id}
                        avatarBackground={foundUser.avatar_background}
                        avatarUrl={foundUser.avatar_url}
                        size="sm"
                      />
                      <div className="truncate">
                        <span className="font-bold text-white block truncate">
                          {foundUser.display_name}
                        </span>
                        <span className="text-xs text-slate-400 truncate">
                          @{foundUser.username}
                        </span>
                      </div>
                    </div>

                    {isAlreadyFriend ? (
                      <span className="text-xs text-emerald-400 font-bold px-2 py-1">Friends</span>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={<UserPlus className="w-3.5 h-3.5" />}
                        onClick={() => handleSendRequest(foundUser)}
                      >
                        Add Friend
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Pending Requests Section */}
      {incomingRequests.length > 0 && (
        <div className="bg-[#10162B] border border-purple-500/30 rounded-3xl p-6 shadow-xl space-y-4">
          <h4 className="text-sm font-black uppercase tracking-wider text-purple-300">
            Incoming Friend Requests ({incomingRequests.length})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {incomingRequests.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-[#090D1A] border border-purple-500/30"
              >
                <div className="flex items-center gap-3 truncate">
                  <Avatar
                    avatarId={req.friend.avatar_id}
                    avatarBackground={req.friend.avatar_background}
                    avatarUrl={req.friend.avatar_url}
                    size="sm"
                  />
                  <div className="truncate">
                    <span className="font-bold text-white block truncate">
                      {req.friend.display_name}
                    </span>
                    <span className="text-xs text-slate-400 truncate">
                      @{req.friend.username}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="success"
                    icon={<Check className="w-3.5 h-3.5" />}
                    onClick={() => user && acceptFriendRequest(req.id, user)}
                  >
                    Accept
                  </Button>
                  <button
                    type="button"
                    onClick={() => removeFriend(req.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800"
                    title="Decline"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends List Section */}
      <div className="bg-[#10162B] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h4 className="text-sm font-black uppercase tracking-wider text-white">
            Your Friends ({acceptedFriends.length})
          </h4>
          <span className="text-xs text-slate-400 font-semibold">
            {acceptedFriends.filter(f => f.friend.is_online).length} Online
          </span>
        </div>

        {acceptedFriends.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <Users className="w-10 h-10 mx-auto text-slate-600" />
            <p className="text-sm text-slate-400">You don't have any friends added yet.</p>
            <p className="text-xs text-slate-500">
              Search by username above to add your game night companions!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {acceptedFriends.map((f) => (
              <div
                key={f.id}
                className="flex flex-col justify-between p-3.5 rounded-2xl bg-[#090D1A] border border-slate-800 hover:border-slate-700 transition-all space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar
                      avatarId={f.friend.avatar_id}
                      avatarBackground={f.friend.avatar_background}
                      avatarUrl={f.friend.avatar_url}
                      size="sm"
                    />
                    <span
                      className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-[#090D1A] ${
                        f.friend.is_online ? 'bg-emerald-400' : 'bg-slate-600'
                      }`}
                      title={f.friend.is_online ? 'Online' : 'Offline'}
                    />
                  </div>

                  <div className="truncate flex-1">
                    <span className="font-bold text-white block text-sm truncate">
                      {f.friend.display_name}
                    </span>
                    <span className="text-xs text-slate-400 block truncate">
                      @{f.friend.username}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  {currentRoom ? (
                    <Button
                      size="sm"
                      variant="amber"
                      icon={<Send className="w-3 h-3" />}
                      onClick={() => handleSendGameInvite(f.friend.id, f.friend.display_name)}
                    >
                      Invite to Room
                    </Button>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-bold">
                      {f.friend.total_matches} matches played
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => removeFriend(f.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800/80 transition-colors"
                    title="Remove Friend"
                  >
                    <UserMinus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
