import type { Match, StandingRow, Tournament } from "./types";
import { isPlayed } from "./validate";

/**
 * The leaderboard: one row per team, ordered by points, then goal
 * difference, then goals scored, then the head-to-head record between the
 * two teams still tied, then name. Ranks are positions in that order.
 */
export function computeStandings(tournament: Tournament): StandingRow[] {
  const rows = new Map<string, Omit<StandingRow, "rank">>();
  for (const team of tournament.teams) {
    rows.set(team.id, {
      teamId: team.id,
      played: 0,
      won: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    });
  }

  const played = tournament.matches.filter(isPlayed);
  for (const match of played) {
    const home = rows.get(match.homeTeamId);
    const away = rows.get(match.awayTeamId);
    if (home === undefined || away === undefined) {
      continue;
    }
    const homeWon = match.homeScore > match.awayScore;
    tally(home, match.homeScore, match.awayScore, homeWon, tournament.settings.pointsPerWin);
    tally(away, match.awayScore, match.homeScore, !homeWon, tournament.settings.pointsPerWin);
  }

  const nameOf = new Map(tournament.teams.map((team) => [team.id, team.name]));
  const ordered = [...rows.values()].sort(
    (a, b) =>
      b.points - a.points ||
      b.goalDifference - a.goalDifference ||
      b.goalsFor - a.goalsFor ||
      headToHead(played, b.teamId, a.teamId) - headToHead(played, a.teamId, b.teamId) ||
      (nameOf.get(a.teamId) ?? "").localeCompare(nameOf.get(b.teamId) ?? ""),
  );

  return ordered.map((row, index) => ({ rank: index + 1, ...row }));
}

function tally(
  row: Omit<StandingRow, "rank">,
  goalsFor: number,
  goalsAgainst: number,
  won: boolean,
  pointsPerWin: number,
): void {
  row.played += 1;
  row.won += won ? 1 : 0;
  row.lost += won ? 0 : 1;
  row.goalsFor += goalsFor;
  row.goalsAgainst += goalsAgainst;
  row.goalDifference = row.goalsFor - row.goalsAgainst;
  row.points += won ? pointsPerWin : 0;
}

/** Wins by `teamId` over `otherTeamId` in the played matches between them. */
function headToHead(played: Array<Match & { homeScore: number; awayScore: number }>, teamId: string, otherTeamId: string): number {
  let wins = 0;
  for (const match of played) {
    if (match.homeTeamId === teamId && match.awayTeamId === otherTeamId && match.homeScore > match.awayScore) {
      wins += 1;
    }
    if (match.awayTeamId === teamId && match.homeTeamId === otherTeamId && match.awayScore > match.homeScore) {
      wins += 1;
    }
  }
  return wins;
}
