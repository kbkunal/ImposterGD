import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { GameRound, Match, RoomPlayer } from '../../types/game';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { Trophy, Skull, Shield, RotateCcw, Home, Sparkles } from 'lucide-react';

export interface RoundResultsModalProps {
  isOpen: boolean;
  round: GameRound;
  match: Match;
  players: RoomPlayer[];
  currentUserId?: string;
  isHost?: boolean;
  onPlayAgain: () => void;
  onReturnToLobby: () => void;
}

export const RoundResultsModal: React.FC<RoundResultsModalProps> = ({
  isOpen,
  round,
  match,
  players,
  currentUserId,
  isHost,
  onPlayAgain,
  onReturnToLobby,
}) => {
  const winner = round.winner;
  const isImposterWinner = winner === 'IMPOSTER' || winner === 'TIE_ESCAPED';
  const imposterId = round.imposter_user_ids[0];
  const imposterPlayer = players.find(p => p.user_id === imposterId);

  // Trigger confetti if normal players won or current user won as imposter
  useEffect(() => {
    if (isOpen) {
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
          colors: isImposterWinner ? ['#F43F5E', '#FB7185', '#E11D48'] : ['#8B5CF6', '#38BDF8', '#F59E0B'],
        });
      } catch {
        // ignore
      }
    }
  }, [isOpen, isImposterWinner]);

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}}
      title="Round Debrief & Results"
      maxWidth="lg"
      showCloseButton={false}
    >
      <div className="space-y-6 text-center">
        {/* Winner Banner */}
        <div
          className={`p-5 rounded-2xl border text-center ${
            isImposterWinner
              ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
              : 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
          }`}
        >
          <div className="w-14 h-14 mx-auto rounded-full bg-slate-900/60 flex items-center justify-center mb-2 shadow-inner">
            {isImposterWinner ? (
              <Skull className="w-8 h-8 text-rose-400" />
            ) : (
              <Trophy className="w-8 h-8 text-amber-400" />
            )}
          </div>
          <h3 className="text-xl sm:text-2xl font-black uppercase tracking-wide">
            {winner === 'NORMAL_PLAYERS' && 'Normal Players Win!'}
            {winner === 'IMPOSTER' && 'The Imposter Fooled Everyone!'}
            {winner === 'TIE_ESCAPED' && 'Tie Vote! Imposter Escapes!'}
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            {winner === 'NORMAL_PLAYERS' && 'The crew successfully found and voted out the Imposter.'}
            {winner === 'IMPOSTER' &&
              (round.last_chance_correct
                ? `${imposterPlayer?.profile.display_name} guessed the secret word on their last chance!`
                : `${imposterPlayer?.profile.display_name} survived undetected!`)}
            {winner === 'TIE_ESCAPED' && 'Votes were split evenly; the Imposter slipped away.'}
          </p>
        </div>

        {/* Secret Word & Hint Reveal */}
        <div className="grid grid-cols-2 gap-3 bg-[#090D1A] p-4 rounded-2xl border border-slate-800 text-left">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400">
              The Secret Word
            </span>
            <h4 className="text-xl sm:text-2xl font-black text-white uppercase mt-0.5">
              {round.secret_word || 'UNKNOWN'}
            </h4>
            <span className="text-[10px] text-slate-400">Category: {round.category}</span>
          </div>

          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-400">
              The Imposter's Hint
            </span>
            <h4 className="text-xl sm:text-2xl font-black text-rose-300 uppercase mt-0.5">
              {round.revealed_hint || 'NO HINT'}
            </h4>
            <span className="text-[10px] text-slate-400">
              Imposter: {imposterPlayer?.profile.display_name}
            </span>
          </div>
        </div>

        {/* Player Scores & Standings */}
        <div className="space-y-2 text-left">
          <h5 className="text-xs font-black uppercase tracking-wider text-slate-400">
            Current Match Standings (Round {round.round_number})
          </h5>
          <div className="divide-y divide-slate-800/80 bg-[#0E1428] rounded-2xl border border-slate-800 p-2 max-h-48 overflow-y-auto">
            {players
              .slice()
              .sort((a, b) => (match.scores[b.user_id] || 0) - (match.scores[a.user_id] || 0))
              .map((p, idx) => {
                const totalScore = match.scores[p.user_id] || 0;
                const earnedThisRound = round.points_awarded[p.user_id] || 0;
                const isImposter = p.user_id === imposterId;

                return (
                  <div key={p.user_id} className="flex items-center justify-between p-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-slate-500 w-4">{idx + 1}.</span>
                      <Avatar
                        avatarId={p.profile.avatar_id}
                        avatarBackground={p.profile.avatar_background}
                        avatarUrl={p.profile.avatar_url}
                        size="xs"
                        showBorder={false}
                      />
                      <div>
                        <span className="text-xs font-bold text-white block">
                          {p.profile.display_name}
                          {p.user_id === currentUserId && <span className="text-purple-400 ml-1">(You)</span>}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {isImposter ? 'Imposter' : 'Player'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-black text-amber-400 block">{totalScore} pts</span>
                      {earnedThisRound > 0 && (
                        <span className="text-[10px] font-bold text-emerald-400">+{earnedThisRound}</span>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button
            variant="secondary"
            size="md"
            icon={<Home className="w-4 h-4" />}
            onClick={onReturnToLobby}
            fullWidth
          >
            Return to Lobby
          </Button>

          {isHost ? (
            <Button
              variant="primary"
              size="md"
              icon={<RotateCcw className="w-4 h-4" />}
              onClick={onPlayAgain}
              fullWidth
            >
              Start Next Round →
            </Button>
          ) : (
            <p className="text-xs text-slate-400 italic">Waiting for host to launch next round...</p>
          )}
        </div>
      </div>
    </Modal>
  );
};
