import { GameRound, Match, RoomPlayer } from '../../types/game';

export interface RoundScoreResult {
  winner: 'NORMAL_PLAYERS' | 'IMPOSTER' | 'TIE_ESCAPED';
  imposterCaught: boolean;
  pointsAwarded: Record<string, number>;
  updatedScores: Record<string, number>;
}

export const scoringService = {
  /**
   * Calculate round scores following standard party game rules:
   * - If Imposter is NOT caught (escaped or tie): Imposter(s) receive +3 points. Normal players 0.
   * - If Imposter is caught AND fails last-chance guess: Normal players each receive +2 points. Imposter 0.
   * - If Imposter is caught BUT correctly guesses the secret word: Imposter receives +2 points. Normal players 0.
   */
  calculateRoundScores(
    round: GameRound,
    match: Match,
    players: RoomPlayer[],
    imposterCaught: boolean,
    lastChanceCorrect?: boolean
  ): RoundScoreResult {
    const pointsAwarded: Record<string, number> = {};
    const updatedScores: Record<string, number> = { ...(match.scores || {}) };

    // Initialize all player point deltas to 0
    players.forEach(p => {
      pointsAwarded[p.user_id] = 0;
      if (updatedScores[p.user_id] === undefined) {
        updatedScores[p.user_id] = 0;
      }
    });

    let winner: 'NORMAL_PLAYERS' | 'IMPOSTER' | 'TIE_ESCAPED';

    if (!imposterCaught) {
      // Imposter escaped
      winner = round.is_tie ? 'TIE_ESCAPED' : 'IMPOSTER';
      round.imposter_user_ids.forEach(id => {
        pointsAwarded[id] = (pointsAwarded[id] || 0) + 3;
        updatedScores[id] = (updatedScores[id] || 0) + 3;
      });
    } else {
      // Imposter was identified by vote
      if (lastChanceCorrect) {
        // Imposter guessed secret word correctly on last chance
        winner = 'IMPOSTER';
        round.imposter_user_ids.forEach(id => {
          pointsAwarded[id] = (pointsAwarded[id] || 0) + 2;
          updatedScores[id] = (updatedScores[id] || 0) + 2;
        });
      } else {
        // Normal players successfully exposed the imposter
        winner = 'NORMAL_PLAYERS';
        players.forEach(p => {
          if (!round.imposter_user_ids.includes(p.user_id)) {
            pointsAwarded[p.user_id] = (pointsAwarded[p.user_id] || 0) + 2;
            updatedScores[p.user_id] = (updatedScores[p.user_id] || 0) + 2;
          }
        });
      }
    }

    return {
      winner,
      imposterCaught,
      pointsAwarded,
      updatedScores,
    };
  },
};
