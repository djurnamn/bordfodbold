import { describe, expect, it } from "vitest";
import { applyScoreChange, undoLastChange, undoableChange } from "../src/apply";
import { DomainError } from "../src/types";
import { tournament } from "./fixtures";

const stamp = (n: number) => ({ changeId: `change-${n}`, at: `2026-09-02T10:0${n}:00.000Z` });

describe("applyScoreChange", () => {
  it("records a result, logs it, and bumps updatedAt", () => {
    const t = applyScoreChange(tournament(["a", "b"]), "a--b--1", [10, 4], stamp(1));
    expect(t.matches[0]).toMatchObject({ homeScore: 10, awayScore: 4, playedAt: stamp(1).at });
    expect(t.activity).toEqual([{ id: "change-1", matchId: "a--b--1", previous: null, next: [10, 4], changedAt: stamp(1).at }]);
    expect(t.updatedAt).toBe(stamp(1).at);
  });

  it("keeps the previous result in the trail when overwriting, newest first", () => {
    let t = applyScoreChange(tournament(["a", "b"]), "a--b--1", [10, 4], stamp(1));
    t = applyScoreChange(t, "a--b--1", [10, 7], stamp(2));
    expect(t.activity.map((change) => change.id)).toEqual(["change-2", "change-1"]);
    expect(t.activity[0]).toMatchObject({ previous: [10, 4], next: [10, 7] });
  });

  it("clears a result with null", () => {
    let t = applyScoreChange(tournament(["a", "b"]), "a--b--1", [10, 4], stamp(1));
    t = applyScoreChange(t, "a--b--1", null, stamp(2));
    expect(t.matches[0]).toMatchObject({ homeScore: null, awayScore: null, playedAt: null });
  });

  it("returns the same tournament for a no-op", () => {
    const t = applyScoreChange(tournament(["a", "b"]), "a--b--1", [10, 4], stamp(1));
    expect(applyScoreChange(t, "a--b--1", [10, 4], stamp(2))).toBe(t);
  });

  it("rejects an invalid score and an unknown match without changing anything", () => {
    const t = tournament(["a", "b"]);
    expect(() => applyScoreChange(t, "a--b--1", [9, 4], stamp(1))).toThrow(DomainError);
    expect(() => applyScoreChange(t, "nope", [10, 4], stamp(1))).toThrow(DomainError);
  });

  it("does not mutate its input", () => {
    const t = tournament(["a", "b"]);
    const before = JSON.stringify(t);
    applyScoreChange(t, "a--b--1", [10, 4], stamp(1));
    expect(JSON.stringify(t)).toBe(before);
  });
});

describe("undoLastChange", () => {
  it("reverts the latest change as a new trail entry", () => {
    let t = applyScoreChange(tournament(["a", "b"]), "a--b--1", [10, 4], stamp(1));
    t = applyScoreChange(t, "a--b--1", [10, 7], stamp(2));
    t = undoLastChange(t, stamp(3));
    expect(t.matches[0]).toMatchObject({ homeScore: 10, awayScore: 4 });
    expect(t.activity).toHaveLength(3);
    expect(t.activity[0]).toMatchObject({ previous: [10, 7], next: [10, 4] });
  });

  it("is a no-op with an empty trail", () => {
    const t = tournament(["a", "b"]);
    expect(undoLastChange(t, stamp(1))).toBe(t);
  });

  it("never re-applies an undo: repeated undos walk back, then stop", () => {
    let t = applyScoreChange(tournament(["a", "b", "c"]), "a--b--1", [10, 4], stamp(1));
    t = applyScoreChange(t, "a--c--1", [10, 6], stamp(2));
    t = undoLastChange(t, stamp(3));
    expect(t.matches.find((match) => match.id === "a--c--1")?.homeScore).toBeNull();
    expect(t.activity[0]).toMatchObject({ undoes: "change-2" });

    t = undoLastChange(t, stamp(4));
    expect(t.matches.find((match) => match.id === "a--b--1")?.homeScore).toBeNull();
    expect(t.activity[0]).toMatchObject({ undoes: "change-1" });

    // Nothing left to undo: the trail stays as it is.
    expect(undoableChange(t)).toBeUndefined();
    expect(undoLastChange(t, stamp(5))).toBe(t);
    expect(t.activity).toHaveLength(4);
  });
});
