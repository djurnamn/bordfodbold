"use client";

import { Typography } from "@bordfodbold/ui";

import { useStandings, useTournament } from "@/store/provider";

/** A placeholder readout of the data layer, replaced by the real board next. */
export function BoardPreview() {
  const tournament = useTournament();
  const standings = useStandings();
  return (
    <main>
      <Typography tag="h1" variant="title">
        {tournament.name}
      </Typography>
      <ol>
        {standings.map((row) => {
          const team = tournament.teams.find((candidate) => candidate.id === row.teamId);
          return (
            <li key={row.teamId}>
              {team?.emblem} {team?.name}: {row.won}-{row.lost}, {row.points} points
            </li>
          );
        })}
      </ol>
    </main>
  );
}
