"use client";

import { selectCell, type GridCell, type Match, type Tournament } from "@bordfodbold/domain";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createBem } from "use-bem";

import { TeamMark } from "@/components/TeamMark";
import "./styles.scss";

interface TournamentGridProps {
  tournament: Tournament;
  /** When given, cells are buttons and this receives the tapped match. */
  onSelectMatch?: (match: Match) => void;
  /** `large` for an info screen. */
  size?: "default" | "large";
}

/**
 * The tournament plan: every team against every team, as a segmented
 * surface in the design system's table idiom. A cell reads from its row
 * team's point of view. A result that changes flashes so a glance from
 * across the room catches it.
 */
export function TournamentGrid({ tournament, onSelectMatch, size = "default" }: TournamentGridProps) {
  const bem = createBem("TournamentGrid");
  const cellElements = useRef(new Map<string, HTMLElement>());
  const previousResults = useRef(new Map<string, string>());
  const editable = onSelectMatch !== undefined;
  const teams = tournament.teams;
  const lastIndex = teams.length - 1;
  // The hovered cell's row and column light up as a cross, so the eye can
  // follow a result back to both teams.
  const [hovered, setHovered] = useState<{ rowId: string | null; columnId: string | null } | null>(null);
  const inCross = (rowId: string | null, columnId: string | null) =>
    hovered !== null && ((rowId !== null && hovered.rowId === rowId) || (columnId !== null && hovered.columnId === columnId));

  const cells = new Map<string, GridCell>();
  for (const row of teams) {
    for (const column of teams) {
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

  const cellClass = (rowIndex: number, columnIndex: number, extra: Record<string, unknown> = {}) =>
    bem("cell", {
      firstColumn: columnIndex === 0,
      lastColumn: columnIndex === lastIndex + 1,
      firstRow: rowIndex === 0,
      lastRow: rowIndex === lastIndex + 1,
      ...extra,
    });

  if (teams.length < 2) {
    return <p className={bem("empty")}>{teams.length === 0 ? "No teams yet. The plan fills in as teams are added." : "One team has nobody to play. Add another."}</p>;
  }

  return (
    <div className={bem(undefined, { [size]: true, editable })} data-djui-next-surface="" onPointerLeave={() => setHovered(null)}>
      <div className={bem("scroll")}>
        <div className={bem("layout")} role="table" style={{ "--grid-columns": `var(--grid-head-width) repeat(${teams.length}, minmax(var(--grid-cell-width), 1fr))` }}>
          <div className={bem("row")} role="row">
            <div className={cellClass(0, 0, { corner: true })} role="columnheader" data-djui-next-surface="">
              <span className={bem("cornerLabel")}>home ↓ away →</span>
            </div>
            {teams.map((team, columnIndex) => (
              <div key={team.id} className={cellClass(0, columnIndex + 1, { columnHead: true, highlighted: inCross(null, team.id) })} role="columnheader" data-djui-next-surface="" onPointerEnter={() => setHovered({ rowId: null, columnId: team.id })}>
                <TeamMark team={team} size="small" emblemOnly />
              </div>
            ))}
          </div>
          {teams.map((row, rowIndex) => (
            <div key={row.id} className={bem("row")} role="row">
              <div className={cellClass(rowIndex + 1, 0, { rowHead: true, highlighted: inCross(row.id, null) })} role="rowheader" data-djui-next-surface="" onPointerEnter={() => setHovered({ rowId: row.id, columnId: null })}>
                <TeamMark team={row} size="small" hideNameBelow="small" />
              </div>
              {teams.map((column, columnIndex) => {
                const key = `${row.id}:${column.id}`;
                const cell = cells.get(key) ?? { kind: "missing" };
                return (
                  <div
                    key={column.id}
                    className={cellClass(rowIndex + 1, columnIndex + 1, {
                      [cell.kind]: true,
                      won: cell.kind === "played" && cell.rowWon,
                      lost: cell.kind === "played" && !cell.rowWon,
                      highlighted: inCross(row.id, column.id),
                      focus: hovered !== null && hovered.rowId === row.id && hovered.columnId === column.id,
                    })}
                    role="cell"
                    data-djui-next-surface=""
                    onPointerEnter={() => setHovered({ rowId: row.id, columnId: column.id })}
                    ref={(element) => {
                      if (element === null) {
                        cellElements.current.delete(key);
                      } else {
                        cellElements.current.set(key, element);
                      }
                    }}
                  >
                    {renderCell(cell, editable ? onSelectMatch : undefined, bem, `${row.name} versus ${column.name}`)}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function renderCell(cell: GridCell, onSelectMatch: ((match: Match) => void) | undefined, bem: ReturnType<typeof createBem>, label: string): ReactNode {
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
