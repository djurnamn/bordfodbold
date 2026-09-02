import { ConvexStore } from "./convex-store";
import { LocalStore } from "./local-store";
import { emptyTournament, seedTournament } from "./seed";
import type { TournamentStore } from "./types";

export type { TournamentStore } from "./types";
export { StoreLockedError } from "./types";
export { seedTournament } from "./seed";

export type StoreKind = "local" | "convex";

/**
 * Which adapter the app runs on: Convex when a deployment URL is configured
 * and `NEXT_PUBLIC_STORE` does not say otherwise, else the local store.
 */
export function configuredStoreKind(): StoreKind {
  const explicit = process.env.NEXT_PUBLIC_STORE;
  if (explicit === "local" || explicit === "convex") {
    return explicit;
  }
  return process.env.NEXT_PUBLIC_CONVEX_URL ? "convex" : "local";
}

/** The tournament every screen shows; one per deployment for now. */
export const tournamentSlug = process.env.NEXT_PUBLIC_TOURNAMENT_SLUG ?? "autumn-open";

/**
 * The store for this browser. Called once, on the client, by the provider.
 */
export function createStore(): TournamentStore {
  const kind = configuredStoreKind();
  if (kind === "convex") {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!url) {
      throw new Error("NEXT_PUBLIC_STORE is convex but NEXT_PUBLIC_CONVEX_URL is not set.");
    }
    return new ConvexStore({ url, slug: tournamentSlug });
  }
  return new LocalStore({
    storage: window.localStorage,
    channel: typeof BroadcastChannel === "undefined" ? undefined : new BroadcastChannel("bordfodbold"),
    seed: seedTournament,
    empty: emptyTournament,
    pin: process.env.NEXT_PUBLIC_ADMIN_PIN ?? "1234",
  });
}
