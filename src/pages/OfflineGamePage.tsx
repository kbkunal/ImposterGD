import React, { useState, useEffect } from 'react';
import { useOfflineGameStore, OfflinePhase } from '../stores/useOfflineGameStore';
import { cardService } from '../services/game/cardService';
import { VirtualRoundTable } from '../components/game/VirtualRoundTable';
import { CharacterCard } from '../components/game/CharacterCard';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  EyeOff,
  Lock,
  ArrowRight,
  Shield,
  Skull,
  Check,
  RotateCcw,
  LogOut,
  HelpCircle,
  Clock,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { RoomPlayer, GameRound } from '../types/game';

export interface OfflineGamePageProps {
  onNavigate: (page: string) => void;
}

export const OfflineGamePage: React.FC<OfflineGamePageProps> = ({ onNavigate }) => {
  const {
    players,
    settings,
    phase,
    roundNumber,
    category,
    speakerOrder,
    currentSpeakerIndex,
    imposterIds,
    secretWord,
    imposterHint,
    assignments,
    handoverPlayerIndex,
    isCardRevealed,
    votes,
    mostVotedId,
    isTie,
    imposterCaught,
    lastChanceGuess,
    lastChanceCorrect,
    pointsAwarded,
    winner,
    revealCurrentCard,
    concealCardAndNextPlayer,
    advanceSpeakerTurn,
    advancePhase,
    recordVote,
    evaluateVotes,
    submitImposterGuess,
    playNextRound,
    resetToSetup,
  } = useOfflineGameStore();

  const [activeVoterId, setActiveVoterId] = useState<string>(players[0]?.id || '');
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [imposterGuessInput, setImposterGuessInput] = useState('');
  const [discussionSecondsLeft, setDiscussionSecondsLeft] = useState(settings.discussionTimerSeconds || 60);

  // Initialize active voter
  useEffect(() => {
    if (phase === 'VOTING') {
      const firstUnvoted = players.find(p => !votes[p.id]);
      if (firstUnvoted) {
        setActiveVoterId(firstUnvoted.id);
        setSelectedTargetId(null);
      }
    }
  }, [phase, votes, players]);

  // Discussion countdown timer
  useEffect(() => {
    if (phase === 'DISCUSSION') {
      setDiscussionSecondsLeft(settings.discussionTimerSeconds || 60);
      const interval = setInterval(() => {
        setDiscussionSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            advancePhase('VOTING');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [phase, settings.discussionTimerSeconds, advancePhase]);

  if (players.length < 3) {
    return (
      <div className="py-20 text-center space-y-4">
        <p className="text-slate-400">No active offline match.</p>
        <Button variant="primary" onClick={() => onNavigate('offline-setup')}>
          Set Up Pass & Play
        </Button>
      </div>
    );
  }

  // Current player viewing card during handover
  const currentHandoverPlayer = players[handoverPlayerIndex];
  const currentAssignment = currentHandoverPlayer ? assignments[currentHandoverPlayer.id] : null;
  const cardPresentation = cardService.getPresentation(
    currentAssignment
      ? {
          round_id: 'offline',
          user_id: currentAssignment.playerId,
          role: currentAssignment.role,
          secret_word: currentAssignment.secretWord,
          private_hint: currentAssignment.hint,
          category: currentAssignment.category,
          card_viewed: true,
        }
      : null
  );

  // Map offline players to RoomPlayer format for VirtualRoundTable
  const mappedRoomPlayers: RoomPlayer[] = players.map((p, idx) => ({
    user_id: p.id,
    seat_index: idx,
    ready: true,
    connected: true,
    is_host: idx === 0,
    profile: {
      id: p.id,
      username: p.name.toLowerCase().replace(/\s+/g, '_'),
      display_name: p.name,
      avatar_id: p.avatarId,
      avatar_background: p.avatarBackground,
      total_matches: 0,
      wins: 0,
      losses: 0,
      imposter_wins: 0,
      total_points: p.score,
      created_at: '',
    },
    clue_submitted: undefined,
    has_voted: Boolean(votes[p.id]),
    card_viewed: handoverPlayerIndex > idx,
  }));

  const activeSpeakerId = speakerOrder[currentSpeakerIndex];
  const activeSpeakerPlayer = players.find(p => p.id === activeSpeakerId);

  // Synthetic GameRound for UI components
  const syntheticRound: GameRound = {
    id: 'offline_round',
    match_id: 'offline_match',
    round_number: roundNumber,
    category,
    phase: (phase as any),
    phase_started_at: Date.now(),
    phase_deadline: Date.now() + 60000,
    active_speaker_id: activeSpeakerId,
    speaker_order: speakerOrder,
    current_speaker_index: currentSpeakerIndex,
    current_clue_round: 1,
    total_clue_rounds: 1,
    imposter_user_ids: imposterIds,
    votes,
    vote_submissions: Object.keys(votes),
    most_voted_id: mostVotedId,
    is_tie: isTie,
    points_awarded: pointsAwarded,
  };

  const handleLeaveMatch = () => {
    if (window.confirm('Quit this local match and return to setup?')) {
      resetToSetup();
      onNavigate('offline-setup');
    }
  };

  const handleCastVote = () => {
    if (activeVoterId && selectedTargetId) {
      recordVote(activeVoterId, selectedTargetId);
      setSelectedTargetId(null);
    }
  };

  // ==========================================
  // PHASE 1: SEQUENTIAL CARD HANDOVER
  // ==========================================
  if (phase === 'CARD_REVEAL') {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4 select-none relative">
        {/* Background ambient lighting */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-purple-900/15 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md bg-[#10162B] border-2 border-purple-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl text-center relative z-10 space-y-6">
          {/* Handover progress bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400">
              <span>Card Handover</span>
              <span className="text-purple-300 font-mono">
                Player {handoverPlayerIndex + 1} of {players.length}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-all duration-300"
                style={{ width: `${((handoverPlayerIndex + (isCardRevealed ? 0.5 : 0)) / players.length) * 100}%` }}
              />
            </div>
          </div>

          {/* NEUTRAL HANDOVER SCREEN (Face Down) */}
          {!isCardRevealed && (
            <div className="space-y-6 py-2">
              <div className="w-24 h-24 mx-auto rounded-3xl bg-[#151D38] border-2 border-purple-500/40 flex items-center justify-center shadow-xl">
                <Avatar
                  avatarId={currentHandoverPlayer?.avatarId}
                  avatarBackground={currentHandoverPlayer?.avatarBackground}
                  size="lg"
                />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-black uppercase tracking-wider text-purple-400">
                  Pass Device To:
                </span>
                <h3 className="text-3xl font-black text-white">
                  {currentHandoverPlayer?.name}
                </h3>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-950/60 border border-amber-500/30 text-amber-300 text-xs font-bold mt-2">
                  <Lock className="w-3.5 h-3.5" />
                  Others look away! Only {currentHandoverPlayer?.name} should look now.
                </div>
              </div>

              {/* Face-down confidential card mockup */}
              <div
                onClick={revealCurrentCard}
                className="w-full h-44 rounded-2xl bg-gradient-to-br from-[#1A2242] to-[#0A0D1A] border-2 border-purple-500/30 flex flex-col items-center justify-center p-4 cursor-pointer hover:border-purple-400 transition-all shadow-inner group"
              >
                <HelpCircle className="w-10 h-10 text-purple-400 group-hover:scale-110 transition-transform mb-2" />
                <span className="text-xs font-black uppercase text-purple-200 tracking-wider">
                  Tap to Reveal My Card
                </span>
                <span className="text-[10px] text-slate-400 mt-1">Keep screen private</span>
              </div>

              <Button
                size="lg"
                variant="primary"
                icon={<Eye className="w-5 h-5" />}
                onClick={revealCurrentCard}
                fullWidth
                className="py-4 text-base font-black shadow-purple-600/50"
              >
                Reveal My Card
              </Button>
            </div>
          )}

          {/* REVEALED SECRET CARD (Face Up) */}
          {isCardRevealed && cardPresentation && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="space-y-6 py-2"
            >
              {/* Role Badge */}
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">
                  {currentHandoverPlayer?.name}'s Identity
                </span>
                <div
                  className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-base font-black uppercase tracking-wider border shadow-xl ${
                    cardPresentation.isImposter
                      ? 'bg-rose-950/90 border-rose-500 text-rose-300 shadow-rose-950/60'
                      : 'bg-cyan-950/90 border-cyan-500 text-cyan-300 shadow-cyan-950/60'
                  }`}
                >
                  {cardPresentation.isImposter ? <Skull className="w-5 h-5 text-rose-400" /> : <Shield className="w-5 h-5 text-cyan-400" />}
                  {cardPresentation.roleTitle}
                </div>
              </div>

              {/* Secret Word or Hint Display */}
              <div className="space-y-2">
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                  {cardPresentation.keywordLabel}
                </span>

                <div
                  className={`py-5 px-4 rounded-2xl border-2 shadow-2xl ${
                    cardPresentation.isImposter
                      ? 'bg-rose-950/60 border-rose-500/60 text-rose-100'
                      : 'bg-cyan-950/60 border-cyan-500/60 text-cyan-100'
                  }`}
                >
                  <h2 className="text-3xl sm:text-4xl font-black tracking-widest uppercase">
                    {cardPresentation.keywordValue}
                  </h2>
                </div>

                <div
                  className={`p-3 rounded-xl border text-xs font-semibold leading-relaxed text-left ${
                    cardPresentation.isImposter
                      ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                      : 'bg-cyan-950/40 border-cyan-500/40 text-cyan-200'
                  }`}
                >
                  <span className="block font-black uppercase text-[10px] tracking-wider mb-0.5 opacity-80">
                    Instruction
                  </span>
                  {cardPresentation.instruction}
                </div>
              </div>

              <div className="text-xs text-slate-400">
                Category: <strong className="text-white">{category}</strong>
              </div>

              <Button
                size="lg"
                variant="success"
                icon={<EyeOff className="w-5 h-5" />}
                onClick={concealCardAndNextPlayer}
                fullWidth
                className="py-4 text-base font-black shadow-emerald-600/50"
              >
                Hide Card & Continue
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // MAIN GAME TABLE (CLUE, DISCUSSION, VOTING, RESULTS)
  // ==========================================
  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-between py-4 px-3 sm:px-6 select-none">
      {/* Top Header Bar */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between gap-3 bg-[#11172E]/90 border border-slate-800 p-3.5 rounded-2xl shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="text-xs font-black uppercase tracking-wider text-purple-400">
            Round {roundNumber}
          </span>
          <span className="text-xs font-bold text-slate-300">• Pass & Play (Offline)</span>
          <span className="text-[10px] text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded-md border border-purple-500/30">
            {category}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Phase Shortcuts */}
          {phase === 'CLUE_ROUND' && (
            <Button size="sm" variant="amber" onClick={() => advancePhase('DISCUSSION')}>
              Start Discussion
            </Button>
          )}
          {phase === 'DISCUSSION' && (
            <Button size="sm" variant="amber" onClick={() => advancePhase('VOTING')}>
              Start Voting
            </Button>
          )}
          <Button size="sm" variant="ghost" icon={<LogOut className="w-4 h-4" />} onClick={handleLeaveMatch}>
            Exit
          </Button>
        </div>
      </div>

      {/* Virtual Round Table Layout */}
      <div className="flex-1 flex flex-col items-center justify-center my-2">
        <VirtualRoundTable
          players={mappedRoomPlayers}
          currentRound={syntheticRound}
          phase={(phase as any)}
          currentUserId={activeVoterId}
          selectedVoteTargetId={selectedTargetId}
          onSelectVoteTarget={(targetId) => setSelectedTargetId(targetId)}
          onAdvanceTurn={() => advanceSpeakerTurn()}
          isHost={true}
        />
      </div>

      {/* Dynamic Bottom Control Arena */}
      <div className="w-full max-w-2xl mx-auto z-10 pt-2 pb-4">
        {/* PHASE: CLUE_ROUND */}
        {phase === 'CLUE_ROUND' && (
          <div className="bg-[#11172E] border-2 border-purple-500/40 rounded-3xl p-5 shadow-2xl text-center space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-black uppercase tracking-wider text-purple-400">
                Clue Turn {currentSpeakerIndex + 1} of {speakerOrder.length}
              </span>
              <span className="text-xs text-slate-400">Speak your clue aloud to the room!</span>
            </div>

            <div className="flex items-center justify-center gap-4 py-2">
              <Avatar
                avatarId={activeSpeakerPlayer?.avatarId}
                avatarBackground={activeSpeakerPlayer?.avatarBackground}
                size="md"
                isSpeaking={true}
              />
              <div className="text-left">
                <span className="text-xs text-slate-400 block font-semibold">Current Speaker:</span>
                <h4 className="text-xl font-black text-white">{activeSpeakerPlayer?.name}</h4>
              </div>
            </div>

            <p className="text-xs text-slate-300 max-w-md mx-auto">
              Give a one-word or short clue related to your secret word. Do not make it too obvious for the imposter!
            </p>

            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                size="lg"
                variant="primary"
                icon={<ArrowRight className="w-5 h-5" />}
                onClick={advanceSpeakerTurn}
                className="px-8 shadow-purple-600/50"
              >
                {currentSpeakerIndex + 1 < speakerOrder.length ? 'Next Speaker →' : 'Finish Clues & Discuss →'}
              </Button>
            </div>
          </div>
        )}

        {/* PHASE: DISCUSSION */}
        {phase === 'DISCUSSION' && (
          <div className="bg-[#11172E] border-2 border-amber-500/40 rounded-3xl p-5 shadow-2xl text-center space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> Discussion Open
              </span>
              <span className="text-xl font-mono font-black text-amber-300">
                {discussionSecondsLeft}s
              </span>
            </div>

            <h4 className="text-lg font-black text-white">Who seems suspicious?</h4>
            <p className="text-xs text-slate-300 max-w-md mx-auto">
              Question each other's clues! Notice hesitation, vague answers, or anything that doesn't fit the category.
            </p>

            <Button
              size="lg"
              variant="amber"
              onClick={() => advancePhase('VOTING')}
              className="px-8"
            >
              Ready to Vote →
            </Button>
          </div>
        )}

        {/* PHASE: VOTING */}
        {phase === 'VOTING' && (
          <div className="bg-[#11172E] border-2 border-rose-500/40 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-black uppercase tracking-wider text-rose-400">
                Local Voting ({Object.keys(votes).length}/{players.length} Cast)
              </span>
              <span className="text-xs text-slate-400">Pass device to vote secretly</span>
            </div>

            {/* Voter selection dropdown or toggle */}
            <div className="flex items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
              <span className="text-xs font-bold text-slate-300">Voter:</span>
              <select
                value={activeVoterId}
                onChange={(e) => {
                  setActiveVoterId(e.target.value);
                  setSelectedTargetId(null);
                }}
                className="bg-[#12182C] border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-none"
              >
                {players.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} {votes[p.id] ? '✓ (Voted)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Target selection prompt */}
            <div className="text-center py-1">
              <span className="text-xs text-slate-400 block">Who is this voter pointing at?</span>
              <span className="text-base font-black text-white">
                {selectedTargetId
                  ? `Selected: ${players.find(p => p.id === selectedTargetId)?.name}`
                  : 'Tap any character around the table'}
              </span>
            </div>

            <div className="flex items-center justify-center gap-3">
              <Button
                size="lg"
                variant="primary"
                disabled={!selectedTargetId}
                onClick={handleCastVote}
                className="w-full sm:w-auto px-8 shadow-rose-600/50"
              >
                Lock Vote for {players.find(p => p.id === activeVoterId)?.name}
              </Button>

              {Object.keys(votes).length >= players.length && (
                <Button size="lg" variant="success" onClick={evaluateVotes}>
                  Reveal Results →
                </Button>
              )}
            </div>
          </div>
        )}

        {/* PHASE: IMPOSTER_GUESS */}
        {phase === 'IMPOSTER_GUESS' && (
          <div className="bg-[#11172E] border-2 border-amber-500/50 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <span className="text-xs font-black uppercase tracking-wider text-amber-400 bg-amber-950/80 px-3 py-1 rounded-full border border-amber-500/40">
              Last Chance Guess
            </span>
            <h3 className="text-xl font-black text-white">
              The Imposter was caught! Can they guess the secret word?
            </h3>
            <p className="text-xs text-slate-300">
              If the imposter guesses the secret word correctly now, they steal the win! Category: <strong>{category}</strong>
            </p>

            <div className="max-w-sm mx-auto flex gap-2">
              <Input
                value={imposterGuessInput}
                onChange={(e) => setImposterGuessInput(e.target.value.toUpperCase())}
                placeholder="Type word guess..."
                className="text-center uppercase font-bold tracking-wider"
              />
              <Button
                variant="amber"
                disabled={!imposterGuessInput.trim()}
                onClick={() => submitImposterGuess(imposterGuessInput)}
              >
                Submit
              </Button>
            </div>

            <button
              type="button"
              onClick={() => submitImposterGuess('___SKIPPED___')}
              className="text-xs text-slate-400 hover:text-white underline"
            >
              Skip Guess (Concede Round)
            </button>
          </div>
        )}

        {/* PHASE: ROUND_RESULTS */}
        {phase === 'ROUND_RESULTS' && (
          <div className="bg-[#11172E] border-2 border-purple-500/40 rounded-3xl p-6 shadow-2xl text-center space-y-5">
            <div className="space-y-1">
              <span className="text-xs font-black uppercase tracking-widest text-purple-400">
                Round {roundNumber} Complete
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                {winner === 'NORMAL_PLAYERS' ? '🎉 Crewmates Win!' : '😈 Imposter Wins!'}
              </h3>
            </div>

            {/* Revealed Secret Information */}
            <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Secret Word</span>
                <span className="text-lg font-black text-cyan-400 uppercase">{secretWord}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">The Imposter</span>
                <span className="text-lg font-black text-rose-400">
                  {players.find(p => p.id === imposterIds[0])?.name}
                </span>
              </div>
            </div>

            {/* Scores Table */}
            <div className="max-w-md mx-auto space-y-2">
              <span className="text-xs font-bold text-slate-400 block uppercase">Scoreboard</span>
              <div className="space-y-1.5">
                {players.map(p => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-bold text-white"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar avatarId={p.avatarId} avatarBackground={p.avatarBackground} size="sm" />
                      <span>{p.name}</span>
                      {imposterIds.includes(p.id) && (
                        <span className="text-[10px] text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-500/30">
                          Imposter
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-mono">
                        +{pointsAwarded[p.id] || 0} pts
                      </span>
                      <span className="text-amber-400 font-mono">{p.score} total</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <Button size="lg" variant="primary" icon={<RotateCcw className="w-5 h-5" />} onClick={playNextRound}>
                Play Next Round
              </Button>
              <Button size="lg" variant="secondary" onClick={() => {
                resetToSetup();
                onNavigate('offline-setup');
              }}>
                Finish Match
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
