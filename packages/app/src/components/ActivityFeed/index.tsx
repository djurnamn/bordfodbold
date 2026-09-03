"use client";

import { teamById, type ScoreChange, type Team, type Tournament } from "@bordfodbold/domain";
import { Table, type TableRow } from "@bordfodbold/ui";
import { useRef } from "react";
import { createBem } from "use-bem";

import { EmptyState } from "@/components/EmptyState";
import { TeamMark } from "@/components/TeamMark";
import { formatScore } from "@/lib/format";
import { clockTime, relativeTime, useNow } from "@/lib/time";
import { useContainerWidth } from "@/lib/use-container-width";
import "./styles.scss";

interface ActivityFeedProps {
  tournament: Tournament;
  limit?: number;
  density?: "default" | "compact";
}

/** The audit trail, newest first: the pairing, the result it got, and when. */
export function ActivityFeed({ tournament, limit = 8, density = "default" }: ActivityFeedProps) {
  const bem = createBem("ActivityFeed");
  const now = useNow();
  const root = useRef<HTMLDivElement>(null);
  // A narrow container has no room for the time column.
  const narrow = useContainerWidth(root) < 440;
  const entries = tournament.activity.slice(0, limit);

  if (entries.length === 0) {
    return <EmptyState>No results entered yet.</EmptyState>;
  }

  const rows: TableRow[] = entries.map((change) => {
    const { home, away, result, previous } = describe(change, tournament);
    return {
      home: home ? <TeamMark team={home} size="small" emblemPosition="end" /> : <span>?</span>,
      result: (
        <span className={bem("result", { cleared: change.next === null })}>
          <span className={bem("score")}>{result}</span>
          {previous !== null && <span className={bem("previous")}>was {previous}</span>}
        </span>
      ),
      away: away ? <TeamMark team={away} size="small" /> : <span>?</span>,
      when: (
        <span className={bem("when")}>
          {change.undoes !== undefined && <span className={bem("undoLabel")}>Undo</span>}
          <time dateTime={change.changedAt} title={clockTime(change.changedAt)}>
            {relativeTime(change.changedAt, now)}
          </time>
        </span>
      ),
    };
  });

  return (
    <div className={bem(undefined, { [density]: true })} ref={root}>
      <Table
        nonInteractive
        hideHeader
        hover="none"
        striped
        separators="rows"
        columns={[
          { key: "home", label: "Home", width: { fill: true, min: narrow ? 88 : 120 }, align: "end" },
          { key: "result", label: "Result", width: { fixed: narrow ? 72 : 96 }, align: "center" },
          { key: "away", label: "Away", width: { fill: true, min: narrow ? 88 : 120 } },
          ...(narrow ? [] : [{ key: "when", label: "When", width: { fixed: 88 }, align: "end" as const }]),
        ]}
        rows={rows}
      />
    </div>
  );
}

function describe(change: ScoreChange, tournament: Tournament): { home: Team | undefined; away: Team | undefined; result: string; previous: string | null } {
  const match = tournament.matches.find((candidate) => candidate.id === change.matchId);
  return {
    home: match && teamById(tournament, match.homeTeamId),
    away: match && teamById(tournament, match.awayTeamId),
    result: change.next === null ? "cleared" : formatScore(change.next),
    previous: change.previous === null ? null : formatScore(change.previous),
  };
}
