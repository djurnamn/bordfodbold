import type { Match, Score, TournamentSettings } from "./types";

export type ScoreValidation = { ok: true } | { ok: false; reason: string };

/**
 * A finished game: whole numbers, the winner on exactly `goalsToWin`, the
 * loser below it. Foosball has no draws.
 */
export function validateScore(score: Score, settings: TournamentSettings): ScoreValidation {
  const [home, away] = score;
  if (!Number.isInteger(home) || !Number.isInteger(away) || home < 0 || away < 0) {
    return { ok: false, reason: "Scores are whole numbers, zero or more." };
  }
  const { goalsToWin } = settings;
  const high = Math.max(home, away);
  const low = Math.min(home, away);
  if (home === away) {
    return { ok: false, reason: "A game has a winner; the scores cannot be equal." };
  }
  if (high !== goalsToWin) {
    return { ok: false, reason: `The winner has exactly ${goalsToWin} goals.` };
  }
  if (low >= goalsToWin) {
    return { ok: false, reason: `The loser has fewer than ${goalsToWin} goals.` };
  }
  return { ok: true };
}

export function isPlayed(match: Match): match is Match & { homeScore: number; awayScore: number } {
  return match.homeScore !== null && match.awayScore !== null;
}

/** The winning team's id, or `null` for an unplayed match. */
export function winnerOf(match: Match): string | null {
  if (!isPlayed(match)) {
    return null;
  }
  return match.homeScore > match.awayScore ? match.homeTeamId : match.awayTeamId;
}
