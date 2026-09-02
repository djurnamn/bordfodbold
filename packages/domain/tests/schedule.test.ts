import { describe, expect, it } from "vitest";
import { generateSchedule, matchesDiscardedBy, reconcileSchedule } from "../src/schedule";
import { team, tournament, withResult } from "./fixtures";

describe("generateSchedule", () => {
  it("pairs every team once with one leg", () => {
    const pairings = generateSchedule(["a", "b", "c"], 1);
    expect(pairings.map((pairing) => `${pairing.homeTeamId}-${pairing.awayTeamId}`)).toEqual(["a-b", "a-c", "b-c"]);
  });

  it("gives 8 teams 28 matches with one leg and 56 with two", () => {
    const eight = ["a", "b", "c", "d", "e", "f", "g", "h"];
    expect(generateSchedule(eight, 1)).toHaveLength(28);
    expect(generateSchedule(eight, 2)).toHaveLength(56);
  });

  it("swaps home and away in the second leg", () => {
    const pairings = generateSchedule(["a", "b"], 2);
    expect(pairings).toEqual([
      { id: "a--b--1", homeTeamId: "a", awayTeamId: "b", leg: 1 },
      { id: "b--a--2", homeTeamId: "b", awayTeamId: "a", leg: 2 },
    ]);
  });
});

describe("reconcileSchedule", () => {
  it("is idempotent", () => {
    const t = tournament(["a", "b", "c"]);
    expect(reconcileSchedule(t)).toBe(t);
  });

  it("adds only the missing matches when a team joins, keeping results", () => {
    const t = withResult(tournament(["a", "b"]), "a", "b", [10, 4]);
    const joined = reconcileSchedule({ ...t, teams: [...t.teams, team("c")] });
    expect(joined.matches).toHaveLength(3);
    expect(joined.matches[0]).toBe(t.matches[0]);
    expect(joined.matches[0]?.homeScore).toBe(10);
  });

  it("drops a leaving team's matches and second-leg matches when legs drop to one", () => {
    const two = tournament(["a", "b", "c"], 2);
    expect(two.matches).toHaveLength(6);
    const one = reconcileSchedule({ ...two, settings: { ...two.settings, legs: 1 } });
    expect(one.matches).toHaveLength(3);
    const without = reconcileSchedule({ ...one, teams: one.teams.filter((team) => team.id !== "c") });
    expect(without.matches.map((match) => match.id)).toEqual(["a--b--1"]);
  });
});

describe("matchesDiscardedBy", () => {
  it("lists the played matches a change would lose", () => {
    const t = withResult(withResult(tournament(["a", "b", "c"]), "a", "b", [10, 4]), "a", "c", [10, 7]);
    expect(matchesDiscardedBy(t, { teamIds: ["a", "b"] }).map((match) => match.id)).toEqual(["a--c--1"]);
    expect(matchesDiscardedBy(t, {})).toEqual([]);
  });
});
