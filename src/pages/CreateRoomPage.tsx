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
  Layers,
  Clock,
  Sparkles,
  Users,
  Shield,
  HelpCircle,
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
  const [clueRounds, setClueRounds] = useState(1);
  const [discussionTimer, setDiscussionTimer] = useState(60);
  const [allowLastChance, setAllowLastChance] = useState(true);
  const [allowTextClues, setAllowTextClues] = useState(true);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const settings: RoomSettings = {
      min_players: 3,
      max_players: maxPlayers,
      imposter_count: 1,
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
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 text-left">
      <div>
        <span className="text-xs font-black uppercase tracking-wider text-purple-400">
          Room Setup
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2 mt-0.5">
          <Gamepad2 className="w-7 h-7 text-purple-400" />
          Create Game Room
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Configure rules, word categories, and timers for your multiplayer session
        </p>
      </div>

      <form onSubmit={handleCreate} className="space-y-6">
        {/* Basic Room Settings */}
        <div className="bg-[#10162B] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
          <h4 className="text-sm font-black uppercase tracking-wider text-white">
            General Settings
          </h4>

          <Input
            label="Room Name"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="Give your room a fun name..."
            required
          />

          {/* Public / Private Room Toggle */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Room Visibility
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsPublic(false)}
                className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-left ${
                  !isPublic
                    ? 'bg-purple-600/20 border-purple-500 ring-2 ring-purple-500/40 text-white'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-purple-400">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-xs block text-white">Private Room</span>
                  <span className="text-[10px] text-slate-400">Join via 6-letter room code only</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIsPublic(true)}
                className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-left ${
                  isPublic
                    ? 'bg-purple-600/20 border-purple-500 ring-2 ring-purple-500/40 text-white'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-cyan-400">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-xs block text-white">Public Room</span>
                  <span className="text-[10px] text-slate-400">Listed in Public Room Browser</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Word Bank & Category Settings */}
        <div className="bg-[#10162B] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
          <h4 className="text-sm font-black uppercase tracking-wider text-white">
            Word Bank & Clue Dynamics
          </h4>

          {/* Category Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Word Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-[#12182C] text-slate-100 rounded-xl px-4 py-3 text-sm font-medium border border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Word Difficulty
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['ALL', 'EASY', 'MEDIUM', 'HARD'] as WordDifficulty[]).map((diff) => (
                <button
                  key={diff}
                  type="button"
                  onClick={() => setDifficulty(diff)}
                  className={`py-2 px-3 rounded-xl text-xs font-extrabold uppercase border transition-all ${
                    difficulty === diff
                      ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                      : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          {/* Imposter Hint Mode */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Imposter Hint Mode
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setHintMode('RELATED_WORD')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  hintMode === 'RELATED_WORD'
                    ? 'bg-purple-600/20 border-purple-500 ring-2 ring-purple-500/40 text-white'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400'
                }`}
              >
                <span className="text-xs font-bold block text-white">Related Word (Classic)</span>
                <span className="text-[10px] text-slate-400">e.g. Secret: APPLE → Hint: RED</span>
              </button>

              <button
                type="button"
                onClick={() => setHintMode('CATEGORY_ONLY')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  hintMode === 'CATEGORY_ONLY'
                    ? 'bg-purple-600/20 border-purple-500 ring-2 ring-purple-500/40 text-white'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400'
                }`}
              >
                <span className="text-xs font-bold block text-white">Category Only</span>
                <span className="text-[10px] text-slate-400">Imposter only knows the general topic</span>
              </button>

              <button
                type="button"
                onClick={() => setHintMode('NO_HINT')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  hintMode === 'NO_HINT'
                    ? 'bg-purple-600/20 border-purple-500 ring-2 ring-purple-500/40 text-white'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400'
                }`}
              >
                <span className="text-xs font-bold block text-white">Hardcore (No Hint)</span>
                <span className="text-[10px] text-slate-400">Imposter goes in completely blind</span>
              </button>
            </div>
          </div>
        </div>

        {/* Timers & Advanced Rules */}
        <div className="bg-[#10162B] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h4 className="text-sm font-black uppercase tracking-wider text-white">
            Table Limits & Rules
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Player Capacity (3 - 10)
              </label>
              <select
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
                className="w-full bg-[#12182C] text-slate-100 rounded-xl px-4 py-2.5 text-sm font-medium border border-slate-800"
              >
                {[4, 5, 6, 7, 8, 9, 10].map(num => (
                  <option key={num} value={num}>
                    {num} Players Maximum
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Discussion Timer
              </label>
              <select
                value={discussionTimer}
                onChange={(e) => setDiscussionTimer(parseInt(e.target.value))}
                className="w-full bg-[#12182C] text-slate-100 rounded-xl px-4 py-2.5 text-sm font-medium border border-slate-800"
              >
                <option value={30}>30 Seconds (Fast paced)</option>
                <option value={45}>45 Seconds</option>
                <option value={60}>60 Seconds (Standard)</option>
                <option value={90}>90 Seconds (Deep debate)</option>
              </select>
            </div>
          </div>

          {/* Toggles */}
          <div className="pt-2 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={allowLastChance}
                onChange={(e) => setAllowLastChance(e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 bg-slate-900 border-slate-700 focus:ring-purple-500"
              />
              <span className="text-xs text-slate-300 font-medium">
                Allow Caught Imposter a Last-Chance Secret Word Guess for Redemption (+2 pts)
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={allowTextClues}
                onChange={(e) => setAllowTextClues(e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 bg-slate-900 border-slate-700 focus:ring-purple-500"
              />
              <span className="text-xs text-slate-300 font-medium">
                Enable In-Game Text Clue Submission & Clue Log
              </span>
            </label>
          </div>
        </div>

        {error && <p className="text-xs text-rose-400 font-medium text-center">{error}</p>}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={() => onNavigate('dashboard')}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            icon={<Gamepad2 className="w-4 h-4" />}
          >
            Create Room & Open Table
          </Button>
        </div>
      </form>
    </div>
  );
};
