import { reconcileSchedule } from "./schedule";
import {
  DomainError,
  teamColors,
  type Team,
  type TeamColor,
  type Tournament,
  type TournamentSettings,
} from "./types";

export const maximumTeams = 8;

export interface NewTournament {
  id: string;
  slug: string;
  name: string;
  settings: TournamentSettings;
  teams: Team[];
  at: string;
}

/** A tournament with its schedule generated for the teams given. */
export function createTournament(input: NewTournament): Tournament {
  if (input.teams.length > maximumTeams) {
    throw new DomainError(`A tournament has at most ${maximumTeams} teams.`);
  }
  return reconcileSchedule({
    id: input.id,
    slug: input.slug,
    name: input.name,
    settings: input.settings,
    teams: input.teams,
    matches: [],
    activity: [],
    updatedAt: input.at,
  });
}

/** Adds a team, or replaces the one with the same id. New pairings are scheduled. */
export function upsertTeam(tournament: Tournament, team: Team, at: string): Tournament {
  const name = team.name.trim();
  if (name === "") {
    throw new DomainError("A team needs a name.");
  }
  const exists = tournament.teams.some((candidate) => candidate.id === team.id);
  if (!exists && tournament.teams.length >= maximumTeams) {
    throw new DomainError(`A tournament has at most ${maximumTeams} teams.`);
  }
  const nameTaken = tournament.teams.some(
    (candidate) => candidate.id !== team.id && candidate.name.trim().toLowerCase() === name.toLowerCase(),
  );
  if (nameTaken) {
    throw new DomainError(`There is already a team called ${name}.`);
  }
  const cleaned: Team = { ...team, name, members: team.members.map((member) => member.trim()).filter(Boolean) };
  const teams = exists
    ? tournament.teams.map((candidate) => (candidate.id === team.id ? cleaned : candidate))
    : [...tournament.teams, cleaned];
  return reconcileSchedule({ ...tournament, teams, updatedAt: at });
}

/** Removes a team and every match it was part of, results included. */
export function removeTeam(tournament: Tournament, teamId: string, at: string): Tournament {
  if (!tournament.teams.some((team) => team.id === teamId)) {
    return tournament;
  }
  return reconcileSchedule({
    ...tournament,
    teams: tournament.teams.filter((team) => team.id !== teamId),
    updatedAt: at,
  });
}

export function updateSettings(
  tournament: Tournament,
  settings: Partial<TournamentSettings>,
  at: string,
): Tournament {
  const next: TournamentSettings = { ...tournament.settings, ...settings };
  if (!Number.isInteger(next.goalsToWin) || next.goalsToWin < 1) {
    throw new DomainError("Goals to win is a whole number, one or more.");
  }
  if (!Number.isInteger(next.pointsPerWin) || next.pointsPerWin < 1) {
    throw new DomainError("Points per win is a whole number, one or more.");
  }
  if (next.legs !== 1 && next.legs !== 2) {
    throw new DomainError("Each pairing is played once or twice.");
  }
  return reconcileSchedule({ ...tournament, settings: next, updatedAt: at });
}

export function renameTournament(tournament: Tournament, name: string, at: string): Tournament {
  const trimmed = name.trim();
  if (trimmed === "") {
    throw new DomainError("The tournament needs a name.");
  }
  return { ...tournament, name: trimmed, updatedAt: at };
}

/** The first colour no team uses yet, or the least used one when all are taken. */
export function nextFreeColor(tournament: Tournament): TeamColor {
  const counts = new Map<TeamColor, number>(teamColors.map((color) => [color, 0]));
  for (const team of tournament.teams) {
    counts.set(team.color, (counts.get(team.color) ?? 0) + 1);
  }
  let best: TeamColor = teamColors[0];
  for (const color of teamColors) {
    if ((counts.get(color) ?? 0) < (counts.get(best) ?? 0)) {
      best = color;
    }
  }
  return best;
}
