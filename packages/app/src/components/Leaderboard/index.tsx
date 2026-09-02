"use client";

import type { StandingRow, Tournament } from "@bordfodbold/domain";
import { Table, type TableRow } from "@bordfodbold/ui";
import { useLayoutEffect, useRef } from "react";
import { createBem } from "use-bem";

import { TeamMark } from "@/components/TeamMark";
import "./styles.scss";

interface LeaderboardProps {
  tournament: Tournament;
  standings: StandingRow[];
  /** `large` for an info screen. */
  size?: "default" | "large";
}

/**
 * Rank, team, won, lost, goal difference, points, on the design system's
 * table. Rows glide to their new position when the order changes, so a screen
 * across the room shows the overtake rather than a jump.
 */
export function Leaderboard({ tournament, standings, size = "default" }: LeaderboardProps) {
  const bem = createBem("Leaderboard");
  const root = useRef<HTMLDivElement>(null);
  const previousTops = useRef(new Map<string, number>());

  useLayoutEffect(() => {
    const tops = new Map<string, number>();
    const cells = root.current?.querySelectorAll<HTMLElement>("[data-team-id]") ?? [];
    for (const marker of cells) {
      const teamId = marker.dataset.teamId ?? "";
      const cell = marker.parentElement ?? marker;
      const top = cell.getBoundingClientRect().top;
      tops.set(teamId, top);
      const previous = previousTops.current.get(teamId);
      if (previous !== undefined && previous !== top) {
        cell.animate([{ transform: `translateY(${previous - top}px)` }, { transform: "translateY(0)" }], {
          duration: 450,
          easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
        });
      }
    }
    previousTops.current = tops;
  });

  if (standings.length === 0) {
    return <p className={bem("empty")}>No teams yet. Add them in the admin.</p>;
  }

  const rows: TableRow[] = standings.flatMap((row) => {
    const team = tournament.teams.find((candidate) => candidate.id === row.teamId);
    if (team === undefined) {
      return [];
    }
    const leader = row.rank === 1 && row.played > 0;
    const numeric = (value: string, emphasis = false) => (
      <span className={bem("number", { emphasis })} data-team-id={team.id}>
        {value}
      </span>
    );
    return [
      {
        rank: (
          <span className={bem("rank", { leader })} data-team-id={team.id}>
            {row.rank}
          </span>
        ),
        team: <TeamMark team={team} size={size === "large" ? "medium" : "large"} data-team-id={team.id} />,
        won: numeric(String(row.won)),
        lost: numeric(String(row.lost)),
        difference: numeric(formatDifference(row.goalDifference)),
        points: numeric(String(row.points), true),
      },
    ];
  });

  return (
    <div className={bem(undefined, { [size]: true })} ref={root}>
      <Table
        nonInteractive
        hover="none"
        striped
        separators="rows"
        columns={[
          { key: "rank", label: "#", width: { fixed: 40 } },
          { key: "team", label: "Team", width: { fill: true, min: 140 } },
          { key: "won", label: "W", width: { fixed: 40 }, align: "end" },
          { key: "lost", label: "L", width: { fixed: 40 }, align: "end" },
          { key: "difference", label: "+/−", width: { fixed: 52 }, align: "end" },
          { key: "points", label: "Pts", width: { fixed: 60 }, align: "end" },
        ]}
        rows={rows}
      />
    </div>
  );
}

function formatDifference(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}
