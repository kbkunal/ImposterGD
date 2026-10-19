import React, { useState } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useSocialStore } from '../../stores/useSocialStore';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import {
  Volume2,
  VolumeX,
  Bell,
  Users,
  Settings,
  LogOut,
  User,
  ShieldAlert,
  ChevronDown,
  Check,
  X,
  Play,
} from 'lucide-react';

export interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onAcceptGameInvite?: (roomCode: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  onAcceptGameInvite,
}) => {
  const { user, logout } = useAuthStore();
  const { soundEnabled, setSoundEnabled } = useSettingsStore();
  const { notifications, markNotificationRead, acceptFriendRequest } = useSocialStore();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-40 w-full bg-[#080B14]/85 backdrop-blur-md border-b border-slate-800/80 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Game Brand Logo */}
        <div
          className="flex items-center gap-2.5 cursor-pointer group"
          onClick={() => onNavigate(user ? 'dashboard' : 'landing')}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-rose-500 p-0.5 shadow-lg shadow-purple-600/30 group-hover:shadow-purple-600/50 transition-all group-hover:scale-105">
            <div className="w-full h-full bg-[#080B14] rounded-[10px] flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-purple-400 group-hover:text-rose-400 transition-colors" />
            </div>
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-wide text-white flex items-center gap-1 leading-none">
              WHO'S THE <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-400">IMPOSTER?</span>
            </h1>
            <span className="text-[10px] font-bold text-slate-400 tracking-wider hidden sm:block">
              Multiplayer Social Deduction
            </span>
          </div>
        </div>

        {/* Authenticated Nav Controls */}
        {user ? (
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Pass & Play shortcut */}
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onNavigate('offline-setup')}
              className="text-xs font-bold"
            >
              Pass & Play
            </Button>

            {/* Quick Play shortcut */}
            <Button
              size="sm"
              variant="primary"
              icon={<Play className="w-3.5 h-3.5 fill-current" />}
              onClick={() => onNavigate('dashboard')}
              className="hidden sm:inline-flex"
            >
              Lobby
            </Button>

            {/* Friends Navigation */}
            <button
              type="button"
              onClick={() => onNavigate('friends')}
              className={`p-2 rounded-xl border transition-all ${
                currentPage === 'friends'
                  ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
              title="Friends & Social"
            >
              <Users className="w-4 h-4" />
            </button>

            {/* Sound Toggle */}
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all"
              title={soundEnabled ? 'Mute Sound' : 'Unmute Sound'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-purple-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>

            {/* Notifications Bell Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all"
                title="Notifications & Game Invites"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-black flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-[#10162B] border border-purple-500/30 rounded-2xl shadow-2xl p-3 z-50 text-left space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-300">
                      Notifications
                    </span>
                    <span className="text-[10px] text-purple-400 font-bold">{notifications.length} total</span>
                  </div>

                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-500 py-3 text-center">No notifications yet</p>
                  ) : (
                    <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                      {notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`p-2.5 rounded-xl border text-xs transition-all ${
                            notif.read ? 'bg-slate-900/40 border-slate-800/80 text-slate-400' : 'bg-purple-950/30 border-purple-500/40 text-slate-200'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-bold text-white block">
                              {notif.type === 'GAME_INVITE' && '🎮 Game Invitation'}
                              {notif.type === 'FRIEND_REQUEST' && '👥 Friend Request'}
                              {notif.type === 'FRIEND_ACCEPTED' && '✨ Friend Added'}
                            </span>
                            {!notif.read && (
                              <button
                                type="button"
                                onClick={() => markNotificationRead(notif.id)}
                                className="text-[10px] text-purple-400 hover:underline"
                              >
                                Mark read
                              </button>
                            )}
                          </div>
                          <p className="mt-1 leading-snug">{notif.payload?.message || 'New event'}</p>

                          {/* Game Invite quick accept */}
                          {notif.type === 'GAME_INVITE' && notif.payload?.room_code && (
                            <div className="mt-2 flex gap-2">
                              <Button
                                size="sm"
                                variant="amber"
                                onClick={() => {
                                  markNotificationRead(notif.id);
                                  setShowNotifications(false);
                                  onAcceptGameInvite?.(notif.payload!.room_code!);
                                }}
                              >
                                Join Room ({notif.payload.room_code})
                              </Button>
                            </div>
                          )}

                          {/* Friend request quick accept */}
                          {notif.type === 'FRIEND_REQUEST' && (
                            <div className="mt-2 flex gap-2">
                              <Button
                                size="sm"
                                variant="success"
                                icon={<Check className="w-3 h-3" />}
                                onClick={() => {
                                  acceptFriendRequest(notif.id, user);
                                  markNotificationRead(notif.id);
                                }}
                              >
                                Accept
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User Profile Chip */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1 pl-2 bg-slate-900/70 border border-slate-800 hover:border-slate-700 rounded-full transition-all"
              >
                <div className="text-right hidden sm:block">
                  <span className="block text-xs font-black text-white leading-tight">
                    {user.display_name}
                  </span>
                  <span className="block text-[10px] text-amber-400 font-bold leading-tight">
                    {user.total_points} pts
                  </span>
                </div>
                <Avatar
                  avatarId={user.avatar_id}
                  avatarBackground={user.avatar_background}
                  avatarUrl={user.avatar_url}
                  size="sm"
                  showBorder={false}
                />
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 mr-1" />
              </button>

              {/* User Menu Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-[#10162B] border border-slate-800 rounded-2xl shadow-2xl p-1.5 z-50 text-left">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      onNavigate('profile');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-xl"
                  >
                    <User className="w-3.5 h-3.5 text-purple-400" />
                    Customize Character
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      onNavigate('settings');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-xl"
                  >
                    <Settings className="w-3.5 h-3.5 text-cyan-400" />
                    Game Settings
                  </button>

                  <div className="my-1 border-t border-slate-800" />

                  <button
                    type="button"
                    onClick={async () => {
                      setShowUserMenu(false);
                      await logout();
                      onNavigate('landing');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/10 rounded-xl"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Log Out
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Unauthenticated Navigation Links */
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onNavigate('offline-setup')}
              className="text-xs font-bold"
            >
              Pass & Play
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onNavigate('login')}
            >
              Log In
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => onNavigate('signup')}
            >
              Sign Up
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};
