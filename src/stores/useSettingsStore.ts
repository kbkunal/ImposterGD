import { create } from 'zustand';
import { soundEngine } from '../services/game/soundEngine';

interface SettingsState {
  soundEnabled: boolean;
  volume: number;
  reducedMotion: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  setVolume: (volume: number) => void;
  setReducedMotion: (reduced: boolean) => void;
}

const SETTINGS_KEY = 'imposter_user_settings';

export const useSettingsStore = create<SettingsState>((set) => {
  // Read saved settings
  const saved = typeof window !== 'undefined' ? localStorage.getItem(SETTINGS_KEY) : null;
  const initial = saved ? JSON.parse(saved) : { soundEnabled: true, volume: 0.6, reducedMotion: false };

  // Sync to sound engine
  soundEngine.setMuted(!initial.soundEnabled);
  soundEngine.setVolume(initial.volume);

  return {
    soundEnabled: initial.soundEnabled,
    volume: initial.volume,
    reducedMotion: initial.reducedMotion,

    setSoundEnabled: (enabled: boolean) => {
      soundEngine.setMuted(!enabled);
      set((state) => {
        const next = { ...state, soundEnabled: enabled };
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
        return { soundEnabled: enabled };
      });
    },

    setVolume: (volume: number) => {
      soundEngine.setVolume(volume);
      set((state) => {
        const next = { ...state, volume };
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
        return { volume };
      });
    },

    setReducedMotion: (reduced: boolean) => {
      set((state) => {
        const next = { ...state, reducedMotion: reduced };
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
        return { reducedMotion: reduced };
      });
    },
  };
});
