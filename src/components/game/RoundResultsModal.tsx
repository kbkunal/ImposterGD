import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { GameRound, Match, RoomPlayer } from '../../types/game';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { Trophy, Skull, Shield, RotateCcw, Home, Sparkles, Award } from 'lucide-react';

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
  const imposterPlayer = players.find((p) => p.user_id === imposterId);

  // Trigger celebratory confetti on victory
  useEffect(() => {
    if (isOpen) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: isImposterWinner
            ? ['#F43F5E', '#FB7185', '#E11D48', '#FDA4AF']
            : ['#8B5CF6', '#38BDF8', '#F59E0B', '#10B981'],
        });
      } catch {
        // ignore if canvas not supported
      }
    }
  }, [isOpen, isImposterWinner]);

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}}
      title="Round Results & Debrief"
      maxWidth="lg"
      showCloseButton={false}
    >
      <div className="space-y-5 text-center">
        {/* Winner Banner */}
        <div
          className={`p-5 sm:p-6 rounded-3xl border-2 text-center transition-all shadow-xl ${
            isImposterWinner
              ? 'bg-rose-950/40 border-rose-500/60 text-rose-200 shadow-rose-900/30'
              : 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200 shadow-emerald-900/30'
          }`}
        >
          <div className="w-16 h-16 mx-auto rounded-3xl bg-slate-900/80 border-2 border-white/10 flex items-center justify-center mb-3 shadow-inner">
            {isImposterWinner ? (
              <Skull className="w-9 h-9 text-rose-400 animate-pulse" />
            ) : (
              <Trophy className="w-9 h-9 text-amber-400 animate-bounce" />
            )}
          </div>
          <h2 className="text-xl sm:text-3xl font-black uppercase tracking-tight">
            {winner === 'NORMAL_PLAYERS' && 'Crewmates Win!'}
            {winner === 'IMPOSTER' && 'The Imposter Duped Everyone!'}
            {winner === 'TIE_ESCAPED' && 'Tie Vote! Imposter Vanished!'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-md mx-auto">
            {winner === 'NORMAL_PLAYERS' && 'The crew successfully detected and eliminated the Imposter!'}
            {winner === 'IMPOSTER' &&
              (round.last_chance_correct
                ? `${imposterPlayer?.profile.display_name} was caught, but correctly guessed the secret word on last chance!`
                : `${imposterPlayer?.profile.display_name} successfully blended in without being caught!`)}
            {winner === 'TIE_ESCAPED' && 'Votes were split evenly; the Imposter slipped away unnoticed!'}
          </p>
        </div>

        {/* Word Reveal Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-[#0D1224] p-4 rounded-3xl border-2 border-cyan-500/40 text-left shadow-lg">
            <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 block">
              The Secret Word
            </span>
            <span className="text-2xl sm:text-3xl font-black text-white uppercase block mt-1 tracking-wide">
              {round.secret_word || 'UNKNOWN'}
            </span>
            <span className="text-[11px] font-bold text-slate-400 mt-1 block">
              Category: <span className="text-cyan-300">{round.category}</span>
            </span>
          </div>

          <div className="bg-[#0D1224] p-4 rounded-3xl border-2 border-rose-500/40 text-left shadow-lg">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 block">
              The Imposter
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-rose-300 uppercase block tracking-wide truncate">
                {imposterPlayer?.profile.display_name || 'Imposter'}
              </span>
            </div>
            <span className="text-[11px] font-bold text-slate-400 mt-1 block">
              Given Hint: <span className="text-rose-400 font-extrabold">{round.revealed_hint || 'NO HINT'}</span>
            </span>
          </div>
        </div>

        {/* Match Standings Scoreboard */}
        <div className="space-y-2 text-left">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              Match Standings (Round {round.round_number})
            </h3>
            <span className="text-[11px] font-bold text-slate-500">Points Summary</span>
          </div>

          <div className="divide-y divide-slate-800/80 bg-[#0B0F1E] rounded-3xl border-2 border-slate-800 p-2 sm:p-3 max-h-52 overflow-y-auto space-y-1">
            {players
              .slice()
              .sort((a, b) => (match.scores[b.user_id] || 0) - (match.scores[a.user_id] || 0))
              .map((p, idx) => {
                const totalScore = match.scores[p.user_id] || 0;
                const earnedThisRound = round.points_awarded[p.user_id] || 0;
                const isImposter = p.user_id === imposterId;

                return (
                  <div key={p.user_id} className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-900/50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`text-xs font-black w-5 text-center ${
                        idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-slate-300' : 'text-slate-500'
                      }`}>
                        #{idx + 1}
                      </span>
                      <Avatar
                        avatarId={p.profile.avatar_id}
                        avatarBackground={p.profile.avatar_background}
                        avatarUrl={p.profile.avatar_url}
                        size="xs"
                        showBorder={false}
                      />
                      <div className="min-w-0 truncate">
                        <span className="text-xs font-black text-white truncate block">
                          {p.profile.display_name}
                          {p.user_id === currentUserId && (
                            <span className="text-purple-400 text-[10px] ml-1.5 font-bold uppercase">(You)</span>
                          )}
                        </span>
                        <span className={`text-[10px] font-black uppercase ${
                          isImposter ? 'text-rose-400' : 'text-cyan-400'
                        }`}>
                          {isImposter ? 'Imposter' : 'Crewmate'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right flex items-center gap-2">
                      {earnedThisRound > 0 && (
                        <span className="text-xs font-black text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded-lg">
                          +{earnedThisRound}
                        </span>
                      )}
                      <span className="text-sm font-black text-amber-400 min-w-[50px] text-right">
                        {totalScore} pts
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button
            variant="ghost"
            size="md"
            icon={<Home className="w-4 h-4" />}
            onClick={onReturnToLobby}
            fullWidth
            className="sm:w-auto"
          >
            Leave to Lobby
          </Button>

          {isHost ? (
            <Button
              variant="primary"
              size="lg"
              icon={<RotateCcw className="w-5 h-5" />}
              onClick={onPlayAgain}
              fullWidth
              className="sm:w-auto text-base font-black px-6"
            >
              Start Next Round →
            </Button>
          ) : (
            <div className="py-2 text-xs font-bold text-slate-400 italic">
              Waiting for host to begin the next round...
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

