import type { Legs, Match, Team, Tournament } from "./types";

/** The stable id of the match between two teams in one leg. */
export function matchId(homeTeamId: string, awayTeamId: string, leg: Legs): string {
  return `${homeTeamId}--${awayTeamId}--${leg}`;
}

/**
 * Every pairing a round robin needs. With one leg the earlier team (in list
 * order) is home; with two legs each pairing is played once each way.
 */
export function generateSchedule(
  teamIds: readonly string[],
  legs: Legs,
): Array<Pick<Match, "id" | "homeTeamId" | "awayTeamId" | "leg">> {
  const pairings: Array<Pick<Match, "id" | "homeTeamId" | "awayTeamId" | "leg">> = [];
  for (let i = 0; i < teamIds.length; i += 1) {
    for (let j = i + 1; j < teamIds.length; j += 1) {
      const first = teamIds[i]!;
      const second = teamIds[j]!;
      pairings.push({ id: matchId(first, second, 1), homeTeamId: first, awayTeamId: second, leg: 1 });
      if (legs === 2) {
        pairings.push({ id: matchId(second, first, 2), homeTeamId: second, awayTeamId: first, leg: 2 });
      }
    }
  }
  return pairings;
}

/**
 * Brings the match list in line with the teams and the legs setting: adds
 * the pairings that are missing, drops matches whose team is gone or whose
 * leg is no longer played, and keeps every other match as it is - results
 * included. Idempotent, so it can run after any change to teams or settings.
 */
export function reconcileSchedule(tournament: Tournament): Tournament {
  const teamIds = tournament.teams.map((team: Team) => team.id);
  const wanted = generateSchedule(teamIds, tournament.settings.legs);
  const existing = new Map(tournament.matches.map((match) => [match.id, match]));

  const matches: Match[] = wanted.map((pairing) => {
    const match = existing.get(pairing.id);
    return match ?? { ...pairing, homeScore: null, awayScore: null, playedAt: null };
  });

  const unchanged =
    matches.length === tournament.matches.length &&
    matches.every((match, index) => match === tournament.matches[index]);

  return unchanged ? tournament : { ...tournament, matches };
}

/** The matches a schedule change would discard, results and all. */
export function matchesDiscardedBy(tournament: Tournament, next: { teamIds?: string[]; legs?: Legs }): Match[] {
  const teamIds = new Set(next.teamIds ?? tournament.teams.map((team) => team.id));
  const legs = next.legs ?? tournament.settings.legs;
  return tournament.matches.filter(
    (match) =>
      match.homeScore !== null &&
      (!teamIds.has(match.homeTeamId) || !teamIds.has(match.awayTeamId) || match.leg > legs),
  );
}
