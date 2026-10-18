import { describe, it, expect } from 'vitest';
import { WORD_BANK, selectSecretWord, getSuitableHint, CATEGORIES } from '../services/game/wordBank';

describe('Word Bank & Hint Generation Rules', () => {
  it('contains at least 300 curated secret-word entries', () => {
    expect(WORD_BANK.length).toBeGreaterThanOrEqual(300);
  });

  it('contains all 16 initial categories', () => {
    CATEGORIES.forEach(cat => {
      if (cat !== 'All') {
        const matches = WORD_BANK.filter(w => w.category === cat);
        expect(matches.length).toBeGreaterThanOrEqual(10);
      }
    });
  });

  it('selects word strictly respecting category and difficulty', () => {
    const word = selectSecretWord('Food and Drinks', 'EASY');
    expect(word.category).toBe('Food and Drinks');
    expect(word.difficulty).toBe('EASY');
    expect(word.word).toBeTruthy();
    expect(word.hints.length).toBeGreaterThan(0);
  });

  it('generates ambiguous one-word hint that does not equal secret word', () => {
    const entry = selectSecretWord('Animals', 'EASY');
    const hint = getSuitableHint(entry, 'RELATED_WORD');

    expect(hint).toBeTruthy();
    // Hint must not be the secret word itself
    expect(hint?.toUpperCase()).not.toBe(entry.word.toUpperCase());
  });

  it('returns category name when in CATEGORY_ONLY mode', () => {
    const entry = selectSecretWord('Fantasy', 'EASY');
    const hint = getSuitableHint(entry, 'CATEGORY_ONLY');
    expect(hint).toBe('FANTASY');
  });

  it('returns null hint when in NO_HINT hardcore mode', () => {
    const entry = selectSecretWord('Sports', 'EASY');
    const hint = getSuitableHint(entry, 'NO_HINT');
    expect(hint).toBeNull();
  });
});
