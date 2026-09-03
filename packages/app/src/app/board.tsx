"use client";

import { createBem } from "use-bem";

import { ActivityFeed } from "@/components/ActivityFeed";
import { ViewHeader } from "@/components/ViewHeader";
import { Leaderboard } from "@/components/Leaderboard";
import { SectionHeading } from "@/components/SectionHeading";
import { TeamLegend } from "@/components/TeamLegend";
import { TournamentGrid } from "@/components/TournamentGrid";
import { useStandings, useTournament } from "@/store/provider";
import "./board.scss";

/** The default view: standings and the plan side by side, teams and history below. */
export function Board() {
  const bem = createBem("Board");
  const tournament = useTournament();
  const standings = useStandings();
  return (
    <div className={bem()}>
      <ViewHeader className={bem("header")} kicker="Signifly · table foosball" title={tournament.name} updatedAt={tournament.updatedAt} />
      <section id="standings" className={bem("panel", { standings: true })} aria-labelledby="standings-heading">
        <SectionHeading id="standings-heading">Leaderboard</SectionHeading>
        <Leaderboard tournament={tournament} standings={standings} />
      </section>
      <section id="plan" className={bem("panel", { plan: true })} aria-labelledby="plan-heading">
        <SectionHeading id="plan-heading">Tournament plan</SectionHeading>
        <TournamentGrid tournament={tournament} />
      </section>
      <section id="teams" className={bem("panel", { teams: true })} aria-labelledby="teams-heading">
        <SectionHeading id="teams-heading">Teams</SectionHeading>
        <TeamLegend teams={tournament.teams} />
      </section>
      <section id="activity" className={bem("panel", { activity: true })} aria-labelledby="activity-heading">
        <SectionHeading id="activity-heading">Latest results</SectionHeading>
        <ActivityFeed tournament={tournament} />
      </section>
    </div>
  );
}
