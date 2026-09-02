import { LocalStore } from "./local-store";
import { seedTournament } from "./seed";
import type { TournamentStore } from "./types";

export type { TournamentStore } from "./types";
export { StoreLockedError } from "./types";
export { seedTournament } from "./seed";

export type StoreKind = "local" | "convex";

/** Which adapter the app runs on; `local` until a hosted one is configured. */
export function configuredStoreKind(): StoreKind {
  return process.env.NEXT_PUBLIC_STORE === "convex" ? "convex" : "local";
}

/**
 * The store for this browser. Called once, on the client, by the provider.
 */
export function createStore(): TournamentStore {
  const kind = configuredStoreKind();
  if (kind === "convex") {
    throw new Error("The Convex store is not wired up yet; set NEXT_PUBLIC_STORE=local.");
  }
  return new LocalStore({
    storage: window.localStorage,
    channel: typeof BroadcastChannel === "undefined" ? undefined : new BroadcastChannel("bordfodbold"),
    seed: seedTournament,
    pin: process.env.NEXT_PUBLIC_ADMIN_PIN ?? "1234",
  });
}
