"use client";

import { createBem } from "use-bem";

import { ActivityFeed } from "@/components/ActivityFeed";
import { BoardHeader } from "@/components/BoardHeader";
import { Leaderboard } from "@/components/Leaderboard";
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
      <BoardHeader kicker="Signifly · table foosball" title={tournament.name} updatedAt={tournament.updatedAt} />
      <nav className={bem("jump")} aria-label="Sections">
        <a href="#standings">Standings</a>
        <a href="#plan">Plan</a>
        <a href="#teams">Teams</a>
        <a href="#activity">Activity</a>
      </nav>
      <section id="standings" className={bem("panel", { standings: true })} aria-labelledby="standings-heading">
        <h2 id="standings-heading" className={bem("heading")}>
          Leaderboard
        </h2>
        <Leaderboard tournament={tournament} standings={standings} />
      </section>
      <section id="plan" className={bem("panel", { plan: true })} aria-labelledby="plan-heading">
        <h2 id="plan-heading" className={bem("heading")}>
          Tournament plan
        </h2>
        <TournamentGrid tournament={tournament} />
      </section>
      <section id="teams" className={bem("panel", { teams: true })} aria-labelledby="teams-heading">
        <h2 id="teams-heading" className={bem("heading")}>
          Teams
        </h2>
        <TeamLegend teams={tournament.teams} />
      </section>
      <section id="activity" className={bem("panel", { activity: true })} aria-labelledby="activity-heading">
        <h2 id="activity-heading" className={bem("heading")}>
          Latest results
        </h2>
        <ActivityFeed tournament={tournament} />
      </section>
    </div>
  );
}
