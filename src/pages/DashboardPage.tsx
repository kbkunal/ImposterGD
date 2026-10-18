import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { useSocialStore } from '../stores/useSocialStore';
import { useGameStore } from '../stores/useGameStore';
import { roomService } from '../services/rooms/roomService';
import { Room } from '../types/game';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  Plus,
  Hash,
  Users,
  Trophy,
  Flame,
  Award,
  Sparkles,
  ArrowRight,
  Globe,
  Lock,
  UserPlus,
  Play,
  RotateCcw,
} from 'lucide-react';

export interface DashboardPageProps {
  onNavigate: (page: string) => void;
  onJoinRoomByCode: (code: string) => Promise<boolean>;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  onJoinRoomByCode,
}) => {
  const { user } = useAuthStore();
  const { friends, notifications, loadSocialData } = useSocialStore();
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [publicRooms, setPublicRooms] = useState<Room[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadSocialData(user.id);
      loadRooms();
    }
  }, [user?.id]);

  const loadRooms = async () => {
    setIsLoadingRooms(true);
    const rooms = await roomService.getPublicRooms();
    setPublicRooms(rooms);
    setIsLoadingRooms(false);
  };

  const handleJoinWithCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError(null);
    const clean = roomCodeInput.trim().toUpperCase();
    if (clean.length < 4) {
      setJoinError('Please enter a valid room code');
      return;
    }
    setIsJoining(true);
    const success = await onJoinRoomByCode(clean);
    setIsJoining(false);
    if (!success) {
      setJoinError('Could not join room. Check the code and try again.');
    }
  };

  const onlineFriends = friends.filter(f => f.status === 'ACCEPTED' && f.friend.is_online);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 text-left">
      {/* Personalized Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#141B33] to-[#0D1224] p-6 rounded-3xl border border-purple-500/20 shadow-xl">
        <div className="flex items-center gap-4">
          <Avatar
            avatarId={user?.avatar_id}
            avatarBackground={user?.avatar_background}
            avatarUrl={user?.avatar_url}
            size="lg"
            className="cursor-pointer hover:scale-105 transition-transform"
            onClick={() => onNavigate('profile')}
          />
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-purple-400">
              Welcome to the Lobby
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Hello, {user?.display_name}!
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Ready to bluff, deduce, and conquer game night?
            </p>
          </div>
        </div>

        {/* Profile shortcut & quick stats */}
        <div className="flex items-center gap-3">
          <div className="bg-[#090D1A] px-4 py-2.5 rounded-2xl border border-slate-800 text-center">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">Career Points</span>
            <span className="text-xl font-black text-amber-400 flex items-center justify-center gap-1">
              <Trophy className="w-4 h-4" />
              {user?.total_points || 0}
            </span>
          </div>

          <Button
            size="sm"
            variant="secondary"
            onClick={() => onNavigate('profile')}
          >
            Edit Profile
          </Button>
        </div>
      </div>

      {/* Main Action Cards: Create Game & Join Game */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Create Game Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#1C1636] to-[#100E26] border-2 border-purple-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col justify-between group hover:border-purple-400/70 transition-all">
          <div className="space-y-3 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/40">
              <Plus className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-black text-white">Host a Game Room</h3>
            <p className="text-xs sm:text-sm text-slate-300">
              Create a custom private or public table. Configure word categories, difficulty, clue timers, and invite your friends.
            </p>
          </div>

          <div className="pt-6 relative z-10">
            <Button
              size="lg"
              variant="primary"
              icon={<Play className="w-4 h-4 fill-current" />}
              onClick={() => onNavigate('create-room')}
              fullWidth
            >
              Create New Room
            </Button>
          </div>
        </div>

        {/* Join With Code Card */}
        <div className="bg-[#11172E] border-2 border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col justify-between hover:border-cyan-400/60 transition-all">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-600 text-white flex items-center justify-center shadow-lg shadow-cyan-600/40">
              <Hash className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-black text-white">Join with Room Code</h3>
            <p className="text-xs sm:text-sm text-slate-300">
              Have a 6-letter room code from your host? Enter it below to take a seat at the table immediately.
            </p>
          </div>

          <form onSubmit={handleJoinWithCode} className="space-y-3 pt-4">
            <div className="flex gap-2">
              <Input
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                placeholder="e.g. 7X9K2B"
                maxLength={8}
                className="font-mono text-center text-base tracking-widest uppercase font-bold"
              />
              <Button
                type="submit"
                variant="amber"
                isLoading={isJoining}
                disabled={roomCodeInput.trim().length < 3}
              >
                Join
              </Button>
            </div>
            {joinError && <p className="text-xs text-rose-400 font-medium">{joinError}</p>}
          </form>
        </div>
      </div>

      {/* Two Column Layout: Public Room Browser & Friends Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Public Room Browser */}
        <div className="lg:col-span-2 bg-[#0E1428] border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400" />
              <h4 className="text-sm font-black uppercase tracking-wider text-white">
                Public Rooms
              </h4>
            </div>
            <button
              type="button"
              onClick={loadRooms}
              className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Refresh
            </button>
          </div>

          {publicRooms.length === 0 ? (
            <div className="py-10 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-900 flex items-center justify-center text-slate-500">
                <Lock className="w-6 h-6" />
              </div>
              <p className="text-sm text-slate-400">
                No open public rooms found right now.
              </p>
              <Button size="sm" variant="secondary" onClick={() => onNavigate('create-room')}>
                Host a Public Game
              </Button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {publicRooms.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all"
                >
                  <div>
                    <h5 className="text-sm font-extrabold text-white">{r.name}</h5>
                    <span className="text-xs text-slate-400 font-mono">Code: {r.room_code}</span>
                    <span className="text-xs text-purple-400 ml-2 font-medium">• Category: {r.settings.category}</span>
                  </div>

                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => onJoinRoomByCode(r.room_code)}
                  >
                    Take Seat
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Friends & Social Quick Panel */}
        <div className="bg-[#0E1428] border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              <h4 className="text-sm font-black uppercase tracking-wider text-white">
                Friends
              </h4>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('friends')}
              className="text-xs text-purple-400 hover:text-purple-300 font-semibold"
            >
              View All →
            </button>
          </div>

          {friends.length === 0 ? (
            <div className="py-6 text-center space-y-2">
              <p className="text-xs text-slate-400">You haven't added any friends yet.</p>
              <Button
                size="sm"
                variant="secondary"
                icon={<UserPlus className="w-3.5 h-3.5" />}
                onClick={() => onNavigate('friends')}
              >
                Search & Add Friends
              </Button>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {friends.slice(0, 6).map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-900/40 border border-slate-800/60 text-xs"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Avatar
                      avatarId={f.friend.avatar_id}
                      avatarBackground={f.friend.avatar_background}
                      avatarUrl={f.friend.avatar_url}
                      size="xs"
                      showBorder={false}
                    />
                    <div className="truncate">
                      <span className="font-bold text-white block truncate">
                        {f.friend.display_name}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate">
                        @{f.friend.username}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      f.friend.is_online ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-slate-600'
                    }`}
                    title={f.friend.is_online ? 'Online' : 'Offline'}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Personal Career Stats Summary */}
          <div className="pt-2 border-t border-slate-800 text-xs space-y-1.5">
            <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
              Your Game Night Record
            </span>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Matches</span>
                <span className="text-sm font-black text-white">{user?.total_matches || 0}</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-emerald-400 block">Wins</span>
                <span className="text-sm font-black text-white">{user?.wins || 0}</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-rose-400 block">Imposter</span>
                <span className="text-sm font-black text-white">{user?.imposter_wins || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
