import React from 'react';
import { RoomPlayer, GamePhase } from '../../types/game';
import { Avatar } from '../ui/Avatar';
import { Crown, Mic, CheckCircle, Skull, Check, Eye, WifiOff } from 'lucide-react';
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
  compact?: boolean;
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
  compact = false,
}) => {
  const isDisconnected = player.connected === false;

  return (
    <motion.div
      layout
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.85, opacity: 0 }}
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
      {/* Outer Card Container with Game Styling */}
      <div
        className={`relative rounded-2xl transition-all duration-200 flex flex-col items-center ${
          compact ? 'p-1.5' : 'p-2 sm:p-2.5'
        } ${
          isCurrentSpeaker
            ? 'bg-gradient-to-b from-amber-500/25 to-amber-950/40 ring-4 ring-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.6)] scale-105 animate-float-slow'
            : isSelectedForVote
            ? 'bg-gradient-to-b from-rose-500/25 to-rose-950/40 ring-4 ring-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.7)] scale-105'
            : isSelectableForVote
            ? 'bg-[#12182C]/90 border border-slate-700/80 group-hover:border-purple-400 group-hover:bg-purple-950/30 group-hover:scale-102'
            : 'bg-[#10162B]/85 border border-slate-800 backdrop-blur-md shadow-lg'
        } ${isCurrentUser ? 'border-purple-500/60 ring-2 ring-purple-500/30' : ''}`}
      >
        {/* Host Crown Pill */}
        {isHost && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 z-20 border border-yellow-200">
            <Crown className="w-3 h-3 fill-current" />
            <span className="text-[9px] font-black uppercase tracking-wider">Host</span>
          </div>
        )}

        {/* Avatar Presentation with Speaking Aura */}
        <div className="relative mt-0.5">
          <Avatar
            avatarId={player.profile.avatar_id}
            avatarBackground={player.profile.avatar_background}
            avatarUrl={player.profile.avatar_url}
            size={compact ? 'sm' : 'md'}
            isSpeaking={isCurrentSpeaker}
            borderColor={
              revealedRole === 'IMPOSTER'
                ? '#F43F5E'
                : revealedRole === 'NORMAL'
                ? '#38BDF8'
                : isSelectedForVote
                ? '#F43F5E'
                : isCurrentSpeaker
                ? '#F59E0B'
                : undefined
            }
          />

          {/* Speaking Mic Icon with Sound Waves */}
          {isCurrentSpeaker && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-950 p-1 rounded-full shadow-lg ring-2 ring-amber-200"
            >
              <Mic className="w-3.5 h-3.5 fill-current animate-pulse" />
            </motion.div>
          )}

          {/* Voted check badge during voting phase */}
          {phase === 'VOTING' && hasVoted && (
            <div className="absolute -bottom-1 -left-1 bg-emerald-500 text-white p-1 rounded-full shadow-lg ring-2 ring-emerald-300">
              <Check className="w-3 h-3 text-white stroke-[3]" />
            </div>
          )}

          {/* Card Viewed badge during DEALING_CARDS / CARD_REVEAL */}
          {['DEALING_CARDS', 'CARD_REVEAL'].includes(phase) && (
            <div
              className={`absolute -bottom-1 -right-1 p-1 rounded-full text-white shadow-md transition-all ${
                player.card_viewed
                  ? 'bg-emerald-500 ring-2 ring-emerald-300'
                  : 'bg-slate-700/90 border border-slate-500 animate-pulse'
              }`}
              title={player.card_viewed ? 'Card Revealed' : 'Viewing Card...'}
            >
              {player.card_viewed ? (
                <Check className="w-3 h-3 text-white stroke-[3]" />
              ) : (
                <Eye className="w-3 h-3 text-slate-300" />
              )}
            </div>
          )}

          {/* Lobby Ready Badge */}
          {phase === 'WAITING_ROOM' && (
            <div
              className={`absolute -bottom-1 -right-1 p-1 rounded-full text-white shadow-md ${
                player.ready ? 'bg-emerald-500 ring-2 ring-emerald-300' : 'bg-slate-700'
              }`}
              title={player.ready ? 'Ready' : 'Not Ready'}
            >
              <CheckCircle className="w-3 h-3" />
            </div>
          )}

          {/* Disconnected offline icon */}
          {isDisconnected && (
            <div className="absolute -top-1 -right-1 bg-rose-600 text-white p-1 rounded-full shadow-lg" title="Disconnected">
              <WifiOff className="w-3 h-3" />
            </div>
          )}
        </div>

        {/* Player Name & Tag */}
        <div className="mt-1.5 text-center max-w-[85px] sm:max-w-[110px] truncate">
          <span className="block text-xs sm:text-sm font-black text-white truncate leading-tight">
            {player.profile.display_name}
          </span>
          {isCurrentUser && (
            <span className="text-[10px] text-purple-300 font-extrabold uppercase tracking-wide block">
              You
            </span>
          )}
        </div>

        {/* Revealed Role in results */}
        {revealedRole && (
          <div className="mt-1">
            {revealedRole === 'IMPOSTER' ? (
              <span className="inline-flex items-center gap-1 bg-rose-600/30 text-rose-300 border border-rose-500/60 text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-sm animate-bounce">
                <Skull className="w-3 h-3" />
                Imposter
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-cyan-600/20 text-cyan-300 border border-cyan-500/40 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                Crewmate
              </span>
            )}
          </div>
        )}

        {/* Vote count tally */}
        {votesReceived !== undefined && votesReceived > 0 && (
          <div
            className={`mt-1 text-[11px] font-black px-2 py-0.5 rounded-full border shadow-sm ${
              isMostVoted
                ? 'bg-rose-600 text-white border-rose-400 shadow-rose-600/50 scale-105'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            {votesReceived} {votesReceived === 1 ? 'vote' : 'votes'}
          </div>
        )}
      </div>
    </motion.div>
  );
};
