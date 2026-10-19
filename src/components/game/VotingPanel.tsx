import React from 'react';
import { RoomPlayer, GameRound } from '../../types/game';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { Vote, Check, Lock, AlertCircle, ShieldAlert, Sparkles } from 'lucide-react';

export interface VotingPanelProps {
  players: RoomPlayer[];
  currentRound: GameRound;
  currentUserId?: string;
  selectedTargetId: string | null;
  onSelectTarget: (targetId: string) => void;
  onSubmitVote: () => void;
  isHost?: boolean;
  onEvaluateEarly?: () => void;
}

export const VotingPanel: React.FC<VotingPanelProps> = ({
  players,
  currentRound,
  currentUserId,
  selectedTargetId,
  onSelectTarget,
  onSubmitVote,
  isHost,
  onEvaluateEarly,
}) => {
  const hasVoted = Boolean(currentUserId && currentRound.vote_submissions.includes(currentUserId));
  const eligibleTargets = players.filter((p) => p.user_id !== currentUserId);
  const selectedTargetPlayer = players.find((p) => p.user_id === selectedTargetId);
  const totalVotesCast = currentRound.vote_submissions.length;
  const totalPlayers = players.length;

  return (
    <div className="w-full max-w-xl mx-auto bg-[#10152B] border-2 border-rose-500/40 rounded-3xl p-4 sm:p-6 shadow-[0_10px_35px_rgba(244,63,94,0.18)] text-center space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 text-rose-400">
          <div className="w-7 h-7 rounded-xl bg-rose-500/20 flex items-center justify-center">
            <Vote className="w-4 h-4 text-rose-400 animate-pulse" />
          </div>
          <div className="text-left">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 block leading-none">
              Secret Ballot
            </span>
            <span className="text-xs font-black text-white">Who is the Imposter?</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 px-3 py-1 rounded-xl">
          <span className="text-xs font-bold text-slate-300">
            Locked: <span className="text-rose-400 font-black">{totalVotesCast}</span> / {totalPlayers}
          </span>
        </div>
      </div>

      {hasVoted ? (
        <div className="py-6 space-y-3">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-500/20 border-2 border-emerald-500/50 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <Check className="w-8 h-8 stroke-[3]" />
          </div>
          <h3 className="text-lg font-black text-white">Your Ballot is Sealed!</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Your vote is locked in and completely anonymous until all players finish voting.
          </p>

          <div className="flex items-center justify-center gap-1.5 pt-2">
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping"></span>
            <span className="text-xs font-bold text-slate-400">Waiting for other players...</span>
          </div>

          {isHost && totalVotesCast >= 2 && (
            <div className="pt-4 border-t border-slate-800 mt-4">
              <Button size="sm" variant="secondary" onClick={onEvaluateEarly}>
                Reveal Results Now (Host Skip)
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4 text-left">
          <p className="text-xs text-slate-300 text-center font-medium">
            Tap a suspect below to select them. Your vote cannot be changed once submitted!
          </p>

          {/* Suspects Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {eligibleTargets.map((p) => {
              const isSelected = selectedTargetId === p.user_id;
              return (
                <button
                  key={p.user_id}
                  type="button"
                  onClick={() => onSelectTarget(p.user_id)}
                  className={`flex items-center justify-between p-3 rounded-2xl border-2 transition-all text-left ${
                    isSelected
                      ? 'bg-rose-950/40 border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.3)] scale-[1.02]'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar
                      avatarId={p.profile.avatar_id}
                      avatarBackground={p.profile.avatar_background}
                      avatarUrl={p.profile.avatar_url}
                      size="sm"
                      showBorder={false}
                    />
                    <div className="truncate">
                      <span className="block text-xs font-black text-white truncate">
                        {p.profile.display_name}
                      </span>
                      <span className="block text-[10px] text-slate-400 truncate">
                        @{p.profile.username}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`w-6 h-6 rounded-xl flex items-center justify-center border font-black text-xs transition-all ${
                      isSelected
                        ? 'bg-rose-500 border-rose-400 text-white shadow-md'
                        : 'bg-slate-800 border-slate-700 text-transparent'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Action Submission */}
          <div className="pt-2">
            <Button
              variant="danger"
              size="lg"
              disabled={!selectedTargetId}
              icon={<Lock className="w-4 h-4" />}
              onClick={onSubmitVote}
              fullWidth
              className="text-sm font-black py-3.5 shadow-lg shadow-rose-900/40"
            >
              {selectedTargetPlayer
                ? `Lock Vote for ${selectedTargetPlayer.profile.display_name}`
                : 'Choose a Suspect First'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

