import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { useGameStore } from '../stores/useGameStore';
import { VirtualRoundTable } from '../components/game/VirtualRoundTable';
import { CardRevealModal } from '../components/game/CardRevealModal';
import { CluePhaseTracker } from '../components/game/CluePhaseTracker';
import { DiscussionTimer } from '../components/game/DiscussionTimer';
import { VotingPanel } from '../components/game/VotingPanel';
import { ImposterGuessModal } from '../components/game/ImposterGuessModal';
import { RoundResultsModal } from '../components/game/RoundResultsModal';
import { Button } from '../components/ui/Button';
import {
  Eye,
  LogOut,
  Sparkles,
  HelpCircle,
  Shield,
  Layers,
  RotateCcw,
} from 'lucide-react';

export interface GamePageProps {
  onNavigate: (page: string) => void;
}

export const GamePage: React.FC<GamePageProps> = ({ onNavigate }) => {
  const { user } = useAuthStore();
  const {
    currentRoom,
    players,
    currentRound,
    currentMatch,
    myPrivateRole,
    myVoteTargetId,
    cluesHistory,
    hasAcknowledgedCard,
    acknowledgeCardViewed,
    submitTextClue,
    advanceSpeakerTurn,
    advancePhase,
    submitVote,
    evaluateVotes,
    submitImposterGuess,
    playAgain,
    leaveCurrentRoom,
  } = useGameStore();

  const [showCardModal, setShowCardModal] = useState(false);
  const [selectedVoteTargetId, setSelectedVoteTargetId] = useState<string | null>(null);

  // Auto-open Card Reveal modal once when DEALING_CARDS or CARD_REVEAL initiates
  useEffect(() => {
    if (
      currentRound &&
      ['DEALING_CARDS', 'CARD_REVEAL'].includes(currentRound.phase) &&
      !hasAcknowledgedCard &&
      myPrivateRole
    ) {
      setShowCardModal(true);
    }
  }, [currentRound?.phase, hasAcknowledgedCard, myPrivateRole]);

  // Handle phase advance from DEALING_CARDS to CARD_REVEAL or CLUE_ROUND
  useEffect(() => {
    if (currentRound?.phase === 'DEALING_CARDS' && currentRoom?.host_id === user?.id) {
      const timer = setTimeout(() => {
        advancePhase('CARD_REVEAL');
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [currentRound?.phase, currentRoom?.host_id, user?.id, advancePhase]);

  if (!currentRoom || !currentRound || !user || !currentMatch) {
    return (
      <div className="py-20 text-center space-y-4">
        <p className="text-slate-400">No active match found.</p>
        <Button variant="primary" onClick={() => onNavigate('dashboard')}>
          Back to Lobby
        </Button>
      </div>
    );
  }

  const isHost = currentRoom.host_id === user.id;
  const isImposter = myPrivateRole?.role === 'IMPOSTER';
  const phase = currentRound.phase;

  const handleCardAcknowledged = async () => {
    await acknowledgeCardViewed(user.id);
    setShowCardModal(false);

    // If host, automatically transition to CLUE_ROUND
    if (isHost && phase === 'CARD_REVEAL') {
      await advancePhase('CLUE_ROUND');
    }
  };

  const handleSelectVote = (targetId: string) => {
    setSelectedVoteTargetId(targetId);
  };

  const handleLockVote = async () => {
    if (selectedVoteTargetId) {
      await submitVote(user.id, selectedVoteTargetId);
    }
  };

  const handleLeaveGame = async () => {
    if (window.confirm('Are you sure you want to leave this active match?')) {
      await leaveCurrentRoom(user);
      onNavigate('dashboard');
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-between py-4 px-3 sm:px-6">
      {/* Top Game Bar */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between gap-3 bg-[#11172E]/90 border border-slate-800 p-3.5 rounded-2xl shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="text-xs font-black uppercase tracking-wider text-purple-400">
            Round {currentRound.round_number}
          </span>
          <span className="text-xs font-bold text-slate-300">• {currentRoom.name}</span>
          <span className="text-[10px] text-amber-400 font-mono bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-500/30">
            {currentRoom.room_code}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* View Secret Card button */}
          <Button
            size="sm"
            variant="secondary"
            icon={<Eye className="w-3.5 h-3.5" />}
            onClick={() => setShowCardModal(true)}
          >
            My Card
          </Button>

          {/* Host advance to discussion button if in clue phase */}
          {isHost && phase === 'CLUE_ROUND' && (
            <Button
              size="sm"
              variant="amber"
              onClick={() => advancePhase('DISCUSSION')}
            >
              Start Discussion
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            icon={<LogOut className="w-3.5 h-3.5" />}
            onClick={handleLeaveGame}
            title="Leave Match"
          >
            Leave
          </Button>
        </div>
      </div>

      {/* Main Visual Arena: Virtual Round Table */}
      <div className="flex-1 flex flex-col items-center justify-center my-2">
        <VirtualRoundTable
          players={players}
          currentRound={currentRound}
          phase={phase}
          currentUserId={user.id}
          selectedVoteTargetId={selectedVoteTargetId}
          onSelectVoteTarget={handleSelectVote}
          onOpenPrivateCardModal={() => setShowCardModal(true)}
          onAdvanceTurn={() => advanceSpeakerTurn()}
          isHost={isHost}
        />
      </div>

      {/* Dynamic Phase Control Panel (Bottom Arena) */}
      <div className="w-full max-w-2xl mx-auto z-10 pt-2 pb-4">
        {/* Phase: CLUE_ROUND */}
        {phase === 'CLUE_ROUND' && (
          <CluePhaseTracker
            currentRound={currentRound}
            players={players}
            currentUserId={user.id}
            isHost={isHost}
            cluesHistory={cluesHistory}
            allowTextClues={currentRoom.settings.allow_text_clues}
            onAdvanceTurn={() => advanceSpeakerTurn()}
            onSubmitClue={(text) => submitTextClue(user, text)}
            onAdvanceToDiscussion={() => advancePhase('DISCUSSION')}
          />
        )}

        {/* Phase: DISCUSSION */}
        {phase === 'DISCUSSION' && (
          <DiscussionTimer
            deadline={currentRound.phase_deadline}
            isHost={isHost}
            onStartVoting={() => advancePhase('VOTING')}
          />
        )}

        {/* Phase: VOTING */}
        {phase === 'VOTING' && (
          <VotingPanel
            players={players}
            currentRound={currentRound}
            currentUserId={user.id}
            selectedTargetId={selectedVoteTargetId}
            onSelectTarget={handleSelectVote}
            onSubmitVote={handleLockVote}
            isHost={isHost}
            onEvaluateEarly={() => evaluateVotes(currentRoom.settings.allow_last_chance_guess)}
          />
        )}
      </div>

      {/* Card Reveal Modal */}
      <CardRevealModal
        isOpen={showCardModal}
        onClose={() => setShowCardModal(false)}
        privateRole={myPrivateRole}
        onAcknowledgeViewed={handleCardAcknowledged}
        category={currentRound.category}
      />

      {/* Imposter Last-Chance Guess Modal */}
      <ImposterGuessModal
        isOpen={phase === 'IMPOSTER_GUESS'}
        isImposter={isImposter}
        category={currentRound.category}
        imposterDisplayName={
          players.find(p => p.user_id === currentRound.imposter_user_ids[0])?.profile.display_name
        }
        onSubmitGuess={(guess) => submitImposterGuess(guess)}
        onSkip={() => submitImposterGuess('___SKIPPED___')}
      />

      {/* Round & Match Results Modal */}
      <RoundResultsModal
        isOpen={phase === 'ROUND_RESULTS' || phase === 'MATCH_RESULTS'}
        round={currentRound}
        match={currentMatch}
        players={players}
        currentUserId={user.id}
        isHost={isHost}
        onPlayAgain={() => playAgain(user)}
        onReturnToLobby={() => {
          advancePhase('WAITING_ROOM');
          onNavigate('waiting-room');
        }}
      />
    </div>
  );
};
