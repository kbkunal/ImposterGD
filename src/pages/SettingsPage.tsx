import React from 'react';
import { useSettingsStore } from '../stores/useSettingsStore';
import { soundEngine } from '../services/game/soundEngine';
import { Button } from '../components/ui/Button';
import {
  Settings,
  Volume2,
  VolumeX,
  Sparkles,
  Eye,
  Sliders,
  Check,
} from 'lucide-react';

export interface SettingsPageProps {
  onNavigate: (page: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigate }) => {
  const {
    soundEnabled,
    volume,
    reducedMotion,
    setSoundEnabled,
    setVolume,
    setReducedMotion,
  } = useSettingsStore();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6 text-left">
      <div>
        <span className="text-xs font-black uppercase tracking-wider text-purple-400">
          Preferences
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2 mt-0.5">
          <Settings className="w-7 h-7 text-purple-400" />
          Game Settings
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Audio effects, visual accessibility, and game experience preferences
        </p>
      </div>

      <div className="bg-[#10162B] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
        {/* Audio Effects Setting */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-white">Procedural Sound Effects</h4>
                <p className="text-xs text-slate-400">
                  Card dealing, flip, countdown ticks, role reveals, and victory sounds
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {/* Volume Slider */}
          {soundEnabled && (
            <div className="pl-13 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span>Volume Level</span>
                <span>{Math.round(volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />

              {/* Sound Test Buttons */}
              <div className="pt-2 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => soundEngine.playClick()}
                >
                  Test Click
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => soundEngine.playCardFlip()}
                >
                  Test Card Flip
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => soundEngine.playVictory()}
                >
                  Test Victory Chime
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-slate-800" />

        {/* Reduced Motion Accessibility Setting */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-white">Reduced Motion</h4>
              <p className="text-xs text-slate-400">
                Minimize background floating animations and intense 3D table rotations
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={reducedMotion}
              onChange={(e) => setReducedMotion(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
          </label>
        </div>
      </div>

      <div className="flex justify-end">
        <Button variant="primary" onClick={() => onNavigate('dashboard')}>
          Done
        </Button>
      </div>
    </div>
  );
};
