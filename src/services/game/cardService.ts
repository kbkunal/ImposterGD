import { PlayerRole, PrivatePlayerRole } from '../../types/game';

export interface CardPresentationData {
  roleTitle: string;
  roleBadgeText: string;
  roleType: PlayerRole;
  isImposter: boolean;
  keywordLabel: string;
  keywordValue: string;
  instruction: string;
  themeColor: 'rose' | 'cyan';
}

export const cardService = {
  /**
   * Formats role assignment into clean, prominent presentation data
   * as specified in game rules:
   * Normal:
   *   ROLE: CREWMATE
   *   SECRET WORD: APPLE
   *   Instruction: Give a clue related to your word without revealing it directly.
   * Imposter:
   *   ROLE: IMPOSTER
   *   YOUR HINT: RED (or NO HINT)
   *   Instruction: Blend in, listen to the clues, and try to identify the secret word.
   */
  getPresentation(privateRole: PrivatePlayerRole | null): CardPresentationData | null {
    if (!privateRole) return null;

    const isImposter = privateRole.role === 'IMPOSTER';

    if (isImposter) {
      return {
        roleTitle: 'ROLE: IMPOSTER',
        roleBadgeText: 'IMPOSTER',
        roleType: 'IMPOSTER',
        isImposter: true,
        keywordLabel: 'YOUR HINT',
        keywordValue: privateRole.private_hint || 'NO HINT AVAILABLE',
        instruction: 'Blend in, listen to the clues, and try to identify the secret word.',
        themeColor: 'rose',
      };
    }

    return {
      roleTitle: 'ROLE: CREWMATE',
      roleBadgeText: 'CREWMATE',
      roleType: 'NORMAL',
      isImposter: false,
      keywordLabel: 'SECRET WORD',
      keywordValue: privateRole.secret_word || 'UNKNOWN',
      instruction: 'Give a clue related to your word without revealing it directly.',
      themeColor: 'cyan',
    };
  },
};
