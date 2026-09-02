import { describe, expect, it } from "vitest";
import { selectCell, unplayedMatches } from "../src/select";
import { tournament, withResult } from "./fixtures";

describe("selectCell", () => {
  it("marks the diagonal", () => {
    expect(selectCell(tournament(["a", "b"]), "a", "a")).toEqual({ kind: "self" });
  });

  it("shows one match from both sides with one leg", () => {
    const t = withResult(tournament(["a", "b"]), "a", "b", [4, 10]);
    expect(selectCell(t, "a", "b")).toMatchObject({ kind: "played", rowScore: 4, columnScore: 10, rowWon: false });
    expect(selectCell(t, "b", "a")).toMatchObject({ kind: "played", rowScore: 10, columnScore: 4, rowWon: true });
  });

  it("shows the hosted match with two legs", () => {
    let t = tournament(["a", "b"], 2);
    t = withResult(t, "a", "b", [4, 10]);
    expect(selectCell(t, "a", "b")).toMatchObject({ kind: "played", rowScore: 4, columnScore: 10 });
    expect(selectCell(t, "b", "a")).toMatchObject({ kind: "unplayed" });
  });

  it("reports an unplayed pairing", () => {
    expect(selectCell(tournament(["a", "b"]), "a", "b")).toMatchObject({ kind: "unplayed" });
  });
});

describe("unplayedMatches", () => {
  it("lists what is left to play", () => {
    const t = withResult(tournament(["a", "b", "c"]), "a", "b", [10, 3]);
    expect(unplayedMatches(t).map((match) => match.id)).toEqual(["a--c--1", "b--c--1"]);
  });
});
