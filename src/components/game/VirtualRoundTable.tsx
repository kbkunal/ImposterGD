import React, { useMemo } from 'react';
import { RoomPlayer, GameRound, GamePhase } from '../../types/game';
import { CharacterCard } from './CharacterCard';
import { Clock, Eye, Sparkles, MessageCircle, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export interface VirtualRoundTableProps {
  players: RoomPlayer[];
  currentRound: GameRound | null;
  phase: GamePhase;
  currentUserId?: string;
  selectedVoteTargetId: string | null;
  onSelectVoteTarget?: (targetId: string) => void;
  onOpenPrivateCardModal?: () => void;
  onAdvanceTurn?: () => void;
  isHost?: boolean;
}

export const VirtualRoundTable: React.FC<VirtualRoundTableProps> = ({
  players,
  currentRound,
  phase,
  currentUserId,
  selectedVoteTargetId,
  onSelectVoteTarget,
  onOpenPrivateCardModal,
  onAdvanceTurn,
  isHost,
}) => {
  const totalPlayers = players.length;

  // Calculate vote tallies if in reveal phase
  const votesTally = useMemo(() => {
    if (!currentRound?.votes || !['VOTE_REVEAL', 'IMPOSTER_GUESS', 'ROUND_RESULTS', 'MATCH_RESULTS'].includes(phase)) {
      return {};
    }
    const tally: Record<string, number> = {};
    Object.values(currentRound.votes).forEach(targetId => {
      tally[targetId] = (tally[targetId] || 0) + 1;
    });
    return tally;
  }, [currentRound?.votes, phase]);

  // Circular placement positions for desktop / large screens
  // Adjust radius based on player count to prevent overlaps (from 3 up to 10)
  const playerPositions = useMemo(() => {
    if (totalPlayers === 0) return [];

    // Find index of current user to place them at bottom
    let userIndex = players.findIndex(p => p.user_id === currentUserId);
    if (userIndex === -1) userIndex = 0;

    return players.map((player, index) => {
      // Offset so current user is near bottom (angle = PI/2)
      const relativeIndex = (index - userIndex + totalPlayers) % totalPlayers;
      const angle = (relativeIndex * (2 * Math.PI)) / totalPlayers + Math.PI / 2;

      // Elliptical table radii (wider than tall for 16:9 monitor view)
      const radiusX = totalPlayers <= 4 ? 220 : totalPlayers <= 6 ? 260 : 310;
      const radiusY = totalPlayers <= 4 ? 160 : totalPlayers <= 6 ? 190 : 220;

      const x = Math.cos(angle) * radiusX;
      const y = Math.sin(angle) * radiusY;

      return { player, x, y };
    });
  }, [players, totalPlayers, currentUserId]);

  const activeSpeakerPlayer = players.find(p => p.user_id === currentRound?.active_speaker_id);
  const isMySpeakerTurn = currentRound?.active_speaker_id === currentUserId && phase === 'CLUE_ROUND';

  return (
    <div className="relative w-full max-w-5xl mx-auto flex flex-col items-center justify-center py-6 select-none overflow-hidden">
      {/* Desktop & Tablet Table (Centered Circular Layout) */}
      <div className="hidden md:flex relative items-center justify-center w-[740px] h-[540px] my-4">
        {/* Ambient table neon glow */}
        <div className="absolute w-[580px] h-[400px] rounded-[50%] bg-purple-900/20 blur-3xl pointer-events-none" />
        <div className="absolute w-[480px] h-[320px] rounded-[50%] bg-cyan-900/15 blur-2xl pointer-events-none" />

        {/* Outer stylized tabletop disc */}
        <div className="absolute w-[540px] h-[380px] rounded-[50%] border-4 border-[#1E2748] bg-radial from-[#151D36] via-[#0E1326] to-[#080B14] shadow-2xl table-glow flex items-center justify-center">
          {/* Inner ring felt accent */}
          <div className="w-[440px] h-[290px] rounded-[50%] border border-purple-500/20 bg-gradient-to-b from-[#18203B]/60 to-[#0B0F1C]/90 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
            {/* Subtle table pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(#312E81_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none" />

            {/* Table Center Hub */}
            <div className="relative z-10 flex flex-col items-center max-w-[260px]">
              {/* Category pill */}
              {currentRound?.category && (
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-300 bg-purple-950/80 px-2.5 py-0.5 rounded-full border border-purple-500/30 mb-1.5 shadow-sm">
                  {currentRound.category}
                </span>
              )}

              {/* Phase Title */}
              <h4 className="text-base font-black text-white tracking-wide uppercase">
                {formatPhaseName(phase)}
              </h4>

              {/* Phase Microcopy */}
              <p className="text-xs text-slate-300 mt-1 leading-snug">
                {getPhaseDescription(phase, activeSpeakerPlayer?.profile.display_name, isMySpeakerTurn)}
              </p>

              {/* Action Buttons in Center Hub */}
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                {/* Reveal Card button */}
                {phase !== 'WAITING_ROOM' && onOpenPrivateCardModal && (
                  <button
                    type="button"
                    onClick={onOpenPrivateCardModal}
                    className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-400/30 shadow-md transition-all active:scale-95"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View Secret Card
                  </button>
                )}

                {/* Host Next Speaker button in Clue Phase */}
                {phase === 'CLUE_ROUND' && (isHost || isMySpeakerTurn) && onAdvanceTurn && (
                  <button
                    type="button"
                    onClick={onAdvanceTurn}
                    className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md transition-all active:scale-95"
                  >
                    Next Turn →
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Evenly distributed circular player cards */}
        {playerPositions.map(({ player, x, y }) => {
          const isCurrentUser = player.user_id === currentUserId;
          const isCurrentSpeaker = player.user_id === currentRound?.active_speaker_id && phase === 'CLUE_ROUND';
          const hasVoted = Boolean(currentRound?.vote_submissions.includes(player.user_id));
          const isSelectableForVote = phase === 'VOTING' && !isCurrentUser;
          const isSelectedForVote = selectedVoteTargetId === player.user_id;

          const isImposterRevealed =
            ['VOTE_REVEAL', 'IMPOSTER_GUESS', 'ROUND_RESULTS', 'MATCH_RESULTS'].includes(phase) &&
            currentRound?.imposter_user_ids.includes(player.user_id);

          const revealedRole =
            ['ROUND_RESULTS', 'MATCH_RESULTS'].includes(phase)
              ? isImposterRevealed
                ? 'IMPOSTER'
                : 'NORMAL'
              : undefined;

          const votesReceived = votesTally[player.user_id];
          const isMostVoted = currentRound?.most_voted_id === player.user_id;

          return (
            <div
              key={player.user_id}
              className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
              }}
            >
              <CharacterCard
                player={player}
                isHost={player.is_host}
                isCurrentSpeaker={isCurrentSpeaker}
                isCurrentUser={isCurrentUser}
                phase={phase}
                hasVoted={hasVoted}
                isSelectableForVote={isSelectableForVote}
                isSelectedForVote={isSelectedForVote}
                onSelectVote={() => onSelectVoteTarget?.(player.user_id)}
                revealedRole={revealedRole}
                votesReceived={votesReceived}
                isMostVoted={isMostVoted}
              />
            </div>
          );
        })}
      </div>

      {/* Mobile Responsive Layout (< 768px) */}
      {/* Stadium / Grid view that ensures every player is clearly visible without overlaps */}
      <div className="flex md:hidden flex-col w-full px-3 space-y-4">
        {/* Mobile Table Hub Card */}
        <div className="w-full bg-[#12182C] border border-purple-500/30 rounded-2xl p-4 text-center shadow-xl table-glow">
          {currentRound?.category && (
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-300 bg-purple-950/80 px-2.5 py-0.5 rounded-full border border-purple-500/30 mb-1 inline-block">
              {currentRound.category}
            </span>
          )}
          <h4 className="text-base font-black text-white uppercase mt-1">
            {formatPhaseName(phase)}
          </h4>
          <p className="text-xs text-slate-300 mt-1">
            {getPhaseDescription(phase, activeSpeakerPlayer?.profile.display_name, isMySpeakerTurn)}
          </p>

          <div className="mt-3 flex items-center justify-center gap-2">
            {phase !== 'WAITING_ROOM' && onOpenPrivateCardModal && (
              <button
                type="button"
                onClick={onOpenPrivateCardModal}
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-purple-600/30 text-purple-200 border border-purple-400/30 shadow-md"
              >
                <Eye className="w-3.5 h-3.5" />
                View Card
              </button>
            )}

            {phase === 'CLUE_ROUND' && (isHost || isMySpeakerTurn) && onAdvanceTurn && (
              <button
                type="button"
                onClick={onAdvanceTurn}
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 shadow-md"
              >
                Next Turn →
              </button>
            )}
          </div>
        </div>

        {/* Mobile Players Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 w-full">
          {players.map((player) => {
            const isCurrentUser = player.user_id === currentUserId;
            const isCurrentSpeaker = player.user_id === currentRound?.active_speaker_id && phase === 'CLUE_ROUND';
            const hasVoted = Boolean(currentRound?.vote_submissions.includes(player.user_id));
            const isSelectableForVote = phase === 'VOTING' && !isCurrentUser;
            const isSelectedForVote = selectedVoteTargetId === player.user_id;

            const isImposterRevealed =
              ['VOTE_REVEAL', 'IMPOSTER_GUESS', 'ROUND_RESULTS', 'MATCH_RESULTS'].includes(phase) &&
              currentRound?.imposter_user_ids.includes(player.user_id);

            const revealedRole =
              ['ROUND_RESULTS', 'MATCH_RESULTS'].includes(phase)
                ? isImposterRevealed
                  ? 'IMPOSTER'
                  : 'NORMAL'
                : undefined;

            const votesReceived = votesTally[player.user_id];
            const isMostVoted = currentRound?.most_voted_id === player.user_id;

            return (
              <CharacterCard
                key={player.user_id}
                player={player}
                isHost={player.is_host}
                isCurrentSpeaker={isCurrentSpeaker}
                isCurrentUser={isCurrentUser}
                phase={phase}
                hasVoted={hasVoted}
                isSelectableForVote={isSelectableForVote}
                isSelectedForVote={isSelectedForVote}
                onSelectVote={() => onSelectVoteTarget?.(player.user_id)}
                revealedRole={revealedRole}
                votesReceived={votesReceived}
                isMostVoted={isMostVoted}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

function formatPhaseName(phase: GamePhase): string {
  switch (phase) {
    case 'WAITING_ROOM':
      return 'Lobby • Gathering Players';
    case 'DEALING_CARDS':
      return 'Dealing Secret Cards';
    case 'CARD_REVEAL':
      return 'Private Card Check';
    case 'CLUE_ROUND':
      return 'Clue Giving Phase';
    case 'DISCUSSION':
      return 'Floor Open • Discussion';
    case 'VOTING':
      return 'Cast Your Vote';
    case 'VOTE_REVEAL':
      return 'Tallying the Votes';
    case 'IMPOSTER_GUESS':
      return 'Last Chance Word Guess';
    case 'ROUND_RESULTS':
      return 'Round Complete';
    case 'MATCH_RESULTS':
      return 'Match Leaderboard';
    default:
      return 'Playing Round';
  }
}

function getPhaseDescription(phase: GamePhase, speakerName?: string, isMyTurn?: boolean): string {
  switch (phase) {
    case 'WAITING_ROOM':
      return 'Get ready! Host will launch when everyone is in.';
    case 'DEALING_CARDS':
      return 'Assigning roles secretly...';
    case 'CARD_REVEAL':
      return 'Check your private card and keep it hidden!';
    case 'CLUE_ROUND':
      if (isMyTurn) return 'It is YOUR turn! Give a subtle clue aloud or in chat.';
      if (speakerName) return `${speakerName} is giving their clue! Listen closely.`;
      return 'Players are giving one clue in turn.';
    case 'DISCUSSION':
      return 'Discuss who gave suspicious clues and who seems to be bluffing!';
    case 'VOTING':
      return 'Vote for the player you suspect is the Imposter.';
    case 'VOTE_REVEAL':
      return 'Revealing who received the most votes!';
    case 'IMPOSTER_GUESS':
      return 'The Imposter was caught! They have one last chance to guess the secret word.';
    case 'ROUND_RESULTS':
      return 'Scores awarded for this round!';
    default:
      return '';
  }
}
