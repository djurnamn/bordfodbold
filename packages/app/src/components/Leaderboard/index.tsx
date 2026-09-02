"use client";

import type { StandingRow, Tournament } from "@bordfodbold/domain";
import { useLayoutEffect, useRef } from "react";
import { createBem } from "use-bem";

import { TeamMark } from "@/components/TeamMark";
import "./styles.scss";

interface LeaderboardProps {
  tournament: Tournament;
  standings: StandingRow[];
  /** Larger type for an info screen. */
  compact?: boolean;
}

/**
 * Rank, team, won, lost, goal difference, points. Rows glide to their new
 * position when the order changes, so a screen across the room shows the
 * overtake rather than a jump.
 */
export function Leaderboard({ tournament, standings, compact = false }: LeaderboardProps) {
  const bem = createBem("Leaderboard");
  const rowElements = useRef(new Map<string, HTMLTableRowElement>());
  const previousTops = useRef(new Map<string, number>());

  useLayoutEffect(() => {
    const tops = new Map<string, number>();
    for (const [teamId, element] of rowElements.current) {
      const top = element.getBoundingClientRect().top;
      tops.set(teamId, top);
      const previous = previousTops.current.get(teamId);
      if (previous !== undefined && previous !== top) {
        element.animate(
          [{ transform: `translateY(${previous - top}px)` }, { transform: "translateY(0)" }],
          { duration: 450, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" },
        );
      }
    }
    previousTops.current = tops;
  });

  return (
    <table className={bem(undefined, { compact })}>
      <thead className={bem("head")}>
        <tr>
          <th scope="col" className={bem("rank")} abbr="Rank">
            #
          </th>
          <th scope="col" className={bem("team")}>
            Team
          </th>
          <th scope="col" className={bem("number")} abbr="Won">
            W
          </th>
          <th scope="col" className={bem("number")} abbr="Lost">
            L
          </th>
          <th scope="col" className={bem("number")} abbr="Goal difference">
            +/−
          </th>
          <th scope="col" className={bem("number", { points: true })} abbr="Points">
            Pts
          </th>
        </tr>
      </thead>
      <tbody>
        {standings.map((row) => {
          const team = tournament.teams.find((candidate) => candidate.id === row.teamId);
          if (team === undefined) {
            return null;
          }
          return (
            <tr
              key={row.teamId}
              className={bem("row", { leader: row.rank === 1 && row.played > 0 })}
              ref={(element) => {
                if (element === null) {
                  rowElements.current.delete(row.teamId);
                } else {
                  rowElements.current.set(row.teamId, element);
                }
              }}
            >
              <td className={bem("rank")}>{row.rank}</td>
              <td className={bem("team")}>
                <TeamMark team={team} size={compact ? "medium" : "large"} />
              </td>
              <td className={bem("number")}>{row.won}</td>
              <td className={bem("number")}>{row.lost}</td>
              <td className={bem("number")}>{formatDifference(row.goalDifference)}</td>
              <td className={bem("number", { points: true })}>{row.points}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function formatDifference(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}
