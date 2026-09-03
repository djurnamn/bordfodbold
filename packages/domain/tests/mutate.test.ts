import { describe, expect, it } from "vitest";
import { createTournament, nextFreeColor, removeTeam, renameTournament, updateSettings, upsertTeam } from "../src/mutate";
import { DomainError } from "../src/types";
import { team, tournament, withResult } from "./fixtures";

const at = "2026-09-02T11:00:00.000Z";

describe("createTournament", () => {
  it("schedules the teams given", () => {
    const t = createTournament({
      id: "t",
      slug: "s",
      name: "Cup",
      settings: { goalsToWin: 10, pointsPerWin: 3, legs: 1 },
      teams: [team("a"), team("b"), team("c")],
      at,
    });
    expect(t.matches).toHaveLength(3);
    expect(t.updatedAt).toBe(at);
  });

  it("refuses more than eight teams", () => {
    const nine = "abcdefghi".split("").map((id) => team(id));
    expect(() =>
      createTournament({ id: "t", slug: "s", name: "Cup", settings: { goalsToWin: 10, pointsPerWin: 3, legs: 1 }, teams: nine, at }),
    ).toThrow(DomainError);
  });
});

describe("upsertTeam", () => {
  it("adds a team and its pairings", () => {
    const t = upsertTeam(tournament(["a", "b"]), team("c"), at);
    expect(t.teams.map((candidate) => candidate.id)).toEqual(["a", "b", "c"]);
    expect(t.matches).toHaveLength(3);
  });

  it("replaces an existing team in place, keeping its results", () => {
    const before = withResult(tournament(["a", "b"]), "a", "b", [10, 3]);
    const t = upsertTeam(before, { ...team("a"), name: "Renamed", members: [" One ", ""] }, at);
    expect(t.teams[0]).toMatchObject({ id: "a", name: "Renamed", members: ["One"] });
    expect(t.matches[0]?.homeScore).toBe(10);
  });

  it("rejects an empty name, a duplicate name, and a ninth team", () => {
    const t = tournament(["a", "b"]);
    expect(() => upsertTeam(t, { ...team("c"), name: "  " }, at)).toThrow(DomainError);
    expect(() => upsertTeam(t, { ...team("c"), name: "team a" }, at)).toThrow(DomainError);
    const eight = tournament("abcdefgh".split(""));
    expect(() => upsertTeam(eight, team("i"), at)).toThrow(DomainError);
  });
});

describe("removeTeam", () => {
  it("drops the team and its matches", () => {
    const t = removeTeam(tournament(["a", "b", "c"]), "c", at);
    expect(t.teams).toHaveLength(2);
    expect(t.matches.map((match) => match.id)).toEqual(["a--b--1"]);
  });

  it("is a no-op for an unknown team", () => {
    const t = tournament(["a", "b"]);
    expect(removeTeam(t, "zzz", at)).toBe(t);
  });
});

describe("updateSettings", () => {
  it("reschedules when legs change", () => {
    const t = updateSettings(tournament(["a", "b", "c"]), { legs: 2 }, at);
    expect(t.matches).toHaveLength(6);
  });

  it("validates the numbers", () => {
    const t = tournament(["a", "b"]);
    expect(() => updateSettings(t, { goalsToWin: 0 }, at)).toThrow(DomainError);
    expect(() => updateSettings(t, { pointsPerWin: 1.5 }, at)).toThrow(DomainError);
    expect(() => updateSettings(t, { legs: 3 as never }, at)).toThrow(DomainError);
  });
});

describe("renameTournament", () => {
  it("trims and rejects blank", () => {
    expect(renameTournament(tournament(["a"]), "  Friday Cup ", at).name).toBe("Friday Cup");
    expect(() => renameTournament(tournament(["a"]), " ", at)).toThrow(DomainError);
  });
});

describe("nextFreeColor", () => {
  it("skips colors in use", () => {
    const t = tournament(["a", "b"]);
    // Fixtures are all violet.
    expect(nextFreeColor(t)).toBe("green");
    expect(nextFreeColor(tournament([]))).toBe("violet");
  });

  it("falls back to the least used color once every color is taken", () => {
    const colors = ["violet", "green", "magenta", "yellow", "blue", "orange", "aqua", "coral"] as const;
    const t = tournament("abcdefgh".split(""));
    const painted = { ...t, teams: t.teams.map((member, index) => ({ ...member, color: colors[index]! })) };
    // A ninth team cannot join, but a repainted one asks the same question.
    const twoViolets = { ...painted, teams: painted.teams.map((member, index) => (index === 1 ? { ...member, color: "violet" as const } : member)) };
    expect(nextFreeColor(twoViolets)).toBe("green");
  });
});
