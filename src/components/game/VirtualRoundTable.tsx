import React, { useMemo, useState, useEffect } from 'react';
import { RoomPlayer, GameRound, GamePhase } from '../../types/game';
import { CharacterCard } from './CharacterCard';
import { Clock, Eye, Sparkles, MessageCircle, HelpCircle, ArrowRight, Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

  // Active speaker info
  const activeSpeakerPlayer = players.find(p => p.user_id === currentRound?.active_speaker_id);
  const isMySpeakerTurn = currentRound?.active_speaker_id === currentUserId && phase === 'CLUE_ROUND';

  // Countdown timer for phases with phase_deadline
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!currentRound?.phase_deadline || ['ROUND_RESULTS', 'MATCH_RESULTS', 'WAITING_ROOM'].includes(phase)) {
      setSecondsRemaining(null);
      return;
    }

    const updateTimer = () => {
      const left = Math.max(0, Math.ceil((currentRound.phase_deadline - Date.now()) / 1000));
      setSecondsRemaining(left);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [currentRound?.phase_deadline, phase]);

  // Vote tallies during reveal phase
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

  // Circular placement positions for desktop (>= 768px)
  // Dynamically calculate radius and spread based on player count (3 to 10)
  const playerPositions = useMemo(() => {
    if (totalPlayers === 0) return [];

    let userIndex = players.findIndex(p => p.user_id === currentUserId);
    if (userIndex === -1) userIndex = 0;

    return players.map((player, index) => {
      // Offset so current user is positioned at bottom (angle = PI/2)
      const relativeIndex = (index - userIndex + totalPlayers) % totalPlayers;
      const angle = (relativeIndex * (2 * Math.PI)) / totalPlayers + Math.PI / 2;

      // Adaptive radii to ensure no overlapping cards
      const radiusX = totalPlayers <= 4 ? 230 : totalPlayers <= 6 ? 270 : totalPlayers <= 8 ? 320 : 360;
      const radiusY = totalPlayers <= 4 ? 165 : totalPlayers <= 6 ? 195 : totalPlayers <= 8 ? 220 : 240;

      const x = Math.cos(angle) * radiusX;
      const y = Math.sin(angle) * radiusY;

      return { player, x, y };
    });
  }, [players, totalPlayers, currentUserId]);

  const conciseInstruction = getPhaseDirectInstruction(
    phase,
    activeSpeakerPlayer?.profile.display_name,
    isMySpeakerTurn
  );

  return (
    <div className="relative w-full max-w-6xl mx-auto flex flex-col items-center justify-center py-2 sm:py-6 select-none overflow-hidden">
      {/* ========================================================= */}
      {/* 1. DESKTOP VIRTUAL ROUND TABLE (>= 768px)                */}
      {/* ========================================================= */}
      <div className="hidden md:flex relative items-center justify-center w-[780px] h-[550px] my-2">
        {/* Ambient neon underglow */}
        <div className="absolute w-[640px] h-[420px] rounded-[50%] bg-purple-900/20 blur-3xl pointer-events-none" />
        <div className="absolute w-[500px] h-[320px] rounded-[50%] bg-cyan-900/15 blur-2xl pointer-events-none" />

        {/* Outer stylized tabletop disc */}
        <div className="absolute w-[580px] h-[400px] rounded-[50%] border-4 border-[#252F52] bg-radial from-[#151D3A] via-[#0E1428] to-[#080C1A] shadow-2xl table-glow flex items-center justify-center">
          {/* Inner felt table ring */}
          <div className="w-[480px] h-[310px] rounded-[50%] border border-purple-500/25 bg-gradient-to-b from-[#18203B]/80 to-[#0A0E1C]/95 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden shadow-inner">
            <div className="absolute inset-0 bg-[radial-gradient(#312E81_1px,transparent_1px)] [background-size:16px_16px] opacity-25 pointer-events-none" />

            {/* Table Center Hub */}
            <div className="relative z-10 flex flex-col items-center max-w-[280px]">
              {/* Category pill */}
              {currentRound?.category && (
                <span className="text-[10px] font-black uppercase tracking-widest text-purple-300 bg-purple-950/80 px-3 py-0.5 rounded-full border border-purple-500/40 mb-1.5 shadow-sm">
                  {currentRound.category}
                </span>
              )}

              {/* Phase Title Badge */}
              <h3 className="text-sm sm:text-base font-black text-white tracking-wide uppercase drop-shadow">
                {formatPhaseName(phase)}
              </h3>

              {/* Countdown clock if active */}
              {secondsRemaining !== null && secondsRemaining > 0 && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-950/70 border border-amber-500/40 text-amber-300 font-mono text-xs font-black my-1">
                  <Clock className="w-3.5 h-3.5 animate-pulse" />
                  <span>{secondsRemaining}s remaining</span>
                </div>
              )}

              {/* Direct Concise Instruction */}
              <p className="text-xs font-bold text-slate-200 mt-1 leading-snug drop-shadow-sm">
                {conciseInstruction}
              </p>

              {/* Center Hub Quick Action Buttons */}
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                {phase !== 'WAITING_ROOM' && onOpenPrivateCardModal && (
                  <button
                    type="button"
                    onClick={onOpenPrivateCardModal}
                    className="inline-flex items-center gap-1.5 text-xs font-black px-3.5 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-400/40 shadow-md transition-all active:scale-95"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Inspect Card
                  </button>
                )}

                {phase === 'CLUE_ROUND' && (isHost || isMySpeakerTurn) && onAdvanceTurn && (
                  <button
                    type="button"
                    onClick={onAdvanceTurn}
                    className="inline-flex items-center gap-1.5 text-xs font-black px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-md transition-all active:scale-95 border-t border-amber-200"
                  >
                    Next Turn →
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Distributed Circular Player Cards */}
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
              className="absolute z-20 -translate-x-1/2 -translate-y-1/2 transition-transform duration-200"
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

      {/* ========================================================= */}
      {/* 2. MOBILE RESPONSIVE ADAPTIVE ARENA (< 768px)             */}
      {/* ========================================================= */}
      <div className="flex md:hidden flex-col w-full px-2 space-y-3">
        {/* Mobile Central Stage Card */}
        <div className="w-full bg-gradient-to-b from-[#151D3A] to-[#0E1428] border-2 border-purple-500/30 rounded-3xl p-4 text-center shadow-xl table-glow space-y-2">
          {currentRound?.category && (
            <span className="text-[10px] font-black uppercase tracking-widest text-purple-300 bg-purple-950/90 px-3 py-0.5 rounded-full border border-purple-500/40 inline-block">
              {currentRound.category}
            </span>
          )}

          <div className="flex items-center justify-center gap-2">
            <h3 className="text-base font-black text-white uppercase tracking-wide">
              {formatPhaseName(phase)}
            </h3>
            {secondsRemaining !== null && secondsRemaining > 0 && (
              <span className="text-xs font-mono font-black text-amber-300 bg-amber-950/70 px-2 py-0.5 rounded-full border border-amber-500/40">
                {secondsRemaining}s
              </span>
            )}
          </div>

          <p className="text-xs font-bold text-slate-200 leading-snug max-w-sm mx-auto">
            {conciseInstruction}
          </p>

          {/* Quick buttons in stage */}
          <div className="flex items-center justify-center gap-2 pt-1">
            {phase !== 'WAITING_ROOM' && onOpenPrivateCardModal && (
              <button
                type="button"
                onClick={onOpenPrivateCardModal}
                className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-xl bg-purple-600/30 text-purple-200 border border-purple-400/40 active:scale-95"
              >
                <Eye className="w-3.5 h-3.5" />
                View Card
              </button>
            )}

            {phase === 'CLUE_ROUND' && (isHost || isMySpeakerTurn) && onAdvanceTurn && (
              <button
                type="button"
                onClick={onAdvanceTurn}
                className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md active:scale-95"
              >
                Next Turn →
              </button>
            )}
          </div>
        </div>

        {/* Active speaker spotlight banner if in clue round */}
        {phase === 'CLUE_ROUND' && activeSpeakerPlayer && (
          <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-500/15 border-2 border-amber-400/60 shadow-lg">
            <div className="flex items-center gap-2.5">
              <Mic className="w-4 h-4 text-amber-400 animate-pulse" />
              <span className="text-xs font-black text-white">
                {isMySpeakerTurn ? "It's your turn to speak!" : `${activeSpeakerPlayer.profile.display_name}'s turn to speak`}
              </span>
            </div>
            {isMySpeakerTurn && (
              <span className="text-[10px] font-black uppercase text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/40">
                You
              </span>
            )}
          </div>
        )}

        {/* Mobile Player Grid (2 columns on small phone, 3 on larger phone) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full pt-1">
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
                compact={true}
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
      return 'Lobby Gathering';
    case 'DEALING_CARDS':
      return 'Dealing Secret Cards';
    case 'CARD_REVEAL':
      return 'Inspect Your Card';
    case 'CLUE_ROUND':
      return 'Giving Clues';
    case 'DISCUSSION':
      return 'Group Discussion';
    case 'VOTING':
      return 'Voting Stage';
    case 'VOTE_REVEAL':
      return 'Vote Tally';
    case 'IMPOSTER_GUESS':
      return 'Last Chance Guess';
    case 'ROUND_RESULTS':
      return 'Round Complete';
    case 'MATCH_RESULTS':
      return 'Match Victory';
    default:
      return 'Playing Round';
  }
}

function getPhaseDirectInstruction(phase: GamePhase, speakerName?: string, isMyTurn?: boolean): string {
  switch (phase) {
    case 'WAITING_ROOM':
      return 'Waiting for all players to take their seats.';
    case 'DEALING_CARDS':
      return 'Distributing confidential cards to every player.';
    case 'CARD_REVEAL':
      return 'Waiting for all players to reveal their cards.';
    case 'CLUE_ROUND':
      if (isMyTurn) return 'It is your turn to give a clue! Speak aloud.';
      if (speakerName) return `It's ${speakerName}'s turn to give a clue. Listen closely!`;
      return 'Players are giving clues around the table.';
    case 'DISCUSSION':
      return 'Discuss who you think is the Imposter.';
    case 'VOTING':
      return 'Select one player to vote for.';
    case 'VOTE_REVEAL':
      return 'Votes are locked. Revealing results…';
    case 'IMPOSTER_GUESS':
      return 'The Imposter was caught! Last chance word guess.';
    case 'ROUND_RESULTS':
      return 'Round results and scores awarded!';
    default:
      return 'Follow the gameplay prompts.';
  }
}
