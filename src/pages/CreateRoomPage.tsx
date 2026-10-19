import React, { useState } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { useGameStore } from '../stores/useGameStore';
import { RoomSettings, HintMode, WordDifficulty } from '../types/game';
import { CATEGORIES } from '../services/game/wordBank';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  Gamepad2,
  Globe,
  Lock,
  Clock,
  Sparkles,
  Users,
  Shield,
  HelpCircle,
  Skull,
  Zap,
  Check,
  ChevronRight,
  Flame,
} from 'lucide-react';

export interface CreateRoomPageProps {
  onNavigate: (page: string) => void;
}

export const CreateRoomPage: React.FC<CreateRoomPageProps> = ({ onNavigate }) => {
  const { user } = useAuthStore();
  const { createRoom, isLoading, error } = useGameStore();

  const [roomName, setRoomName] = useState(`${user?.display_name || 'Player'}'s Table`);
  const [isPublic, setIsPublic] = useState(false);
  const [category, setCategory] = useState<string>('All');
  const [difficulty, setDifficulty] = useState<WordDifficulty>('ALL');
  const [hintMode, setHintMode] = useState<HintMode>('RELATED_WORD');
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [imposterCount, setImposterCount] = useState(1);
  const [clueRounds, setClueRounds] = useState(1);
  const [discussionTimer, setDiscussionTimer] = useState(60);
  const [allowLastChance, setAllowLastChance] = useState(true);
  const [allowTextClues, setAllowTextClues] = useState(true);

  // Auto adjust imposter count if maxPlayers changes
  const handleMaxPlayersChange = (num: number) => {
    setMaxPlayers(num);
    if (num < 5 && imposterCount > 1) {
      setImposterCount(1);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const settings: RoomSettings = {
      min_players: 3,
      max_players: maxPlayers,
      imposter_count: imposterCount,
      category,
      difficulty,
      hint_mode: hintMode,
      clue_rounds: clueRounds,
      clue_timer_seconds: 35,
      discussion_timer_seconds: discussionTimer,
      voting_timer_seconds: 45,
      allow_last_chance_guess: allowLastChance,
      allow_text_clues: allowTextClues,
      is_public: isPublic,
    };

    const room = await createRoom(user, roomName, isPublic, settings);
    if (room) {
      onNavigate('waiting-room');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-black uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            Lobby Headquarters
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
            <Gamepad2 className="w-8 h-8 text-cyan-400" />
            Create Game Room
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Craft your rules, choose secret word topics, and assemble your suspects.
          </p>
        </div>
      </div>

      <form onSubmit={handleCreate} className="space-y-6">
        {/* Basic Room Settings */}
        <div className="bg-[#10162B] border-2 border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-5">
          <div className="flex items-center gap-2 text-cyan-400">
            <Shield className="w-5 h-5" />
            <h2 className="text-sm font-black uppercase tracking-wider text-white">
              Room Identity & Access
            </h2>
          </div>

          <Input
            label="Room Name"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="Give your room a fun name..."
            required
            className="text-base font-bold"
          />

          {/* Visibility Selector */}
          <div>
            <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-2">
              Lobby Visibility
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsPublic(false)}
                className={`flex items-center gap-3.5 p-3.5 rounded-2xl border-2 transition-all text-left ${
                  !isPublic
                    ? 'bg-purple-950/40 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.25)] text-white'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${
                  !isPublic ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  <Lock className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm block text-white">Private Room</span>
                    {!isPublic && <Check className="w-4 h-4 text-purple-400" />}
                  </div>
                  <span className="text-xs text-slate-400">Join with 6-letter room code only</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIsPublic(true)}
                className={`flex items-center gap-3.5 p-3.5 rounded-2xl border-2 transition-all text-left ${
                  isPublic
                    ? 'bg-cyan-950/40 border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.25)] text-white'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${
                  isPublic ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  <Globe className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm block text-white">Public Room</span>
                    {isPublic && <Check className="w-4 h-4 text-cyan-400" />}
                  </div>
                  <span className="text-xs text-slate-400">Visible in Public Room list for anyone</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Word Bank & Category Settings */}
        <div className="bg-[#10162B] border-2 border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-5">
          <div className="flex items-center gap-2 text-purple-400">
            <Zap className="w-5 h-5" />
            <h2 className="text-sm font-black uppercase tracking-wider text-white">
              Word Bank & Mystery Theme
            </h2>
          </div>

          {/* Category Selector Pills */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black text-slate-300 uppercase tracking-wider">
                Category Selection
              </label>
              <span className="text-xs font-bold text-purple-400">Selected: {category}</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-2 rounded-xl text-xs font-black transition-all border ${
                      isSelected
                        ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-500/30 scale-105'
                        : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Difficulty Selection */}
          <div>
            <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-2">
              Word Difficulty
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {([
                { id: 'ALL', label: 'All Levels', desc: 'Mix of everything', color: 'purple' },
                { id: 'EASY', label: 'Easy', desc: 'Simple & common', color: 'emerald' },
                { id: 'MEDIUM', label: 'Medium', desc: 'Slightly tricky', color: 'amber' },
                { id: 'HARD', label: 'Hard', desc: 'Obscure & subtle', color: 'rose' },
              ] as const).map((diff) => {
                const isSelected = difficulty === diff.id;
                return (
                  <button
                    key={diff.id}
                    type="button"
                    onClick={() => setDifficulty(diff.id)}
                    className={`p-3 rounded-2xl text-left border-2 transition-all ${
                      isSelected
                        ? 'bg-purple-600/30 border-purple-500 text-white shadow-lg'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-xs font-black block text-white uppercase">{diff.label}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{diff.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Imposter Hint Mode */}
          <div>
            <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-2">
              Imposter Hint Mode
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setHintMode('RELATED_WORD')}
                className={`p-3.5 rounded-2xl border-2 text-left transition-all ${
                  hintMode === 'RELATED_WORD'
                    ? 'bg-purple-950/40 border-purple-500 shadow-md text-white'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-white">Related Word (Classic)</span>
                  {hintMode === 'RELATED_WORD' && <Check className="w-3.5 h-3.5 text-purple-400" />}
                </div>
                <span className="text-[11px] text-slate-400 block">
                  Word: <span className="text-cyan-300 font-bold">APPLE</span> → Imposter gets <span className="text-rose-300 font-bold">RED</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => setHintMode('CATEGORY_ONLY')}
                className={`p-3.5 rounded-2xl border-2 text-left transition-all ${
                  hintMode === 'CATEGORY_ONLY'
                    ? 'bg-purple-950/40 border-purple-500 shadow-md text-white'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-white">Category Only</span>
                  {hintMode === 'CATEGORY_ONLY' && <Check className="w-3.5 h-3.5 text-purple-400" />}
                </div>
                <span className="text-[11px] text-slate-400 block">
                  Imposter only knows the general theme, no specific hint word.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setHintMode('NO_HINT')}
                className={`p-3.5 rounded-2xl border-2 text-left transition-all ${
                  hintMode === 'NO_HINT'
                    ? 'bg-rose-950/40 border-rose-500 shadow-md text-white'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-white">Blind (Hardcore)</span>
                  {hintMode === 'NO_HINT' && <Check className="w-3.5 h-3.5 text-rose-400" />}
                </div>
                <span className="text-[11px] text-slate-400 block">
                  Zero clue. Pure social deduction & intense bluffing!
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Players & Timers */}
        <div className="bg-[#10162B] border-2 border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-5">
          <div className="flex items-center gap-2 text-amber-400">
            <Users className="w-5 h-5" />
            <h2 className="text-sm font-black uppercase tracking-wider text-white">
              Player Limits & Imposters
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Player Capacity */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-black text-slate-300 uppercase tracking-wider">
                  Player Capacity
                </label>
                <span className="text-sm font-black text-amber-400">{maxPlayers} Players</span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                {[3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleMaxPlayersChange(num)}
                    className={`w-10 h-10 rounded-xl font-black text-sm transition-all border ${
                      maxPlayers === num
                        ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-md'
                        : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Imposter Count */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-black text-slate-300 uppercase tracking-wider">
                  Imposter Count
                </label>
                <span className="text-sm font-black text-rose-400">
                  {imposterCount} Imposter{imposterCount > 1 ? 's' : ''}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setImposterCount(1)}
                  className={`p-2.5 rounded-xl border font-black text-xs transition-all flex items-center justify-center gap-2 ${
                    imposterCount === 1
                      ? 'bg-rose-600/30 border-rose-500 text-white'
                      : 'bg-slate-900/80 border-slate-800 text-slate-400'
                  }`}
                >
                  <Skull className="w-4 h-4 text-rose-400" />
                  1 Imposter
                </button>

                <button
                  type="button"
                  disabled={maxPlayers < 5}
                  onClick={() => setImposterCount(2)}
                  className={`p-2.5 rounded-xl border font-black text-xs transition-all flex items-center justify-center gap-2 ${
                    imposterCount === 2
                      ? 'bg-rose-600/30 border-rose-500 text-white'
                      : maxPlayers < 5
                      ? 'bg-slate-900/30 border-slate-900 text-slate-600 cursor-not-allowed'
                      : 'bg-slate-900/80 border-slate-800 text-slate-400'
                  }`}
                >
                  <Skull className="w-4 h-4 text-rose-400" />
                  2 Imposters {maxPlayers < 5 && '(5+ Req)'}
                </button>
              </div>
            </div>
          </div>

          {/* Discussion Timer */}
          <div>
            <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-2">
              Discussion Debate Timer
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { sec: 30, label: '30s Blitz' },
                { sec: 45, label: '45s Standard' },
                { sec: 60, label: '60s Relaxed' },
                { sec: 90, label: '90s Intense' },
              ].map(({ sec, label }) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setDiscussionTimer(sec)}
                  className={`py-2 px-3 rounded-xl text-xs font-black border transition-all ${
                    discussionTimer === sec
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md'
                      : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Bonus Toggles */}
          <div className="pt-2 space-y-2.5">
            <label
              onClick={() => setAllowLastChance(!allowLastChance)}
              className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-800 cursor-pointer hover:border-slate-700 transition-all select-none"
            >
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                  allowLastChance
                    ? 'bg-purple-600 border-purple-400 text-white'
                    : 'bg-slate-800 border-slate-700 text-transparent'
                }`}
              >
                <Check className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <span className="text-xs font-extrabold text-white block">
                  Last-Chance Redemption Guess (+2 Pts)
                </span>
                <span className="text-[11px] text-slate-400 block">
                  Caught imposter can steal points if they guess the secret word before round end.
                </span>
              </div>
            </label>

            <label
              onClick={() => setAllowTextClues(!allowTextClues)}
              className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-800 cursor-pointer hover:border-slate-700 transition-all select-none"
            >
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                  allowTextClues
                    ? 'bg-purple-600 border-purple-400 text-white'
                    : 'bg-slate-800 border-slate-700 text-transparent'
                }`}
              >
                <Check className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <span className="text-xs font-extrabold text-white block">
                  Enable In-Game Text Clues & Clue Log
                </span>
                <span className="text-[11px] text-slate-400 block">
                  Players can type their clues in addition to speaking aloud.
                </span>
              </div>
            </label>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs font-bold text-center">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            size="lg"
            onClick={() => onNavigate('dashboard')}
            fullWidth
            className="sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            icon={<Gamepad2 className="w-5 h-5" />}
            fullWidth
            className="sm:w-auto text-base font-black px-8"
          >
            Create Room & Open Table
          </Button>
        </div>
      </form>
    </div>
  );
};

