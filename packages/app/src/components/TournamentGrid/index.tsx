"use client";

import { selectCell, type GridCell, type Match, type Tournament } from "@bordfodbold/domain";
import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { createBem } from "use-bem";

import { EmptyState } from "@/components/EmptyState";
import { TeamMark } from "@/components/TeamMark";
import { prefersReducedMotion } from "@/lib/motion";
import "./styles.scss";

interface TournamentGridProps {
  tournament: Tournament;
  /** When given, cells are buttons and this receives the tapped match. */
  onSelectMatch?: (match: Match) => void;
  /** `large` for an info screen. */
  size?: "default" | "large";
}

interface Position {
  rowId: string | null;
  columnId: string | null;
}

/**
 * The tournament plan: every team against every team, as a segmented
 * surface in the design system's table idiom. A cell reads from its row
 * team's point of view. The cell under the pointer or the keyboard lights
 * its row and column as a cross; a result that changes flashes so a glance
 * from across the room catches it. Editable, the grid is one tab stop with
 * the arrow keys moving between cells.
 */
export function TournamentGrid({ tournament, onSelectMatch, size = "default" }: TournamentGridProps) {
  const bem = createBem("TournamentGrid");
  const cellElements = useRef(new Map<string, HTMLElement>());
  const previousResults = useRef(new Map<string, string>());
  const scroll = useRef<HTMLDivElement>(null);
  const [scrollable, setScrollable] = useState(false);
  const [pointed, setPointed] = useState<Position | null>(null);
  const [current, setCurrent] = useState<string | null>(null);
  const editable = onSelectMatch !== undefined;
  const teams = tournament.teams;
  const lastIndex = teams.length - 1;

  const cells = new Map<string, GridCell>();
  for (const row of teams) {
    for (const column of teams) {
      cells.set(`${row.id}:${column.id}`, selectCell(tournament, row.id, column.id));
    }
  }

  const inCross = (rowId: string | null, columnId: string | null) =>
    pointed !== null && ((rowId !== null && pointed.rowId === rowId) || (columnId !== null && pointed.columnId === columnId));

  useLayoutEffect(() => {
    const results = new Map<string, string>();
    for (const [key, cell] of cells) {
      results.set(key, resultKey(cell));
    }
    const first = previousResults.current.size === 0;
    if (!first && !prefersReducedMotion()) {
      for (const [key, result] of results) {
        const previous = previousResults.current.get(key);
        if (previous !== undefined && previous !== result) {
          cellElements.current.get(key)?.animate(
            [
              { boxShadow: "inset 0 0 0 999px rgb(var(--djui-accent-primary-rgb) / 0.55)" },
              { boxShadow: "inset 0 0 0 999px rgb(var(--djui-accent-primary-rgb) / 0)" },
            ],
            { duration: 1400, easing: "ease-out" },
          );
        }
      }
    }
    previousResults.current = results;
  });

  // A grid wider than its container scrolls; the fade at the edge says so.
  useEffect(() => {
    const element = scroll.current;
    if (element === null) {
      return;
    }
    const update = () => setScrollable(element.scrollWidth > element.clientWidth + 1);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [teams.length]);

  if (teams.length < 2) {
    return <EmptyState>{teams.length === 0 ? "No teams yet. The plan fills in as teams are added." : "One team has nobody to play. Add another."}</EmptyState>;
  }

  const firstPlayable = `${teams[0]?.id}:${teams[1]?.id}`;
  const tabStop = current ?? firstPlayable;

  const moveFocus = (event: KeyboardEvent<HTMLButtonElement>, rowIndex: number, columnIndex: number) => {
    const step = { ArrowRight: [0, 1], ArrowLeft: [0, -1], ArrowDown: [1, 0], ArrowUp: [-1, 0] }[event.key];
    if (step === undefined) {
      return;
    }
    event.preventDefault();
    let [nextRow, nextColumn] = [rowIndex + step[0]!, columnIndex + step[1]!];
    // Skip the diagonal; stop at the edges.
    if (nextRow === nextColumn) {
      nextRow += step[0]!;
      nextColumn += step[1]!;
    }
    if (nextRow < 0 || nextColumn < 0 || nextRow > lastIndex || nextColumn > lastIndex) {
      return;
    }
    const key = `${teams[nextRow]?.id}:${teams[nextColumn]?.id}`;
    cellElements.current.get(key)?.querySelector("button")?.focus();
  };

  const cellClass = (rowIndex: number, columnIndex: number, extra: Record<string, unknown> = {}) =>
    bem("cell", {
      firstColumn: columnIndex === 0,
      lastColumn: columnIndex === lastIndex + 1,
      firstRow: rowIndex === 0,
      lastRow: rowIndex === lastIndex + 1,
      ...extra,
    });

  return (
    <div className={bem(undefined, { [size]: true, editable })} data-djui-next-surface="" onPointerLeave={() => setPointed(null)}>
      <div className={bem("scroll", { scrollable })} ref={scroll}>
        <div className={bem("layout")} role="table" style={{ "--grid-columns": `var(--grid-head-width) repeat(${teams.length}, minmax(var(--grid-cell-width), 1fr))` }}>
          <div className={bem("row")} role="row">
            <div className={cellClass(0, 0, { corner: true })} role="columnheader" data-djui-next-surface="">
              <span className={bem("cornerLabel")}>home ↓ away →</span>
            </div>
            {teams.map((team, columnIndex) => (
              <div
                key={team.id}
                className={cellClass(0, columnIndex + 1, { columnHead: true, highlighted: inCross(null, team.id) })}
                role="columnheader"
                data-djui-next-surface=""
                onPointerEnter={() => setPointed({ rowId: null, columnId: team.id })}
              >
                <TeamMark team={team} size="small" emblemOnly />
              </div>
            ))}
          </div>
          {teams.map((row, rowIndex) => (
            <div key={row.id} className={bem("row")} role="row">
              <div
                className={cellClass(rowIndex + 1, 0, { rowHead: true, highlighted: inCross(row.id, null) })}
                role="rowheader"
                data-djui-next-surface=""
                onPointerEnter={() => setPointed({ rowId: row.id, columnId: null })}
              >
                <TeamMark team={row} size="small" hideNameBelow="small" />
              </div>
              {teams.map((column, columnIndex) => {
                const key = `${row.id}:${column.id}`;
                const cell = cells.get(key) ?? { kind: "missing" };
                const isPointed = pointed !== null && pointed.rowId === row.id && pointed.columnId === column.id;
                return (
                  <div
                    key={column.id}
                    className={cellClass(rowIndex + 1, columnIndex + 1, {
                      [cell.kind]: true,
                      won: cell.kind === "played" && cell.rowWon,
                      lost: cell.kind === "played" && !cell.rowWon,
                      highlighted: inCross(row.id, column.id),
                      pointed: isPointed,
                    })}
                    role="cell"
                    data-djui-next-surface=""
                    onPointerEnter={() => setPointed({ rowId: row.id, columnId: column.id })}
                    ref={(element) => {
                      if (element === null) {
                        cellElements.current.delete(key);
                      } else {
                        cellElements.current.set(key, element);
                      }
                    }}
                  >
                    {cell.kind === "self" || cell.kind === "missing" ? null : editable ? (
                      <button
                        type="button"
                        className={bem("button")}
                        tabIndex={key === tabStop ? 0 : -1}
                        onClick={() => onSelectMatch(cell.match)}
                        onFocus={() => {
                          setCurrent(key);
                          setPointed({ rowId: row.id, columnId: column.id });
                        }}
                        onBlur={() => setPointed(null)}
                        onKeyDown={(event) => moveFocus(event, rowIndex, columnIndex)}
                        aria-label={`${row.name} versus ${column.name}: ${cell.kind === "played" ? `${cell.rowScore} to ${cell.columnScore}` : "not played yet"}`}
                      >
                        {renderResult(cell, bem)}
                      </button>
                    ) : (
                      renderResult(cell, bem)
                    )}
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

function renderResult(cell: GridCell, bem: ReturnType<typeof createBem>): ReactNode {
  if (cell.kind !== "played") {
    return <span className={bem("pending")}>–</span>;
  }
  return (
    <span className={bem("score")}>
      <span className={bem("goals", { row: true })}>{cell.rowScore}</span>
      <span className={bem("dash")}>–</span>
      <span className={bem("goals")}>{cell.columnScore}</span>
    </span>
  );
}

function resultKey(cell: GridCell): string {
  return cell.kind === "played" ? `${cell.rowScore}-${cell.columnScore}` : cell.kind;
}
