import type { GridCell, Match, Team, Tournament } from "./types";
import { isPlayed } from "./validate";

export function teamById(tournament: Tournament, teamId: string): Team | undefined {
  return tournament.teams.find((team) => team.id === teamId);
}

/**
 * The grid cell where `rowTeamId`'s row meets `columnTeamId`'s column. With
 * one leg the two mirrored cells show the same match, each from its row's
 * side; with two legs a cell shows the match its row team hosted.
 */
export function selectCell(tournament: Tournament, rowTeamId: string, columnTeamId: string): GridCell {
  if (rowTeamId === columnTeamId) {
    return { kind: "self" };
  }
  const hosted = tournament.matches.find(
    (match) => match.homeTeamId === rowTeamId && match.awayTeamId === columnTeamId,
  );
  const mirrored =
    tournament.settings.legs === 1
      ? tournament.matches.find((match) => match.homeTeamId === columnTeamId && match.awayTeamId === rowTeamId)
      : undefined;
  const match = hosted ?? mirrored;
  if (match === undefined) {
    return { kind: "missing" };
  }
  if (!isPlayed(match)) {
    return { kind: "unplayed", match };
  }
  const rowIsHome = match.homeTeamId === rowTeamId;
  const rowScore = rowIsHome ? match.homeScore : match.awayScore;
  const columnScore = rowIsHome ? match.awayScore : match.homeScore;
  return { kind: "played", match, rowScore, columnScore, rowWon: rowScore > columnScore };
}

export function unplayedMatches(tournament: Tournament): Match[] {
  return tournament.matches.filter((match) => !isPlayed(match));
}

export function playedMatches(tournament: Tournament): Match[] {
  return tournament.matches.filter(isPlayed);
}
