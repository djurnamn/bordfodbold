/**
 * The eight team colours. They map one-to-one onto the design system's
 * accent ordinals, so a team's colour is a token, never a hex value.
 */
export const teamColors = [
  "violet",
  "green",
  "magenta",
  "yellow",
  "blue",
  "orange",
  "aqua",
  "coral",
] as const;

export type TeamColor = (typeof teamColors)[number];

export interface Team {
  id: string;
  name: string;
  members: string[];
  color: TeamColor;
  /** A single emoji; the team's mark next to its colour. */
  emblem: string;
}

/** How many times each pairing is played. */
export type Legs = 1 | 2;

export interface TournamentSettings {
  /** The goal count that ends a game; the winner has exactly this many. */
  goalsToWin: number;
  pointsPerWin: number;
  legs: Legs;
}

/** A result, as scored by the home team and the away team. */
export type Score = readonly [home: number, away: number];

export interface Match {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  leg: Legs;
  /** `null` until the match has been played. */
  homeScore: number | null;
  awayScore: number | null;
  playedAt: string | null;
}

/** One entry of the audit trail: what a match's result was, and what it became. */
export interface ScoreChange {
  id: string;
  matchId: string;
  previous: Score | null;
  next: Score | null;
  changedAt: string;
  /** Set on an undo: the id of the change it reverted. */
  undoes?: string;
}

export interface Tournament {
  id: string;
  slug: string;
  name: string;
  settings: TournamentSettings;
  teams: Team[];
  matches: Match[];
  /** Newest first. */
  activity: ScoreChange[];
  updatedAt: string;
}

export interface StandingRow {
  rank: number;
  teamId: string;
  played: number;
  won: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

/** A tournament-plan grid cell, read from the row team's point of view. */
export type GridCell =
  | { kind: "self" }
  | { kind: "missing" }
  | { kind: "unplayed"; match: Match }
  | {
      kind: "played";
      match: Match;
      rowScore: number;
      columnScore: number;
      rowWon: boolean;
    };

export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainError";
  }
}
