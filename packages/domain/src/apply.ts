import { DomainError, type Score, type ScoreChange, type Tournament } from "./types";
import { validateScore } from "./validate";

export interface ChangeStamp {
  /** The id for the audit entry this change creates. */
  changeId: string;
  /** An ISO timestamp. */
  at: string;
}

/**
 * Records a result (or clears one with `null`) and logs the change. Pure:
 * the caller supplies ids and the clock, so the same call gives the same
 * tournament wherever it runs.
 */
export function applyScoreChange(
  tournament: Tournament,
  matchId: string,
  next: Score | null,
  stamp: ChangeStamp,
): Tournament {
  const match = tournament.matches.find((candidate) => candidate.id === matchId);
  if (match === undefined) {
    throw new DomainError(`No match '${matchId}' in this tournament.`);
  }
  if (next !== null) {
    const validation = validateScore(next, tournament.settings);
    if (!validation.ok) {
      throw new DomainError(validation.reason);
    }
  }

  const previous: Score | null =
    match.homeScore === null || match.awayScore === null ? null : [match.homeScore, match.awayScore];
  if (sameScore(previous, next)) {
    return tournament;
  }

  const change: ScoreChange = { id: stamp.changeId, matchId, previous, next, changedAt: stamp.at };
  return {
    ...tournament,
    matches: tournament.matches.map((candidate) =>
      candidate.id !== matchId
        ? candidate
        : {
            ...candidate,
            homeScore: next === null ? null : next[0],
            awayScore: next === null ? null : next[1],
            playedAt: next === null ? null : stamp.at,
          },
    ),
    activity: [change, ...tournament.activity],
    updatedAt: stamp.at,
  };
}

/**
 * Reverts the most recent change, as a change of its own - the trail never
 * loses an entry.
 */
export function undoLastChange(tournament: Tournament, stamp: ChangeStamp): Tournament {
  const last = tournament.activity[0];
  if (last === undefined) {
    return tournament;
  }
  if (!tournament.matches.some((match) => match.id === last.matchId)) {
    throw new DomainError("The last change is for a match that no longer exists.");
  }
  return applyScoreChange(tournament, last.matchId, last.previous, stamp);
}

function sameScore(a: Score | null, b: Score | null): boolean {
  if (a === null || b === null) {
    return a === b;
  }
  return a[0] === b[0] && a[1] === b[1];
}
