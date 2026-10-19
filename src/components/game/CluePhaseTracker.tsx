import React, { useState } from 'react';
import { ClueEntry, GameRound, RoomPlayer } from '../../types/game';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Avatar } from '../ui/Avatar';
import { Mic, Send, SkipForward, MessageSquare, Check, Sparkles } from 'lucide-react';

export interface CluePhaseTrackerProps {
  currentRound: GameRound;
  players: RoomPlayer[];
  currentUserId?: string;
  isHost?: boolean;
  cluesHistory: ClueEntry[];
  allowTextClues?: boolean;
  onAdvanceTurn: () => void;
  onSubmitClue: (text: string) => void;
  onAdvanceToDiscussion: () => void;
}

export const CluePhaseTracker: React.FC<CluePhaseTrackerProps> = ({
  currentRound,
  players,
  currentUserId,
  isHost,
  cluesHistory,
  allowTextClues = true,
  onAdvanceTurn,
  onSubmitClue,
  onAdvanceToDiscussion,
}) => {
  const [clueInput, setClueInput] = useState('');
  const activeSpeakerId = currentRound.active_speaker_id;
  const isMyTurn = activeSpeakerId === currentUserId;
  const activePlayer = players.find(p => p.user_id === activeSpeakerId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clueInput.trim()) return;
    onSubmitClue(clueInput.trim());
    setClueInput('');
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-3 sm:space-y-4">
      {/* Active Turn Announcement Banner */}
      <div className="bg-[#12182C] border-2 border-amber-500/40 rounded-3xl p-4 sm:p-5 shadow-[0_8px_30px_rgba(245,158,11,0.15)] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 text-left w-full sm:w-auto">
          {activePlayer && (
            <Avatar
              avatarId={activePlayer.profile.avatar_id}
              avatarBackground={activePlayer.profile.avatar_background}
              avatarUrl={activePlayer.profile.avatar_url}
              size="md"
              isSpeaking={true}
            />
          )}
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              Clue Phase • Turn {currentRound.current_clue_round} of {currentRound.total_clue_rounds}
            </span>
            <h3 className="text-base sm:text-lg font-black text-white truncate">
              {isMyTurn ? "🎯 It's YOUR turn to speak!" : `${activePlayer?.profile.display_name || 'Player'} is speaking...`}
            </h3>
            <p className="text-[11px] text-slate-400">
              {isMyTurn
                ? 'Say your one-word clue aloud or submit below!'
                : 'Listen carefully for hesitations or suspicious clues.'}
            </p>
          </div>
        </div>

        {/* Turn Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {(isMyTurn || isHost) && (
            <Button
              size="md"
              variant="amber"
              icon={<SkipForward className="w-4 h-4" />}
              onClick={onAdvanceTurn}
              className="flex-1 sm:flex-initial"
            >
              Done / Next Turn
            </Button>
          )}

          {isHost && (
            <Button
              size="md"
              variant="secondary"
              onClick={onAdvanceToDiscussion}
              className="flex-1 sm:flex-initial"
            >
              Start Debate
            </Button>
          )}
        </div>
      </div>

      {/* Optional In-Game Text Clue Submission */}
      {allowTextClues && isMyTurn && (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={clueInput}
            onChange={(e) => setClueInput(e.target.value)}
            placeholder="Type your one-word clue or subtle hint..."
            className="flex-1 text-sm font-bold"
          />
          <Button
            type="submit"
            variant="primary"
            size="md"
            icon={<Send className="w-4 h-4" />}
            disabled={!clueInput.trim()}
          >
            Send Clue
          </Button>
        </form>
      )}

      {/* Clue History Log */}
      {cluesHistory.length > 0 && (
        <div className="bg-[#0B0F1E] border-2 border-slate-800 rounded-3xl p-4 text-left max-h-48 overflow-y-auto space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-purple-400" />
              Live Clue Log
            </span>
            <span className="text-[11px] font-bold text-purple-400">{cluesHistory.length} clues submitted</span>
          </div>

          <div className="space-y-1.5">
            {cluesHistory.map((entry, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs py-2 px-3 rounded-xl bg-slate-900/80 border border-slate-800/60">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar
                    avatarId={entry.avatar_id}
                    avatarBackground={entry.avatar_background}
                    size="xs"
                    showBorder={false}
                  />
                  <span className="font-black text-slate-200 truncate">{entry.username}:</span>
                  <span className="text-cyan-300 font-extrabold italic truncate">"{entry.clue}"</span>
                </div>
                <span className="text-[10px] font-black text-slate-500 uppercase ml-2 flex-shrink-0">R{entry.round_number}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

