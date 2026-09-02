import type { Score, Team, Tournament, TournamentSettings } from "@bordfodbold/domain";

/**
 * Everything a view needs from wherever the tournament lives. Reads are a
 * snapshot plus a subscription; writes are commands, validated by the
 * domain package on the way in and, for a hosted store, again on the
 * server. Swap the adapter, keep the views.
 */
export interface TournamentStore {
  /** The current tournament; seeds one where none exists. */
  load(): Promise<Tournament>;
  /** Every later version, from this instance's writes and from elsewhere. */
  subscribe(listener: (tournament: Tournament) => void): () => void;

  /** Proves the admin PIN to the store; commands fail until it has been. */
  unlock(pin: string): Promise<boolean>;
  lock(): void;

  setScore(matchId: string, score: Score | null): Promise<void>;
  undoLastChange(): Promise<void>;
  upsertTeam(team: Team): Promise<void>;
  removeTeam(teamId: string): Promise<void>;
  updateSettings(settings: Partial<TournamentSettings>): Promise<void>;
  renameTournament(name: string): Promise<void>;
  /** Back to the seed data. */
  reset(): Promise<void>;
}

export class StoreLockedError extends Error {
  constructor() {
    super("Unlock the admin with the PIN first.");
    this.name = "StoreLockedError";
  }
}
