import React from 'react';
import { RoomPlayer, GameRound } from '../../types/game';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { Vote, Check, Lock, AlertCircle } from 'lucide-react';

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
  const eligibleTargets = players.filter(p => p.user_id !== currentUserId);
  const selectedTargetPlayer = players.find(p => p.user_id === selectedTargetId);
  const totalVotesCast = currentRound.vote_submissions.length;
  const totalPlayers = players.length;

  return (
    <div className="w-full max-w-xl mx-auto bg-[#11172E] border border-rose-500/30 rounded-2xl p-5 shadow-2xl text-center space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 text-rose-400">
          <Vote className="w-4 h-4" />
          <span className="text-xs font-black uppercase tracking-wider">Secret Ballot</span>
        </div>
        <span className="text-xs font-bold text-slate-300">
          Votes Cast: <span className="text-purple-400 font-black">{totalVotesCast}</span> / {totalPlayers}
        </span>
      </div>

      {hasVoted ? (
        <div className="py-4 space-y-2">
          <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Check className="w-6 h-6" />
          </div>
          <h4 className="text-base font-extrabold text-white">Your Vote is Locked In!</h4>
          <p className="text-xs text-slate-400">
            Waiting for all other players to finish voting. Your vote remains completely secret until the reveal.
          </p>

          {isHost && totalVotesCast >= 2 && (
            <div className="pt-3">
              <Button size="sm" variant="secondary" onClick={onEvaluateEarly}>
                Reveal Results Now
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4 text-left">
          <p className="text-xs text-slate-300 text-center">
            Select the player you believe is the Imposter. You cannot vote for yourself!
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {eligibleTargets.map((p) => {
              const isSelected = selectedTargetId === p.user_id;
              return (
                <button
                  key={p.user_id}
                  type="button"
                  onClick={() => onSelectTarget(p.user_id)}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-rose-600/30 border-rose-500 ring-2 ring-rose-500/50 shadow-lg scale-102'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
                  }`}
                >
                  <Avatar
                    avatarId={p.profile.avatar_id}
                    avatarBackground={p.profile.avatar_background}
                    avatarUrl={p.profile.avatar_url}
                    size="sm"
                    showBorder={false}
                  />
                  <div className="truncate">
                    <span className="block text-xs font-extrabold text-white truncate">
                      {p.profile.display_name}
                    </span>
                    <span className="block text-[10px] text-slate-400 truncate">
                      @{p.profile.username}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-center pt-2">
            <Button
              variant="danger"
              size="lg"
              disabled={!selectedTargetId}
              icon={<Lock className="w-4 h-4" />}
              onClick={onSubmitVote}
              fullWidth
            >
              {selectedTargetPlayer
                ? `Lock Vote for ${selectedTargetPlayer.profile.display_name}`
                : 'Select a Suspect'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
