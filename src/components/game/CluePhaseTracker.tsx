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
    <div className="w-full max-w-xl mx-auto space-y-4">
      {/* Active Turn Announcement Banner */}
      <div className="bg-[#12182C] border border-amber-500/30 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-left">
          {activePlayer && (
            <Avatar
              avatarId={activePlayer.profile.avatar_id}
              avatarBackground={activePlayer.profile.avatar_background}
              avatarUrl={activePlayer.profile.avatar_url}
              size="sm"
              isSpeaking={true}
            />
          )}
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
              <Mic className="w-3 h-3 animate-pulse" />
              Active Turn • Round {currentRound.current_clue_round} of {currentRound.total_clue_rounds}
            </span>
            <h4 className="text-sm sm:text-base font-extrabold text-white">
              {isMyTurn ? "It's YOUR turn to speak!" : `${activePlayer?.profile.display_name || 'Player'} is speaking...`}
            </h4>
          </div>
        </div>

        {/* Turn Controls */}
        <div className="flex items-center gap-2">
          {(isMyTurn || isHost) && (
            <Button
              size="sm"
              variant="amber"
              icon={<SkipForward className="w-3.5 h-3.5" />}
              onClick={onAdvanceTurn}
            >
              Done / Next
            </Button>
          )}

          {isHost && (
            <Button
              size="sm"
              variant="secondary"
              onClick={onAdvanceToDiscussion}
            >
              Start Discussion
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
            className="flex-1"
          />
          <Button
            type="submit"
            variant="primary"
            icon={<Send className="w-4 h-4" />}
            disabled={!clueInput.trim()}
          >
            Submit
          </Button>
        </form>
      )}

      {/* Clue History Log */}
      {cluesHistory.length > 0 && (
        <div className="bg-[#0B0F1E] border border-slate-800 rounded-2xl p-4 text-left max-h-48 overflow-y-auto space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
              Clue Log
            </span>
            <span className="text-[10px] text-slate-500">{cluesHistory.length} clues given</span>
          </div>

          <div className="space-y-2">
            {cluesHistory.map((entry, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-900/60">
                <div className="flex items-center gap-2">
                  <Avatar
                    avatarId={entry.avatar_id}
                    avatarBackground={entry.avatar_background}
                    size="xs"
                    showBorder={false}
                  />
                  <span className="font-bold text-slate-200">{entry.username}:</span>
                  <span className="text-purple-300 font-semibold italic">"{entry.clue}"</span>
                </div>
                <span className="text-[10px] text-slate-500">R{entry.round_number}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
