import React, { useEffect, useState } from 'react';
import { Button } from '../ui/Button';
import { soundEngine } from '../../services/game/soundEngine';
import { Clock, Vote, MessageCircle, Flame } from 'lucide-react';

export interface DiscussionTimerProps {
  deadline: number;
  isHost?: boolean;
  onStartVoting: () => void;
}

export const DiscussionTimer: React.FC<DiscussionTimerProps> = ({
  deadline,
  isHost,
  onStartVoting,
}) => {
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    const updateTime = () => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setTimeLeft(remaining);

      // Play tick sound on last 5 seconds
      if (remaining <= 5 && remaining > 0) {
        soundEngine.playCountdownTick(remaining === 1);
      }

      if (remaining === 0 && isHost) {
        onStartVoting();
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [deadline, isHost, onStartVoting]);

  const isUrgent = timeLeft <= 10;

  return (
    <div className={`w-full max-w-md mx-auto bg-[#10162B] border-2 rounded-3xl p-5 sm:p-6 shadow-2xl text-center space-y-4 transition-all ${
      isUrgent
        ? 'border-rose-500/70 shadow-[0_0_35px_rgba(244,63,94,0.3)] animate-pulse'
        : 'border-purple-500/40 shadow-[0_10px_35px_rgba(168,85,247,0.18)]'
    }`}>
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 text-purple-400">
          <div className="w-7 h-7 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-purple-400" />
          </div>
          <span className="text-xs font-black uppercase tracking-wider text-white">
            Open Discussion
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
          <Flame className={`w-4 h-4 ${isUrgent ? 'text-rose-400 animate-bounce' : 'text-amber-400'}`} />
          <span>{isUrgent ? 'Final Seconds!' : 'Debate Phase'}</span>
        </div>
      </div>

      <div className="py-2">
        <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full border-4 shadow-xl transition-all ${
          isUrgent
            ? 'border-rose-500 bg-rose-950/40 text-rose-300 shadow-rose-500/30 scale-105'
            : 'border-purple-500/60 bg-purple-950/30 text-white shadow-purple-500/20'
        }`}>
          <div className="text-center">
            <span className="text-3xl font-black block tracking-tight leading-none">{timeLeft}</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">sec</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-300 max-w-xs mx-auto leading-relaxed">
        Cross-examine each other! Who hesitated? Whose clue felt out of place or too vague?
      </p>

      {isHost && (
        <div className="pt-2">
          <Button
            variant="danger"
            size="lg"
            icon={<Vote className="w-4 h-4" />}
            onClick={onStartVoting}
            fullWidth
            className="text-sm font-black"
          >
            End Discussion & Call Vote
          </Button>
        </div>
      )}
    </div>
  );
};

