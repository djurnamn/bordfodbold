import { describe, expect, it } from "vitest";
import { computeStandings } from "../src/standings";
import { tournament, withResult } from "./fixtures";

describe("computeStandings", () => {
  it("reproduces the brief's leaderboard from three results", () => {
    // C beat A and B; A beat B: C 2-0 (6), A 1-1 (3), B 0-2 (0).
    let t = tournament(["a", "b", "c"]);
    t = withResult(t, "c", "a", [10, 5]);
    t = withResult(t, "b", "c", [6, 10]);
    t = withResult(t, "a", "b", [10, 8]);
    expect(computeStandings(t).map(({ rank, teamId, won, lost, points }) => ({ rank, teamId, won, lost, points }))).toEqual([
      { rank: 1, teamId: "c", won: 2, lost: 0, points: 6 },
      { rank: 2, teamId: "a", won: 1, lost: 1, points: 3 },
      { rank: 3, teamId: "b", won: 0, lost: 2, points: 0 },
    ]);
  });

  it("lists unplayed teams with zeros, ordered by name", () => {
    const t = tournament(["b", "a"]);
    expect(computeStandings(t).map((row) => row.teamId)).toEqual(["a", "b"]);
    expect(computeStandings(t)[0]).toMatchObject({ played: 0, points: 0, goalDifference: 0 });
  });

  it("breaks a points tie on goal difference, then goals scored", () => {
    // a and b each beat c once; a by the wider margin.
    let t = tournament(["a", "b", "c"]);
    t = withResult(t, "a", "c", [10, 2]);
    t = withResult(t, "b", "c", [10, 8]);
    expect(computeStandings(t).map((row) => row.teamId)).toEqual(["a", "b", "c"]);

    // Equal difference: a 10-6 and 4-10 (-2, 14 for); b 10-8 and 6-10 (-2, 16 for). b first.
    let u = tournament(["a", "b", "c", "d"]);
    u = withResult(u, "a", "c", [10, 6]);
    u = withResult(u, "a", "d", [4, 10]);
    u = withResult(u, "b", "c", [10, 8]);
    u = withResult(u, "b", "d", [6, 10]);
    const order = computeStandings(u).map((row) => row.teamId);
    expect(order.indexOf("b")).toBeLessThan(order.indexOf("a"));
  });

  it("breaks a full tie on the head-to-head result", () => {
    // a beat b 10-8 and lost to c 8-10; b lost to a and beat d 10-8: both 1 win,
    // difference 0, 18 goals. The match between them puts a first.
    let t = tournament(["a", "b", "c", "d"]);
    t = withResult(t, "a", "b", [10, 8]);
    t = withResult(t, "a", "c", [8, 10]);
    t = withResult(t, "b", "d", [10, 8]);
    const order = computeStandings(t).map((row) => row.teamId);
    expect(order.indexOf("a")).toBeLessThan(order.indexOf("b"));

    // The mirror: b beat a, so b goes first despite the name order.
    let u = tournament(["a", "b", "c", "d"]);
    u = withResult(u, "a", "b", [8, 10]);
    u = withResult(u, "b", "c", [8, 10]);
    u = withResult(u, "a", "d", [10, 8]);
    const mirrored = computeStandings(u).map((row) => row.teamId);
    expect(mirrored.indexOf("b")).toBeLessThan(mirrored.indexOf("a"));
  });

  it("uses the points-per-win setting", () => {
    let t = tournament(["a", "b"]);
    t = { ...t, settings: { ...t.settings, pointsPerWin: 2 } };
    t = withResult(t, "a", "b", [10, 1]);
    expect(computeStandings(t)[0]?.points).toBe(2);
  });
});
