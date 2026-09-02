import { describe, expect, it } from "vitest";

import { LocalStore, type Channel, type KeyValueStorage } from "../src/store/local-store";
import { seedTournament } from "../src/store/seed";
import { StoreLockedError } from "../src/store/types";

class MemoryStorage implements KeyValueStorage {
  private readonly map = new Map<string, string>();
  getItem(key: string) {
    return this.map.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.map.set(key, value);
  }
  removeItem(key: string) {
    this.map.delete(key);
  }
}

/** Two ends of one channel: what one posts, the other receives. */
function channelPair(): [Channel, Channel] {
  const listeners: [Set<(event: { data: unknown }) => void>, Set<(event: { data: unknown }) => void>] = [new Set(), new Set()];
  const end = (mine: 0 | 1): Channel => ({
    postMessage: (data) => listeners[mine === 0 ? 1 : 0].forEach((listener) => listener({ data })),
    addEventListener: (_type, listener) => listeners[mine].add(listener),
    removeEventListener: (_type, listener) => listeners[mine].delete(listener),
    close: () => listeners[mine].clear(),
  });
  return [end(0), end(1)];
}

let counter = 0;
const options = (storage: KeyValueStorage, channel?: Channel) => ({
  storage,
  channel,
  seed: seedTournament,
  pin: "1234",
  now: () => "2026-09-02T12:00:00.000Z",
  newId: () => `id-${(counter += 1)}`,
});

describe("LocalStore", () => {
  it("seeds on first load and persists", async () => {
    const storage = new MemoryStorage();
    const store = new LocalStore(options(storage));
    const first = await store.load();
    expect(first.teams).toHaveLength(6);
    expect(storage.getItem("bordfodbold:tournament")).not.toBeNull();

    const again = await new LocalStore(options(storage)).load();
    expect(again).toEqual(first);
  });

  it("refuses commands until unlocked with the PIN", async () => {
    const store = new LocalStore(options(new MemoryStorage()));
    const tournament = await store.load();
    const unplayed = tournament.matches.find((match) => match.homeScore === null)!;
    await expect(store.setScore(unplayed.id, [10, 2])).rejects.toBeInstanceOf(StoreLockedError);
    expect(await store.unlock("0000")).toBe(false);
    expect(await store.unlock("1234")).toBe(true);
    await store.setScore(unplayed.id, [10, 2]);
  });

  it("notifies subscribers and other tabs of a change", async () => {
    const storage = new MemoryStorage();
    const [here, there] = channelPair();
    const store = new LocalStore(options(storage, here));
    const otherTab = new LocalStore(options(storage, there));
    const tournament = await store.load();
    await otherTab.load();
    await store.unlock("1234");

    const seenHere: string[] = [];
    const seenThere: string[] = [];
    store.subscribe((next) => seenHere.push(next.updatedAt));
    otherTab.subscribe((next) => seenThere.push(next.updatedAt));

    const unplayed = tournament.matches.find((match) => match.homeScore === null)!;
    await store.setScore(unplayed.id, [3, 10]);

    expect(seenHere).toEqual(["2026-09-02T12:00:00.000Z"]);
    expect(seenThere).toEqual(["2026-09-02T12:00:00.000Z"]);
    const reloaded = await new LocalStore(options(storage)).load();
    expect(reloaded.matches.find((match) => match.id === unplayed.id)).toMatchObject({ homeScore: 3, awayScore: 10 });
    expect(reloaded.activity[0]).toMatchObject({ matchId: unplayed.id, next: [3, 10] });
  });

  it("surfaces domain errors and leaves the data alone", async () => {
    const storage = new MemoryStorage();
    const store = new LocalStore(options(storage));
    const tournament = await store.load();
    await store.unlock("1234");
    const unplayed = tournament.matches.find((match) => match.homeScore === null)!;
    await expect(store.setScore(unplayed.id, [9, 9])).rejects.toThrow("cannot be equal");
    expect((await new LocalStore(options(storage)).load()).matches.find((match) => match.id === unplayed.id)?.homeScore).toBeNull();
  });

  it("resets to the seed", async () => {
    const store = new LocalStore(options(new MemoryStorage()));
    const tournament = await store.load();
    await store.unlock("1234");
    await store.removeTeam(tournament.teams[0]!.id);
    await store.reset();
    let latest = tournament;
    store.subscribe((next) => (latest = next));
    await store.renameTournament("Renamed");
    expect(latest.teams).toHaveLength(6);
    expect(latest.name).toBe("Renamed");
  });
});
