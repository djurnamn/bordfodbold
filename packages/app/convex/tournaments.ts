import {
  applyScoreChange,
  removeTeam as removeTeamFrom,
  renameTournament as renameTournamentTo,
  undoLastChange as undoLastChangeOf,
  updateSettings as updateSettingsOf,
  upsertTeam as upsertTeamIn,
  type Score,
  type Tournament,
} from "@bordfodbold/domain";
import { ConvexError, v } from "convex/values";

import { emptyTournament, seedTournament } from "../src/store/seed";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { settingsValidator, teamValidator } from "./schema";

/**
 * The tournament's home when the app runs on Convex. Reads are open; every
 * write proves the admin PIN (the deployment's `ADMIN_PIN`), applies the same
 * domain function the local store does, and writes the whole document back.
 */

const pin = v.string();

/** Every settings field, each optional: what a partial update carries. */
const partialSettingsValidator = v.object(
  Object.fromEntries(Object.entries(settingsValidator.fields).map(([key, validator]) => [key, v.optional(validator)])) as {
    [Key in keyof typeof settingsValidator.fields]: ReturnType<typeof v.optional<(typeof settingsValidator.fields)[Key]>>;
  },
);

export const get = query({
  args: { slug: v.string() },
  handler: async (context, { slug }) => {
    const document = await findBySlug(context, slug);
    return document === null ? null : toTournament(document);
  },
});

export const checkPin = query({
  args: { pin },
  handler: async (_context, args) => args.pin === adminPin(),
});

/**
 * Seeds the demo tournament where none exists. Open to any client, so it
 * only ever creates the deployment's own tournament (`TOURNAMENT_SLUG`,
 * default `autumn-open`); other slugs are refused rather than filling the
 * table.
 */
export const seedIfMissing = mutation({
  args: { slug: v.string() },
  handler: async (context, { slug }) => {
    if (slug !== configuredSlug()) {
      throw new ConvexError(`This deployment serves '${configuredSlug()}', not '${slug}'.`);
    }
    if ((await findBySlug(context, slug)) !== null) {
      return;
    }
    await context.db.insert("tournaments", toDocument(withSlug(seedTournament(), slug)));
  },
});

export const setScore = mutation({
  args: { slug: v.string(), pin, matchId: v.string(), score: v.union(v.array(v.number()), v.null()) },
  handler: (context, args) =>
    change(context, args, (tournament) =>
      applyScoreChange(tournament, args.matchId, args.score === null ? null : toScore(args.score), stamp()),
    ),
});

export const undoLastChange = mutation({
  args: { slug: v.string(), pin },
  handler: (context, args) => change(context, args, (tournament) => undoLastChangeOf(tournament, stamp())),
});

export const upsertTeam = mutation({
  args: { slug: v.string(), pin, team: teamValidator },
  handler: (context, args) => change(context, args, (tournament) => upsertTeamIn(tournament, args.team, now())),
});

export const removeTeam = mutation({
  args: { slug: v.string(), pin, teamId: v.string() },
  handler: (context, args) => change(context, args, (tournament) => removeTeamFrom(tournament, args.teamId, now())),
});

export const updateSettings = mutation({
  args: { slug: v.string(), pin, settings: partialSettingsValidator },
  handler: (context, args) => change(context, args, (tournament) => updateSettingsOf(tournament, args.settings, now())),
});

export const renameTournament = mutation({
  args: { slug: v.string(), pin, name: v.string() },
  handler: (context, args) => change(context, args, (tournament) => renameTournamentTo(tournament, args.name, now())),
});

/** Clears the tournament: no teams, no results, the log emptied. */
export const reset = mutation({
  args: { slug: v.string(), pin },
  handler: (context, args) => change(context, args, () => emptyTournament(args.slug, now())),
});

export const loadDemoData = mutation({
  args: { slug: v.string(), pin },
  handler: (context, args) => change(context, args, () => withSlug(seedTournament(), args.slug)),
});

async function change(
  context: MutationCtx,
  args: { slug: string; pin: string },
  apply: (tournament: Tournament) => Tournament,
): Promise<void> {
  if (args.pin !== adminPin()) {
    throw new ConvexError("Unlock the admin with the PIN first.");
  }
  const document = await findBySlug(context, args.slug);
  if (document === null) {
    throw new ConvexError(`No tournament '${args.slug}'.`);
  }
  const current = toTournament(document);
  let next: Tournament;
  try {
    next = apply(current);
  } catch (failure) {
    throw new ConvexError(failure instanceof Error ? failure.message : String(failure));
  }
  if (next !== current) {
    await context.db.replace(document._id, toDocument(next));
  }
}

function adminPin(): string {
  const configured = process.env.ADMIN_PIN;
  if (configured === undefined || configured === "") {
    throw new ConvexError("The deployment has no ADMIN_PIN; set it with `npx convex env set ADMIN_PIN <pin>`.");
  }
  return configured;
}

async function findBySlug(context: QueryCtx | MutationCtx, slug: string) {
  return context.db
    .query("tournaments")
    .withIndex("by_slug", (query) => query.eq("slug", slug))
    .unique();
}

function configuredSlug(): string {
  return process.env.TOURNAMENT_SLUG ?? "autumn-open";
}

type TournamentDocument = NonNullable<Awaited<ReturnType<typeof findBySlug>>>;

/** The stored fields as the domain's type: the system fields stripped, the score arrays as tuples. */
function toTournament(document: TournamentDocument): Tournament {
  const { _id: _identifier, _creationTime: _created, ...fields } = document;
  return {
    ...fields,
    activity: fields.activity.map((change) => ({
      ...change,
      previous: change.previous === null ? null : toScore(change.previous),
      next: change.next === null ? null : toScore(change.next),
    })),
  };
}

/**
 * The document the schema accepts: the domain's readonly score tuples become
 * plain arrays, which is the one place the two shapes differ.
 */
function toDocument(tournament: Tournament) {
  return {
    ...tournament,
    activity: tournament.activity.map((change) => ({
      ...change,
      previous: change.previous === null ? null : [...change.previous],
      next: change.next === null ? null : [...change.next],
    })),
  };
}

function withSlug(tournament: Tournament, slug: string): Tournament {
  return { ...tournament, slug };
}

function toScore(value: number[]): Score {
  if (value.length !== 2) {
    throw new ConvexError("A score is two numbers.");
  }
  return [value[0]!, value[1]!];
}

function now(): string {
  return new Date().toISOString();
}

function stamp() {
  return { changeId: crypto.randomUUID(), at: now() };
}

