import { describe, expect, it } from "vitest";
import { validateScore, winnerOf } from "../src/validate";
import { tournament, withResult } from "./fixtures";

const settings = { goalsToWin: 10, pointsPerWin: 3, legs: 1 as const };

describe("validateScore", () => {
  it("accepts a finished game", () => {
    expect(validateScore([10, 8], settings)).toEqual({ ok: true });
    expect(validateScore([0, 10], settings)).toEqual({ ok: true });
  });

  it("rejects a draw, an unfinished game, and an overshoot", () => {
    expect(validateScore([10, 10], settings).ok).toBe(false);
    expect(validateScore([9, 7], settings).ok).toBe(false);
    expect(validateScore([11, 3], settings).ok).toBe(false);
  });

  it("rejects fractions and negatives", () => {
    expect(validateScore([10, 2.5], settings).ok).toBe(false);
    expect(validateScore([-1, 10], settings).ok).toBe(false);
  });

  it("follows the goals-to-win setting", () => {
    expect(validateScore([5, 3], { ...settings, goalsToWin: 5 })).toEqual({ ok: true });
  });
});

describe("winnerOf", () => {
  it("names the winner, or null before the match is played", () => {
    const t = withResult(tournament(["a", "b"]), "a", "b", [4, 10]);
    expect(winnerOf(t.matches[0]!)).toBe("b");
    expect(winnerOf({ ...t.matches[0]!, homeScore: null, awayScore: null })).toBeNull();
  });
});
