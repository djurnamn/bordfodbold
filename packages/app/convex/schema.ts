import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/** One document per tournament: small data, changed atomically, read whole. */
export const scoreValidator = v.union(v.array(v.number()), v.null());

export const teamValidator = v.object({
  id: v.string(),
  name: v.string(),
  members: v.array(v.string()),
  color: v.union(
    v.literal("violet"),
    v.literal("green"),
    v.literal("magenta"),
    v.literal("yellow"),
    v.literal("blue"),
    v.literal("orange"),
    v.literal("aqua"),
    v.literal("coral"),
  ),
  emblem: v.string(),
});

export const settingsValidator = v.object({
  goalsToWin: v.number(),
  pointsPerWin: v.number(),
  legs: v.union(v.literal(1), v.literal(2)),
});

export const matchValidator = v.object({
  id: v.string(),
  homeTeamId: v.string(),
  awayTeamId: v.string(),
  leg: v.union(v.literal(1), v.literal(2)),
  homeScore: v.union(v.number(), v.null()),
  awayScore: v.union(v.number(), v.null()),
  playedAt: v.union(v.string(), v.null()),
});

export const scoreChangeValidator = v.object({
  id: v.string(),
  matchId: v.string(),
  previous: scoreValidator,
  next: scoreValidator,
  changedAt: v.string(),
  undoes: v.optional(v.string()),
});

export const tournamentFields = {
  id: v.string(),
  slug: v.string(),
  name: v.string(),
  settings: settingsValidator,
  teams: v.array(teamValidator),
  matches: v.array(matchValidator),
  activity: v.array(scoreChangeValidator),
  updatedAt: v.string(),
};

export default defineSchema({
  tournaments: defineTable(tournamentFields).index("by_slug", ["slug"]),
});
