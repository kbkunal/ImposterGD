import React, { useState } from 'react';
import { useOfflineGameStore } from '../stores/useOfflineGameStore';
import { CATEGORIES } from '../services/game/wordBank';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  Users,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Play,
  ArrowLeft,
  Skull,
  Layers,
  Sparkles,
  Shield,
  HelpCircle,
  Settings,
} from 'lucide-react';
import { WordDifficulty, HintMode } from '../types/game';

export interface OfflineSetupPageProps {
  onNavigate: (page: string) => void;
}

export const OfflineSetupPage: React.FC<OfflineSetupPageProps> = ({ onNavigate }) => {
  const {
    players,
    settings,
    addPlayer,
    editPlayerName,
    removePlayer,
    reorderPlayers,
    setSettings,
    startRound,
  } = useOfflineGameStore();

  const [newPlayerName, setNewPlayerName] = useState('');

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlayerName.trim()) {
      addPlayer(newPlayerName.trim());
      setNewPlayerName('');
    } else {
      addPlayer();
    }
  };

  const handleStartGame = () => {
    if (players.length < 3) return;
    startRound();
    onNavigate('offline-game');
  };

  const maxImpostersAllowed = Math.max(1, players.length - 1);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 text-left">
      {/* Top Banner */}
      <div className="flex items-center justify-between gap-4 bg-[#11172E] border border-purple-500/30 p-5 rounded-3xl shadow-xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('landing')}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all"
            title="Back to Mode Selection"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 bg-purple-950/80 px-2 py-0.5 rounded-full border border-purple-500/30">
                Offline Mode
              </span>
              <span className="text-xs text-slate-400">• Pass & Play on One Device</span>
            </div>
            <h2 className="text-2xl font-black text-white mt-0.5">Local Game Setup</h2>
          </div>
        </div>

        <Button
          size="lg"
          variant="primary"
          icon={<Play className="w-5 h-5 fill-current" />}
          disabled={players.length < 3}
          onClick={handleStartGame}
          className="shadow-purple-600/50 text-base px-6"
        >
          Start Game ({players.length} Players)
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Player Names & Reordering */}
        <div className="md:col-span-2 bg-[#0E1428] border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />
              <h3 className="text-base font-black text-white uppercase tracking-wider">
                Players List ({players.length})
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-semibold">Min 3 • Max 12</span>
          </div>

          {/* Quick Add Player Form */}
          <form onSubmit={handleAddPlayer} className="flex gap-2">
            <Input
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              placeholder="Enter player name (e.g. Jordan)"
              maxLength={18}
            />
            <Button type="submit" variant="amber" icon={<Plus className="w-4 h-4" />}>
              Add
            </Button>
          </form>

          {/* Draggable / Reorderable Player Entries */}
          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {players.map((p, idx) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-xs font-mono font-bold text-slate-500 w-5">
                    #{idx + 1}
                  </span>
                  <Avatar avatarId={p.avatarId} avatarBackground={p.avatarBackground} size="sm" />
                  <input
                    type="text"
                    value={p.name}
                    onChange={(e) => editPlayerName(p.id, e.target.value)}
                    maxLength={18}
                    className="bg-transparent border-b border-transparent hover:border-slate-700 focus:border-purple-400 focus:outline-none text-sm font-bold text-white w-full px-1 py-0.5 rounded transition-all"
                  />
                </div>

                {/* Move & Delete buttons */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => reorderPlayers(idx, idx - 1)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-25 transition-all"
                    title="Move up"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === players.length - 1}
                    onClick={() => reorderPlayers(idx, idx + 1)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-25 transition-all"
                    title="Move down"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={players.length <= 3}
                    onClick={() => removePlayer(p.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 disabled:opacity-20 transition-all ml-1"
                    title="Remove player"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Game Rules & Settings */}
        <div className="bg-[#0E1428] border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Settings className="w-5 h-5 text-purple-400" />
              <h3 className="text-base font-black text-white uppercase tracking-wider">
                Game Settings
              </h3>
            </div>

            {/* Imposter Count Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>Imposter Count</span>
                <span className="text-amber-400 font-mono font-black">{settings.imposterCount}</span>
              </label>
              <div className="flex gap-2">
                {[1, 2, 3].map((count) => (
                  <button
                    key={count}
                    type="button"
                    disabled={count >= players.length}
                    onClick={() => setSettings({ imposterCount: count })}
                    className={`flex-1 py-2 rounded-xl text-xs font-black transition-all border ${
                      settings.imposterCount === count
                        ? 'bg-rose-600/30 border-rose-500 text-rose-300 shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white disabled:opacity-30'
                    }`}
                  >
                    {count} {count === 1 ? 'Imposter' : 'Imposters'}
                  </button>
                ))}
              </div>
            </div>

            {/* Word Category */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Word Category</label>
              <select
                value={settings.category}
                onChange={(e) => setSettings({ category: e.target.value })}
                className="w-full bg-[#12182C] border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-purple-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulty */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Difficulty</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['EASY', 'MEDIUM', 'HARD'] as WordDifficulty[]).map((diff) => (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setSettings({ difficulty: diff })}
                    className={`py-1.5 rounded-xl text-[11px] font-black transition-all border ${
                      settings.difficulty === diff
                        ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            {/* Imposter Hint Mode */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Imposter Hint Mode</label>
              <div className="space-y-1.5">
                {[
                  { mode: 'RELATED_WORD', label: 'Related Word Hint', desc: 'Imposter receives a helpful one-word clue' },
                  { mode: 'CATEGORY_ONLY', label: 'Category Only', desc: 'Imposter only knows the general category' },
                  { mode: 'NO_HINT', label: 'No Hint (Hardcore)', desc: 'Imposter gets zero clues' },
                ].map((item) => (
                  <button
                    key={item.mode}
                    type="button"
                    onClick={() => setSettings({ hintMode: item.mode as HintMode })}
                    className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all ${
                      settings.hintMode === item.mode
                        ? 'bg-purple-950/60 border-purple-500 text-purple-200'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="block font-bold text-white">{item.label}</span>
                    <span className="text-[10px] text-slate-400">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Last Chance Guess Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <div>
                <span className="text-xs font-bold text-white block">Last Chance Guess</span>
                <span className="text-[10px] text-slate-400 block">
                  Caught imposter can guess word to steal win
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.allowLastChanceGuess}
                onChange={(e) => setSettings({ allowLastChanceGuess: e.target.checked })}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-slate-800 border-slate-700 cursor-pointer"
              />
            </div>
          </div>

          <Button
            size="lg"
            variant="primary"
            icon={<Play className="w-5 h-5 fill-current" />}
            disabled={players.length < 3}
            onClick={handleStartGame}
            fullWidth
            className="shadow-purple-600/50 text-base"
          >
            Start Match Now
          </Button>
        </div>
      </div>
    </div>
  );
};
