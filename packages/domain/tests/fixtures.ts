import type { Legs, Team, Tournament } from "../src/types";
import { reconcileSchedule } from "../src/schedule";

export function team(id: string, name = `Team ${id.toUpperCase()}`): Team {
  return { id, name, members: [`${name} one`, `${name} two`], color: "violet", emblem: "⚽" };
}

export function tournament(teamIds: string[], legs: Legs = 1): Tournament {
  return reconcileSchedule({
    id: "t1",
    slug: "test",
    name: "Test",
    settings: { goalsToWin: 10, pointsPerWin: 3, legs },
    teams: teamIds.map((id) => team(id)),
    matches: [],
    activity: [],
    updatedAt: "2026-09-02T09:00:00.000Z",
  });
}

/** Sets a result directly, bypassing the audit trail - for arranging state. */
export function withResult(t: Tournament, home: string, away: string, score: [number, number]): Tournament {
  return {
    ...t,
    matches: t.matches.map((match) =>
      (match.homeTeamId === home && match.awayTeamId === away) || (match.homeTeamId === away && match.awayTeamId === home && t.settings.legs === 1)
        ? {
            ...match,
            homeScore: match.homeTeamId === home ? score[0] : score[1],
            awayScore: match.homeTeamId === home ? score[1] : score[0],
            playedAt: "2026-09-02T10:00:00.000Z",
          }
        : match,
    ),
  };
}
