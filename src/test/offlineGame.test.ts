import { describe, it, expect, beforeEach } from 'vitest';
import { offlineGameService } from '../services/offline/offlineGameService';
import { useOfflineGameStore } from '../stores/useOfflineGameStore';

describe('Offline Pass & Play Engine & Privacy Flow', () => {
  beforeEach(() => {
    useOfflineGameStore.getState().resetToSetup();
  });

  it('initializes with default 4 players and minimum constraints', () => {
    const store = useOfflineGameStore.getState();
    expect(store.players.length).toBe(4);
    expect(store.phase).toBe('PLAYER_SETUP');
  });

  it('allows adding, editing, removing, and reordering players', () => {
    const store = useOfflineGameStore.getState();

    // Add player
    store.addPlayer('Maya');
    expect(useOfflineGameStore.getState().players.length).toBe(5);

    // Edit player name
    const added = useOfflineGameStore.getState().players[4];
    store.editPlayerName(added.id, 'Maya Detective');
    expect(useOfflineGameStore.getState().players[4].name).toBe('Maya Detective');

    // Reorder player
    store.reorderPlayers(4, 0);
    expect(useOfflineGameStore.getState().players[0].name).toBe('Maya Detective');

    // Remove player
    store.removePlayer(added.id);
    expect(useOfflineGameStore.getState().players.length).toBe(4);

    // Cannot remove below 3 players
    const p1 = useOfflineGameStore.getState().players[0];
    store.removePlayer(p1.id);
    expect(useOfflineGameStore.getState().players.length).toBe(3);
    const p2 = useOfflineGameStore.getState().players[0];
    store.removePlayer(p2.id); // Should be ignored
    expect(useOfflineGameStore.getState().players.length).toBe(3);
  });

  it('selects correct number of imposters and gives normal players identical secret words', () => {
    const store = useOfflineGameStore.getState();
    store.setSettings({ imposterCount: 1, category: 'Food and Drinks', difficulty: 'EASY' });

    store.startRound();

    const state = useOfflineGameStore.getState();
    expect(state.phase).toBe('CARD_REVEAL');
    expect(state.imposterIds.length).toBe(1);
    expect(state.secretWord).toBeTruthy();

    const imposterId = state.imposterIds[0];
    const imposterCard = state.assignments[imposterId];
    expect(imposterCard.role).toBe('IMPOSTER');
    expect(imposterCard.secretWord).toBeUndefined(); // Imposter does NOT see secret word
    expect(imposterCard.hint).toBeTruthy(); // Imposter sees hint

    const normalCards = Object.values(state.assignments).filter(a => a.playerId !== imposterId);
    expect(normalCards.length).toBe(state.players.length - 1);
    normalCards.forEach(card => {
      expect(card.role).toBe('NORMAL');
      expect(card.secretWord).toBe(state.secretWord); // All normal players share exact same secret word
      expect(card.hint).toBeUndefined();
    });
  });

  it('supports multiple imposters when configured', () => {
    const store = useOfflineGameStore.getState();
    store.addPlayer('Extra 1');
    store.addPlayer('Extra 2'); // Now 6 players
    store.setSettings({ imposterCount: 2 });

    store.startRound();

    const state = useOfflineGameStore.getState();
    expect(state.imposterIds.length).toBe(2);
    expect(state.imposterIds[0]).not.toBe(state.imposterIds[1]);

    const imposter1 = state.assignments[state.imposterIds[0]];
    const imposter2 = state.assignments[state.imposterIds[1]];
    expect(imposter1.role).toBe('IMPOSTER');
    expect(imposter2.role).toBe('IMPOSTER');
  });

  it('enforces sequential card handover and immediately conceals cards', () => {
    const store = useOfflineGameStore.getState();
    store.startRound();

    let state = useOfflineGameStore.getState();
    expect(state.phase).toBe('CARD_REVEAL');
    expect(state.handoverPlayerIndex).toBe(0);
    expect(state.isCardRevealed).toBe(false); // Neutral screen initially

    // Player 1 reveals card
    store.revealCurrentCard();
    expect(useOfflineGameStore.getState().isCardRevealed).toBe(true);

    // Player 1 conceals card -> must transition to Player 2 neutral screen
    store.concealCardAndNextPlayer();
    state = useOfflineGameStore.getState();
    expect(state.handoverPlayerIndex).toBe(1);
    expect(state.isCardRevealed).toBe(false); // Concealed!

    // Step through remaining players
    const totalPlayers = state.players.length;
    for (let i = 1; i < totalPlayers; i++) {
      store.revealCurrentCard();
      expect(useOfflineGameStore.getState().isCardRevealed).toBe(true);
      store.concealCardAndNextPlayer();
    }

    // After final player, main clue phase starts automatically
    state = useOfflineGameStore.getState();
    expect(state.phase).toBe('CLUE_ROUND');
    expect(state.isCardRevealed).toBe(false);
  });

  it('completes entire game loop through voting and scoring without errors', () => {
    const store = useOfflineGameStore.getState();
    store.startRound();

    // Fast forward through card reveal
    for (let i = 0; i < store.players.length; i++) {
      store.revealCurrentCard();
      store.concealCardAndNextPlayer();
    }

    expect(useOfflineGameStore.getState().phase).toBe('CLUE_ROUND');

    // Advance speaker turn to completion
    const speakerCount = useOfflineGameStore.getState().speakerOrder.length;
    for (let i = 0; i < speakerCount; i++) {
      useOfflineGameStore.getState().advanceSpeakerTurn();
    }

    // Now in discussion phase
    expect(useOfflineGameStore.getState().phase).toBe('DISCUSSION');
    useOfflineGameStore.getState().advancePhase('VOTING');
    expect(useOfflineGameStore.getState().phase).toBe('VOTING');

    // Cast votes
    const state = useOfflineGameStore.getState();
    const imposterId = state.imposterIds[0];
    const normalPlayers = state.players.filter(p => p.id !== imposterId);

    // Normal players vote for imposter
    normalPlayers.forEach(p => {
      useOfflineGameStore.getState().recordVote(p.id, imposterId);
    });
    // Imposter votes for first normal player
    useOfflineGameStore.getState().recordVote(imposterId, normalPlayers[0].id);

    // Check evaluation
    const finalState = useOfflineGameStore.getState();
    expect(finalState.imposterCaught).toBe(true);
    expect(['IMPOSTER_GUESS', 'ROUND_RESULTS'].includes(finalState.phase)).toBe(true);
  });
});
