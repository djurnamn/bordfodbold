"use client";

import type { ScoreChange, Tournament } from "@bordfodbold/domain";
import { createBem } from "use-bem";

import { clockTime, relativeTime, useNow } from "@/lib/time";
import "./styles.scss";

interface ActivityFeedProps {
  tournament: Tournament;
  limit?: number;
}

/** The audit trail, newest first: what was entered, what it replaced, when. */
export function ActivityFeed({ tournament, limit = 8 }: ActivityFeedProps) {
  const bem = createBem("ActivityFeed");
  const now = useNow();
  const entries = tournament.activity.slice(0, limit);

  if (entries.length === 0) {
    return <p className={bem("empty")}>No results entered yet.</p>;
  }

  return (
    <ol className={bem()}>
      {entries.map((change) => (
        <li key={change.id} className={bem("entry")}>
          <span className={bem("what")}>{describe(change, tournament)}</span>
          <time className={bem("when")} dateTime={change.changedAt} title={clockTime(change.changedAt)}>
            {relativeTime(change.changedAt, now)}
          </time>
        </li>
      ))}
    </ol>
  );
}

function describe(change: ScoreChange, tournament: Tournament): string {
  const match = tournament.matches.find((candidate) => candidate.id === change.matchId);
  const home = tournament.teams.find((team) => team.id === match?.homeTeamId)?.name ?? "?";
  const away = tournament.teams.find((team) => team.id === match?.awayTeamId)?.name ?? "?";
  const score = (value: readonly [number, number]) => `${value[0]}–${value[1]}`;
  if (change.next === null) {
    return `${home} vs ${away}: result cleared${change.previous ? ` (was ${score(change.previous)})` : ""}`;
  }
  const base = `${home} ${score(change.next)} ${away}`;
  return change.previous === null ? base : `${base} (was ${score(change.previous)})`;
}
