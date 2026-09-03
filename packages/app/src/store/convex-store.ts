import type { Score, Team, Tournament, TournamentSettings } from "@bordfodbold/domain";
import { ConvexClient } from "convex/browser";
import { ConvexError } from "convex/values";

import { api } from "../../convex/_generated/api";
import { StoreLockedError, type TournamentStore } from "./types";

export interface ConvexStoreOptions {
  url: string;
  slug: string;
}

/**
 * The tournament on Convex: one document, read through a live query that
 * pushes every change to every subscribed screen, written through mutations
 * that check the PIN and the domain rules on the server. Same interface as
 * the local store, so the views cannot tell which one they run on.
 */
export class ConvexStore implements TournamentStore {
  private readonly client: ConvexClient;
  private readonly slug: string;
  private pin: string | null = null;

  constructor(options: ConvexStoreOptions) {
    this.client = new ConvexClient(options.url);
    this.slug = options.slug;
  }

  async load(): Promise<Tournament> {
    const existing = await this.client.query(api.tournaments.get, { slug: this.slug });
    if (existing !== null) {
      return fromDocument(existing);
    }
    await this.client.mutation(api.tournaments.seedIfMissing, { slug: this.slug });
    const seeded = await this.client.query(api.tournaments.get, { slug: this.slug });
    if (seeded === null) {
      throw new Error("The tournament could not be seeded.");
    }
    return fromDocument(seeded);
  }

  subscribe(listener: (tournament: Tournament) => void): () => void {
    return this.client.onUpdate(
      api.tournaments.get,
      { slug: this.slug },
      (tournament) => {
        if (tournament !== null) {
          listener(fromDocument(tournament));
        }
      },
      (failure) => {
        console.error("The tournament subscription failed", failure);
      },
    );
  }

  async unlock(pin: string): Promise<boolean> {
    const ok = await this.client.query(api.tournaments.checkPin, { pin });
    this.pin = ok ? pin : null;
    return ok;
  }

  lock(): void {
    this.pin = null;
  }

  setScore(matchId: string, score: Score | null): Promise<void> {
    return this.run((pin) => this.client.mutation(api.tournaments.setScore, { slug: this.slug, pin, matchId, score: score === null ? null : [...score] }));
  }

  undoLastChange(): Promise<void> {
    return this.run((pin) => this.client.mutation(api.tournaments.undoLastChange, { slug: this.slug, pin }));
  }

  upsertTeam(team: Team): Promise<void> {
    return this.run((pin) => this.client.mutation(api.tournaments.upsertTeam, { slug: this.slug, pin, team }));
  }

  removeTeam(teamId: string): Promise<void> {
    return this.run((pin) => this.client.mutation(api.tournaments.removeTeam, { slug: this.slug, pin, teamId }));
  }

  updateSettings(settings: Partial<TournamentSettings>): Promise<void> {
    return this.run((pin) => this.client.mutation(api.tournaments.updateSettings, { slug: this.slug, pin, settings }));
  }

  renameTournament(name: string): Promise<void> {
    return this.run((pin) => this.client.mutation(api.tournaments.renameTournament, { slug: this.slug, pin, name }));
  }

  reset(): Promise<void> {
    return this.run((pin) => this.client.mutation(api.tournaments.reset, { slug: this.slug, pin }));
  }

  loadDemoData(): Promise<void> {
    return this.run((pin) => this.client.mutation(api.tournaments.loadDemoData, { slug: this.slug, pin }));
  }

  close(): void {
    void this.client.close();
  }

  private async run(command: (pin: string) => Promise<unknown>): Promise<void> {
    if (this.pin === null) {
      throw new StoreLockedError();
    }
    try {
      await command(this.pin);
    } catch (error) {
      // A domain rule or the PIN check said no: surface its message, not the
      // transport's wrapping of it.
      if (error instanceof ConvexError) {
        throw new Error(typeof error.data === "string" ? error.data : JSON.stringify(error.data));
      }
      throw error;
    }
  }
}

type TournamentDocument = NonNullable<Awaited<ReturnType<ConvexClient["query"]>>> extends infer Result ? Result : never;

/** The document as the domain's type: score arrays become the readonly tuples. */
function fromDocument(document: TournamentDocument): Tournament {
  const record = document as Omit<Tournament, "activity"> & { activity: Array<Omit<Tournament["activity"][number], "previous" | "next"> & { previous: number[] | null; next: number[] | null }> };
  return {
    ...record,
    activity: record.activity.map((change) => ({
      ...change,
      previous: change.previous === null ? null : [change.previous[0] ?? 0, change.previous[1] ?? 0],
      next: change.next === null ? null : [change.next[0] ?? 0, change.next[1] ?? 0],
    })),
  };
}
