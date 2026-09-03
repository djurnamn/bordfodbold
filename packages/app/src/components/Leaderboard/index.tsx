"use client";

import { teamById, type StandingRow, type Tournament } from "@bordfodbold/domain";
import { Table, type TableRow } from "@bordfodbold/ui";
import { useLayoutEffect, useRef } from "react";
import { createBem } from "use-bem";

import { EmptyState } from "@/components/EmptyState";
import { TeamMark } from "@/components/TeamMark";
import { prefersReducedMotion } from "@/lib/motion";
import { useContainerWidth } from "@/lib/use-container-width";
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
  // Below this width the fixed columns and the insets no longer fit beside
  // the names: a phone, or a narrow panel on a small screen.
  const narrow = useContainerWidth(root) < 460;

  useLayoutEffect(() => {
    const tops = new Map<string, number>();
    const cells = root.current?.querySelectorAll<HTMLElement>("[data-team-id]") ?? [];
    for (const marker of cells) {
      const teamId = marker.dataset.teamId ?? "";
      const cell = marker.parentElement ?? marker;
      const top = cell.getBoundingClientRect().top;
      tops.set(teamId, top);
      const previous = previousTops.current.get(teamId);
      if (previous !== undefined && previous !== top && !prefersReducedMotion()) {
        cell.animate([{ transform: `translateY(${previous - top}px)` }, { transform: "translateY(0)" }], {
          duration: 450,
          easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
        });
      }
    }
    previousTops.current = tops;
  });

  if (standings.length === 0) {
    return <EmptyState>No teams yet. Add them in the admin.</EmptyState>;
  }

  const rows: TableRow[] = standings.flatMap((row) => {
    const team = teamById(tournament, row.teamId);
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
        team: <TeamMark team={team} size={size === "large" || narrow ? "medium" : "large"} data-team-id={team.id} />,
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
        columns={
          // A narrow container has no room for the difference column.
          narrow
            ? [
                { key: "rank", label: "#", width: { fixed: 32 } },
                { key: "team", label: "Team", width: { fill: true, min: 96 } },
                { key: "won", label: "W", width: { fixed: 32 }, align: "end" },
                { key: "lost", label: "L", width: { fixed: 32 }, align: "end" },
                { key: "points", label: "Pts", width: { fixed: 52 }, align: "end" },
              ]
            : [
                { key: "rank", label: "#", width: { fixed: 40 } },
                { key: "team", label: "Team", width: { fill: true, min: 140 } },
                { key: "won", label: "W", width: { fixed: 40 }, align: "end" },
                { key: "lost", label: "L", width: { fixed: 40 }, align: "end" },
                { key: "difference", label: "+/−", width: { fixed: 52 }, align: "end" },
                { key: "points", label: "Pts", width: { fixed: 60 }, align: "end" },
              ]
        }
        rows={rows}
      />
    </div>
  );
}

function formatDifference(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}
