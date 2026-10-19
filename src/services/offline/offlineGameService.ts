import { selectSecretWord, getSuitableHint } from '../game/wordBank';
import { HintMode, WordDifficulty, PlayerRole } from '../../types/game';

export interface OfflinePlayer {
  id: string; // Internal unique ID (e.g. 'off_p1_abc123')
  name: string;
  avatarId: string;
  avatarBackground: string;
  score: number;
}

export interface OfflineSettings {
  imposterCount: number;
  category: string;
  difficulty: WordDifficulty;
  hintMode: HintMode;
  clueTimerSeconds: number;
  discussionTimerSeconds: number;
  allowLastChanceGuess: boolean;
}

export interface OfflineSecretAssignment {
  playerId: string;
  role: PlayerRole;
  secretWord?: string;
  hint?: string;
  category: string;
}

export const AVATAR_OPTIONS = [
  { id: 'detective', bg: '#8B5CF6' },
  { id: 'astronaut', bg: '#0EA5E9' },
  { id: 'ninja', bg: '#10B981' },
  { id: 'fox', bg: '#F43F5E' },
  { id: 'robot', bg: '#6366F1' },
  { id: 'wizard', bg: '#F59E0B' },
  { id: 'alien', bg: '#14B8A6' },
  { id: 'cat', bg: '#EC4899' },
];

export const offlineGameService = {
  createDefaultPlayers(): OfflinePlayer[] {
    return [
      { id: 'off_p_' + Math.random().toString(36).substring(2, 8), name: 'Player 1', avatarId: 'detective', avatarBackground: '#8B5CF6', score: 0 },
      { id: 'off_p_' + Math.random().toString(36).substring(2, 8), name: 'Player 2', avatarId: 'astronaut', avatarBackground: '#0EA5E9', score: 0 },
      { id: 'off_p_' + Math.random().toString(36).substring(2, 8), name: 'Player 3', avatarId: 'ninja', avatarBackground: '#10B981', score: 0 },
      { id: 'off_p_' + Math.random().toString(36).substring(2, 8), name: 'Player 4', avatarId: 'fox', avatarBackground: '#F43F5E', score: 0 },
    ];
  },

  createDefaultSettings(): OfflineSettings {
    return {
      imposterCount: 1,
      category: 'All',
      difficulty: 'EASY',
      hintMode: 'RELATED_WORD',
      clueTimerSeconds: 30,
      discussionTimerSeconds: 60,
      allowLastChanceGuess: true,
    };
  },

  /**
   * Distribute roles and select secret word & hints strictly in local memory
   */
  startRound(players: OfflinePlayer[], settings: OfflineSettings): {
    secretWord: string;
    hint: string;
    category: string;
    imposterIds: string[];
    assignments: Record<string, OfflineSecretAssignment>;
    speakerOrder: string[];
  } {
    if (players.length < 3) {
      throw new Error('Minimum 3 players required for Pass & Play.');
    }

    const imposterCount = Math.max(1, Math.min(settings.imposterCount, players.length - 1));

    // Authoritative word selection from wordBank
    const wordEntry = selectSecretWord(settings.category, settings.difficulty);
    const hint = getSuitableHint(wordEntry, settings.hintMode) || 'NO HINT';

    // Randomly pick Imposter(s)
    const shuffled = [...players].sort(() => Math.random() - 0.5);
    const imposterIds = shuffled.slice(0, imposterCount).map(p => p.id);

    // Random circular speaker order
    const startIdx = Math.floor(Math.random() * players.length);
    const speakerOrder: string[] = [];
    for (let i = 0; i < players.length; i++) {
      speakerOrder.push(players[(startIdx + i) % players.length].id);
    }

    // Segregated assignments
    const assignments: Record<string, OfflineSecretAssignment> = {};
    players.forEach(p => {
      const isImposter = imposterIds.includes(p.id);
      assignments[p.id] = {
        playerId: p.id,
        role: isImposter ? 'IMPOSTER' : 'NORMAL',
        secretWord: isImposter ? undefined : wordEntry.word,
        hint: isImposter ? hint : undefined,
        category: wordEntry.category,
      };
    });

    return {
      secretWord: wordEntry.word,
      hint,
      category: wordEntry.category,
      imposterIds,
      assignments,
      speakerOrder,
    };
  },
};
