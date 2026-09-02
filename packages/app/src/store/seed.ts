import { applyScoreChange, createTournament, type Tournament } from "@bordfodbold/domain";

/** A tournament with nothing in it: the state a reset leaves, and the first-run state without demo data. */
export function emptyTournament(slug = "autumn-open", at: string = new Date().toISOString()): Tournament {
  return createTournament({
    id: `tournament-${slug}`,
    slug,
    name: "New tournament",
    settings: { goalsToWin: 10, pointsPerWin: 3, legs: 1 },
    teams: [],
    at,
  });
}

/**
 * The demo tournament: six teams, room for two more, a handful of results
 * so the leaderboard has something to say. Deterministic - ids and
 * timestamps are fixed - so every adapter seeds the same data.
 */
export function seedTournament(): Tournament {
  const at = "2026-09-01T09:00:00.000Z";
  let tournament = createTournament({
    id: "signifly-autumn-open",
    slug: "autumn-open",
    name: "Signifly Autumn Open",
    settings: { goalsToWin: 10, pointsPerWin: 3, legs: 1 },
    teams: [
      { id: "vikings", name: "Vesterbro Vikings", members: ["Mette", "Jonas"], color: "violet", emblem: "🪓" },
      { id: "nutmegs", name: "Nørrebro Nutmegs", members: ["Aisha", "Frederik"], color: "green", emblem: "🌰" },
      { id: "spinners", name: "Spin Doctors", members: ["Lærke", "Oliver"], color: "magenta", emblem: "🌀" },
      { id: "wall", name: "The Wall", members: ["Sofie", "Magnus", "Emil"], color: "yellow", emblem: "🧱" },
      { id: "harbour", name: "Harbour Sharks", members: ["Ida", "Noah"], color: "blue", emblem: "🦈" },
      { id: "lunchbox", name: "Lunchbox Legends", members: ["Karen", "Mikkel"], color: "orange", emblem: "🥪" },
    ],
    at,
  });

  const results: Array<[home: string, away: string, score: [number, number], minute: number]> = [
    ["vikings", "nutmegs", [10, 7], 5],
    ["spinners", "wall", [4, 10], 12],
    ["harbour", "lunchbox", [10, 8], 20],
    ["vikings", "spinners", [10, 3], 31],
    ["nutmegs", "wall", [10, 9], 44],
    ["harbour", "vikings", [6, 10], 58],
    ["lunchbox", "spinners", [10, 5], 63],
  ];
  results.forEach(([home, away, score, minute], index) => {
    const matchId = tournament.matches.find(
      (match) =>
        (match.homeTeamId === home && match.awayTeamId === away) ||
        (match.homeTeamId === away && match.awayTeamId === home),
    )?.id;
    if (matchId === undefined) {
      throw new Error(`Seed names a pairing that is not scheduled: ${home} vs. ${away}`);
    }
    const oriented: [number, number] = matchId.startsWith(`${home}--`) ? score : [score[1], score[0]];
    tournament = applyScoreChange(tournament, matchId, oriented, {
      changeId: `seed-${index + 1}`,
      at: `2026-09-01T${String(9 + Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}:00.000Z`,
    });
  });

  return tournament;
}
