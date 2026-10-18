import React, { useEffect, useState } from 'react';
import { Button } from '../ui/Button';
import { soundEngine } from '../../services/game/soundEngine';
import { Clock, Vote, MessageCircle } from 'lucide-react';

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

  return (
    <div className="w-full max-w-md mx-auto bg-[#12182C] border border-purple-500/30 rounded-2xl p-5 shadow-2xl text-center space-y-4">
      <div className="flex items-center justify-center gap-2 text-purple-400">
        <MessageCircle className="w-4 h-4" />
        <span className="text-xs font-black uppercase tracking-wider">Group Discussion</span>
      </div>

      <div>
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full border-4 border-purple-500/40 bg-purple-950/40 text-white font-black text-2xl shadow-inner">
          {timeLeft}s
        </div>
      </div>

      <p className="text-xs text-slate-300 px-4">
        Discuss who gave vague, hesitant, or suspicious clues. Who seems like they are bluffing?
      </p>

      {isHost && (
        <div className="pt-1">
          <Button
            variant="danger"
            size="md"
            icon={<Vote className="w-4 h-4" />}
            onClick={onStartVoting}
          >
            Start Voting Now
          </Button>
        </div>
      )}
    </div>
  );
};
