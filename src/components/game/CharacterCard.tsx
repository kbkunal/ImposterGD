import React from 'react';
import { RoomPlayer, GamePhase } from '../../types/game';
import { Avatar } from '../ui/Avatar';
import { Crown, Mic, CheckCircle, Vote, Skull, Check } from 'lucide-react';
import { motion } from 'framer-motion';

export interface CharacterCardProps {
  player: RoomPlayer;
  isHost: boolean;
  isCurrentSpeaker: boolean;
  isCurrentUser: boolean;
  phase: GamePhase;
  hasVoted: boolean;
  isSelectableForVote: boolean;
  isSelectedForVote: boolean;
  onSelectVote?: () => void;
  revealedRole?: 'NORMAL' | 'IMPOSTER';
  votesReceived?: number;
  isMostVoted?: boolean;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({
  player,
  isHost,
  isCurrentSpeaker,
  isCurrentUser,
  phase,
  hasVoted,
  isSelectableForVote,
  isSelectedForVote,
  onSelectVote,
  revealedRole,
  votesReceived,
  isMostVoted,
}) => {
  return (
    <motion.div
      layout
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      className={`relative flex flex-col items-center select-none ${
        isSelectableForVote ? 'cursor-pointer group' : ''
      }`}
      onClick={() => {
        if (isSelectableForVote && onSelectVote) {
          onSelectVote();
        }
      }}
    >
      {/* Speaking Aura or Selection Glow */}
      <div
        className={`relative p-2 rounded-2xl transition-all duration-300 flex flex-col items-center ${
          isCurrentSpeaker
            ? 'bg-amber-500/20 ring-4 ring-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.5)] scale-105'
            : isSelectedForVote
            ? 'bg-rose-500/20 ring-4 ring-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.6)] scale-105'
            : isSelectableForVote
            ? 'group-hover:ring-2 group-hover:ring-purple-400/70 group-hover:bg-purple-500/10'
            : 'bg-[#12182C]/70 border border-slate-800 backdrop-blur-md'
        } ${isCurrentUser ? 'border-purple-500/60' : ''}`}
      >
        {/* Host Crown */}
        {isHost && (
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1 z-10 border border-amber-300">
            <Crown className="w-3.5 h-3.5 fill-current" />
            <span className="text-[10px] font-black uppercase tracking-wider">Host</span>
          </div>
        )}

        {/* Avatar with speaking aura */}
        <div className="relative mt-1">
          <Avatar
            avatarId={player.profile.avatar_id}
            avatarBackground={player.profile.avatar_background}
            avatarUrl={player.profile.avatar_url}
            size="md"
            isSpeaking={isCurrentSpeaker}
            borderColor={
              revealedRole === 'IMPOSTER'
                ? '#F43F5E'
                : revealedRole === 'NORMAL'
                ? '#38BDF8'
                : undefined
            }
          />

          {/* Speaking Mic Icon */}
          {isCurrentSpeaker && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 p-1 rounded-full shadow-lg"
            >
              <Mic className="w-3.5 h-3.5" />
            </motion.div>
          )}

          {/* Voted check badge during voting phase */}
          {phase === 'VOTING' && hasVoted && (
            <div className="absolute -bottom-1 -left-1 bg-emerald-500 text-white p-1 rounded-full shadow-lg">
              <Check className="w-3.5 h-3.5" />
            </div>
          )}

          {/* Lobby Ready Badge */}
          {phase === 'WAITING_ROOM' && (
            <div
              className={`absolute -bottom-1 -right-1 p-1 rounded-full text-white shadow-md ${
                player.ready ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
              title={player.ready ? 'Ready' : 'Not Ready'}
            >
              <CheckCircle className="w-3.5 h-3.5" />
            </div>
          )}
        </div>

        {/* Player Name & Tag */}
        <div className="mt-2 text-center max-w-[100px] sm:max-w-[120px]">
          <span className="block text-xs sm:text-sm font-extrabold text-white truncate">
            {player.profile.display_name}
            {isCurrentUser && <span className="text-purple-400 ml-1 font-bold">(You)</span>}
          </span>
          <span className="block text-[10px] text-slate-400 font-medium truncate">
            @{player.profile.username}
          </span>
        </div>

        {/* Reveal Phase Role Badge */}
        {revealedRole && (
          <div className="mt-1.5">
            {revealedRole === 'IMPOSTER' ? (
              <span className="inline-flex items-center gap-1 bg-rose-600/30 text-rose-300 border border-rose-500/50 text-[10px] font-black uppercase px-2 py-0.5 rounded-full animate-bounce">
                <Skull className="w-3 h-3" />
                Imposter
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-cyan-600/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                Player
              </span>
            )}
          </div>
        )}

        {/* Vote count tally if in reveal */}
        {votesReceived !== undefined && votesReceived > 0 && (
          <div
            className={`mt-1 text-xs font-black px-2 py-0.5 rounded-full border ${
              isMostVoted
                ? 'bg-rose-500 text-white border-rose-300 shadow-lg shadow-rose-500/50'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            {votesReceived} {votesReceived === 1 ? 'vote' : 'votes'}
          </div>
        )}

        {/* Interactive Vote Selection Button */}
        {isSelectableForVote && (
          <button
            type="button"
            className={`mt-2 text-[11px] font-bold px-3 py-1 rounded-lg border transition-all ${
              isSelectedForVote
                ? 'bg-rose-600 text-white border-rose-400 shadow-md'
                : 'bg-purple-600/20 hover:bg-rose-600 hover:text-white text-purple-300 border-purple-500/40'
            }`}
          >
            {isSelectedForVote ? 'Selected' : 'Vote Suspect'}
          </button>
        )}
      </div>
    </motion.div>
  );
};
