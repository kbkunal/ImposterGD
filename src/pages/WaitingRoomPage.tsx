import React, { useState } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { useGameStore } from '../stores/useGameStore';
import { VirtualRoundTable } from '../components/game/VirtualRoundTable';
import { Button } from '../components/ui/Button';
import {
  Copy,
  Check,
  Play,
  Users,
  Share2,
  Lock,
  Globe,
  LogOut,
  Sparkles,
} from 'lucide-react';

export interface WaitingRoomPageProps {
  onNavigate: (page: string) => void;
}

export const WaitingRoomPage: React.FC<WaitingRoomPageProps> = ({ onNavigate }) => {
  const { user } = useAuthStore();
  const {
    currentRoom,
    players,
    isLoading,
    toggleReady,
    startGameRound,
    leaveCurrentRoom,
  } = useGameStore();

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!currentRoom || !user) {
    return (
      <div className="py-20 text-center space-y-4">
        <p className="text-slate-400">No active room found.</p>
        <Button variant="primary" onClick={() => onNavigate('dashboard')}>
          Back to Lobby
        </Button>
      </div>
    );
  }

  const isHost = currentRoom.host_id === user.id;
  const myPlayer = players.find(p => p.user_id === user.id);
  const isMyReady = Boolean(myPlayer?.ready);
  const totalPlayers = players.length;
  const minPlayers = currentRoom.settings.min_players || 3;
  const canStart = isHost && totalPlayers >= minPlayers;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentRoom.room_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/?join=${currentRoom.room_code}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleLaunchGame = async () => {
    await startGameRound(user);
    onNavigate('game');
  };

  const handleLeave = async () => {
    await leaveCurrentRoom(user);
    onNavigate('dashboard');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6 text-left">
      {/* Room Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#11172E] border border-purple-500/30 p-5 rounded-3xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-purple-400">
              Waiting Room
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">
              {currentRoom.is_public ? <Globe className="w-3 h-3 text-cyan-400" /> : <Lock className="w-3 h-3 text-purple-400" />}
              {currentRoom.is_public ? 'Public' : 'Private'}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white">{currentRoom.name}</h2>
          <span className="text-xs text-slate-400">
            Category: <strong className="text-purple-300">{currentRoom.settings.category}</strong> • Hint: <strong className="text-purple-300">{currentRoom.settings.hint_mode}</strong>
          </span>
        </div>

        {/* Room Code & Share Buttons */}
        <div className="flex items-center gap-2">
          <div className="bg-[#090D1A] px-3.5 py-2 rounded-2xl border border-slate-800 flex items-center gap-2">
            <span className="text-xs text-slate-400 uppercase font-semibold">Code:</span>
            <span className="text-base font-black font-mono text-amber-400 tracking-wider">
              {currentRoom.room_code}
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="p-1 text-slate-400 hover:text-white rounded"
              title="Copy Code"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <Button
            size="sm"
            variant="secondary"
            icon={copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            onClick={handleCopyLink}
          >
            {copiedLink ? 'Copied!' : 'Copy Link'}
          </Button>

          <Button
            size="sm"
            variant="ghost"
            icon={<LogOut className="w-3.5 h-3.5" />}
            onClick={handleLeave}
          >
            Leave
          </Button>
        </div>
      </div>

      {/* Virtual Round Table Layout */}
      <div className="relative">
        <VirtualRoundTable
          players={players}
          currentRound={null}
          phase="WAITING_ROOM"
          currentUserId={user.id}
          selectedVoteTargetId={null}
          isHost={isHost}
        />
      </div>

      {/* Control Bar */}
      <div className="bg-[#11172E] border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Player count summary */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h5 className="text-sm font-extrabold text-white">
              {totalPlayers} / {currentRoom.settings.max_players} Players Ready
            </h5>
            <p className="text-xs text-slate-400">
              {totalPlayers < minPlayers
                ? `Need at least ${minPlayers - totalPlayers} more player(s) to begin`
                : 'Table meets minimum player requirement!'}
            </p>
          </div>
        </div>

        {/* Ready & Start Game Actions */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Non-host ready toggle */}
          {!isHost && (
            <Button
              size="lg"
              variant={isMyReady ? 'success' : 'secondary'}
              icon={<Check className="w-4 h-4" />}
              onClick={() => toggleReady(user.id, !isMyReady)}
              className="flex-1 sm:flex-initial"
            >
              {isMyReady ? "I'm Ready!" : 'Set as Ready'}
            </Button>
          )}

          {/* Host Start Game button */}
          {isHost && (
            <Button
              size="lg"
              variant="primary"
              icon={<Play className="w-5 h-5 fill-current" />}
              disabled={!canStart || isLoading}
              isLoading={isLoading}
              onClick={handleLaunchGame}
              className="flex-1 sm:flex-initial text-base px-8 shadow-purple-600/50"
            >
              Start Game ({totalPlayers}/{currentRoom.settings.max_players})
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
