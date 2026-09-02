import {
  applyScoreChange,
  removeTeam,
  renameTournament,
  undoLastChange,
  updateSettings,
  upsertTeam,
  type Score,
  type Team,
  type Tournament,
  type TournamentSettings,
} from "@bordfodbold/domain";

import { StoreLockedError, type TournamentStore } from "./types";

/** The slice of `Storage` the local store uses, so tests can pass a map. */
export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** The slice of `BroadcastChannel` the local store uses. */
export interface Channel {
  postMessage(message: unknown): void;
  addEventListener(type: "message", listener: (event: { data: unknown }) => void): void;
  removeEventListener(type: "message", listener: (event: { data: unknown }) => void): void;
  close(): void;
}

export interface LocalStoreOptions {
  storage: KeyValueStorage;
  /** A channel to other instances of the same page; omit for none. */
  channel?: Channel;
  seed: () => Tournament;
  empty: (slug: string) => Tournament;
  pin: string;
  key?: string;
  now?: () => string;
  newId?: () => string;
}

interface Envelope {
  version: 1;
  tournament: Tournament;
}

/**
 * The tournament in this browser: persisted in local storage, pushed to
 * every other open tab over a broadcast channel. No server, so instant -
 * the offline and development adapter, and the one the tests use.
 */
export class LocalStore implements TournamentStore {
  private readonly listeners = new Set<(tournament: Tournament) => void>();
  private readonly key: string;
  private readonly now: () => string;
  private readonly newId: () => string;
  private unlocked = false;
  private current: Tournament | null = null;

  constructor(private readonly options: LocalStoreOptions) {
    this.key = options.key ?? "bordfodbold:tournament";
    this.now = options.now ?? (() => new Date().toISOString());
    this.newId = options.newId ?? (() => crypto.randomUUID());
    options.channel?.addEventListener("message", this.receive);
  }

  async load(): Promise<Tournament> {
    const stored = this.read();
    if (stored !== null) {
      this.current = stored;
      return stored;
    }
    const seeded = this.options.seed();
    this.write(seeded, { broadcast: false });
    return seeded;
  }

  subscribe(listener: (tournament: Tournament) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  async unlock(pin: string): Promise<boolean> {
    this.unlocked = pin === this.options.pin;
    return this.unlocked;
  }

  lock(): void {
    this.unlocked = false;
  }

  async setScore(matchId: string, score: Score | null): Promise<void> {
    await this.commit((tournament) =>
      applyScoreChange(tournament, matchId, score, { changeId: this.newId(), at: this.now() }),
    );
  }

  async undoLastChange(): Promise<void> {
    await this.commit((tournament) => undoLastChange(tournament, { changeId: this.newId(), at: this.now() }));
  }

  async upsertTeam(team: Team): Promise<void> {
    await this.commit((tournament) => upsertTeam(tournament, team, this.now()));
  }

  async removeTeam(teamId: string): Promise<void> {
    await this.commit((tournament) => removeTeam(tournament, teamId, this.now()));
  }

  async updateSettings(settings: Partial<TournamentSettings>): Promise<void> {
    await this.commit((tournament) => updateSettings(tournament, settings, this.now()));
  }

  async renameTournament(name: string): Promise<void> {
    await this.commit((tournament) => renameTournament(tournament, name, this.now()));
  }

  async reset(): Promise<void> {
    await this.commit((tournament) => this.options.empty(tournament.slug));
  }

  async loadDemoData(): Promise<void> {
    await this.commit(() => this.options.seed());
  }

  close(): void {
    this.options.channel?.removeEventListener("message", this.receive);
    this.options.channel?.close();
  }

  private async commit(change: (tournament: Tournament) => Tournament): Promise<void> {
    if (!this.unlocked) {
      throw new StoreLockedError();
    }
    const current = this.current ?? (await this.load());
    const next = change(current);
    if (next !== current) {
      this.write(next, { broadcast: true });
    }
  }

  private read(): Tournament | null {
    const raw = this.options.storage.getItem(this.key);
    if (raw === null) {
      return null;
    }
    try {
      const envelope = JSON.parse(raw) as Envelope;
      return envelope.version === 1 ? envelope.tournament : null;
    } catch {
      return null;
    }
  }

  private write(tournament: Tournament, { broadcast }: { broadcast: boolean }): void {
    this.current = tournament;
    const envelope: Envelope = { version: 1, tournament };
    this.options.storage.setItem(this.key, JSON.stringify(envelope));
    if (broadcast) {
      this.options.channel?.postMessage(envelope);
    }
    this.notify(tournament);
  }

  private readonly receive = (event: { data: unknown }): void => {
    const envelope = event.data as Partial<Envelope> | null;
    if (envelope === null || envelope.version !== 1 || envelope.tournament === undefined) {
      return;
    }
    this.current = envelope.tournament;
    this.notify(envelope.tournament);
  };

  private notify(tournament: Tournament): void {
    for (const listener of this.listeners) {
      listener(tournament);
    }
  }
}
