"use client";

import type { ScoreChange, Team, Tournament } from "@bordfodbold/domain";
import { Table, type TableRow } from "@bordfodbold/ui";
import { createBem } from "use-bem";

import { TeamMark } from "@/components/TeamMark";
import { clockTime, relativeTime, useNow } from "@/lib/time";
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
  const entries = tournament.activity.slice(0, limit);

  if (entries.length === 0) {
    return <p className={bem("empty")}>No results entered yet.</p>;
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
    <div className={bem(undefined, { [density]: true })}>
      <Table
        nonInteractive
        hideHeader
        hover="none"
        striped
        separators="rows"
        columns={[
          { key: "home", label: "Home", width: { fill: true, min: 120 }, align: "end" },
          { key: "result", label: "Result", width: { fixed: 96 }, align: "center" },
          { key: "away", label: "Away", width: { fill: true, min: 120 } },
          { key: "when", label: "When", width: { fixed: 88 }, align: "end" },
        ]}
        rows={rows}
      />
    </div>
  );
}

function describe(change: ScoreChange, tournament: Tournament): { home: Team | undefined; away: Team | undefined; result: string; previous: string | null } {
  const match = tournament.matches.find((candidate) => candidate.id === change.matchId);
  const score = (value: readonly [number, number]) => `${value[0]}–${value[1]}`;
  return {
    home: tournament.teams.find((team) => team.id === match?.homeTeamId),
    away: tournament.teams.find((team) => team.id === match?.awayTeamId),
    result: change.next === null ? "cleared" : score(change.next),
    previous: change.previous === null ? null : score(change.previous),
  };
}
