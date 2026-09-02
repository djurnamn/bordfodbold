"use client";

import { selectCell, type GridCell, type Match, type Tournament } from "@bordfodbold/domain";
import { useLayoutEffect, useRef, type ReactNode } from "react";
import { createBem } from "use-bem";

import { TeamMark } from "@/components/TeamMark";
import "./styles.scss";

interface TournamentGridProps {
  tournament: Tournament;
  /** When given, cells are buttons and this receives the tapped match. */
  onSelectMatch?: (match: Match) => void;
  compact?: boolean;
}

/**
 * The tournament plan: every team against every team. A cell reads from
 * its row team's point of view. A result that changes flashes so a glance
 * from across the room catches it.
 */
export function TournamentGrid({ tournament, onSelectMatch, compact = false }: TournamentGridProps) {
  const bem = createBem("TournamentGrid");
  const cellElements = useRef(new Map<string, HTMLElement>());
  const previousResults = useRef(new Map<string, string>());
  const editable = onSelectMatch !== undefined;

  const cells = new Map<string, GridCell>();
  for (const row of tournament.teams) {
    for (const column of tournament.teams) {
      cells.set(`${row.id}:${column.id}`, selectCell(tournament, row.id, column.id));
    }
  }

  useLayoutEffect(() => {
    const results = new Map<string, string>();
    for (const [key, cell] of cells) {
      results.set(key, resultKey(cell));
    }
    const first = previousResults.current.size === 0;
    for (const [key, result] of results) {
      const previous = previousResults.current.get(key);
      if (!first && previous !== undefined && previous !== result) {
        cellElements.current.get(key)?.animate(
          [
            { boxShadow: "inset 0 0 0 999px rgb(var(--djui-accent-primary-rgb) / 0.55)" },
            { boxShadow: "inset 0 0 0 999px rgb(var(--djui-accent-primary-rgb) / 0)" },
          ],
          { duration: 1400, easing: "ease-out" },
        );
      }
    }
    previousResults.current = results;
  });

  return (
    <div className={bem("scroll")}>
      <table className={bem(undefined, { compact, editable })}>
        <thead>
          <tr>
            <th scope="col" className={bem("corner")}>
              <span className={bem("cornerLabel")}>home ↓ away →</span>
            </th>
            {tournament.teams.map((team) => (
              <th key={team.id} scope="col" className={bem("columnHead")}>
                <TeamMark team={team} size="small" emblemOnly />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tournament.teams.map((row) => (
            <tr key={row.id}>
              <th scope="row" className={bem("rowHead")}>
                <TeamMark team={row} size="small" />
              </th>
              {tournament.teams.map((column) => {
                const key = `${row.id}:${column.id}`;
                const cell = cells.get(key) ?? { kind: "missing" };
                const register = (element: HTMLElement | null) => {
                  if (element === null) {
                    cellElements.current.delete(key);
                  } else {
                    cellElements.current.set(key, element);
                  }
                };
                return (
                  <td key={column.id} className={bem("cell", { [cell.kind]: true, won: cell.kind === "played" && cell.rowWon, lost: cell.kind === "played" && !cell.rowWon })} ref={register}>
                    {renderCell(cell, editable ? onSelectMatch : undefined, bem, `${row.name} versus ${column.name}`)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderCell(
  cell: GridCell,
  onSelectMatch: ((match: Match) => void) | undefined,
  bem: ReturnType<typeof createBem>,
  label: string,
): ReactNode {
  if (cell.kind === "self") {
    return <span className={bem("self")} aria-hidden="true" />;
  }
  if (cell.kind === "missing") {
    return null;
  }
  const content =
    cell.kind === "played" ? (
      <span className={bem("score")}>
        <span className={bem("goals", { row: true })}>{cell.rowScore}</span>
        <span className={bem("dash")}>–</span>
        <span className={bem("goals")}>{cell.columnScore}</span>
      </span>
    ) : (
      <span className={bem("pending")}>–</span>
    );
  if (onSelectMatch === undefined) {
    return content;
  }
  return (
    <button type="button" className={bem("button")} onClick={() => onSelectMatch(cell.match)} aria-label={`${label}: ${cell.kind === "played" ? `${cell.rowScore} to ${cell.columnScore}` : "not played yet"}`}>
      {content}
    </button>
  );
}

function resultKey(cell: GridCell): string {
  return cell.kind === "played" ? `${cell.rowScore}-${cell.columnScore}` : cell.kind;
}
