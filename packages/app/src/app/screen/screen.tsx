"use client";

import { unplayedMatches } from "@bordfodbold/domain";
import { createBem } from "use-bem";

import { ActivityFeed } from "@/components/ActivityFeed";
import { Leaderboard } from "@/components/Leaderboard";
import { SectionHeading } from "@/components/SectionHeading";
import { TeamLegend } from "@/components/TeamLegend";
import { TeamMark } from "@/components/TeamMark";
import { TournamentGrid } from "@/components/TournamentGrid";
import { ViewHeader } from "@/components/ViewHeader";
import { clockTime, useNow } from "@/lib/time";
import { useStandings, useTournament } from "@/store/provider";
import "./screen.scss";

/**
 * The info-screen view: no chrome, nothing to tap, everything on one 16:9
 * screen at once. Type scales with the viewport so it reads from across the
 * lunch area on a 1080p or a 4K display alike.
 */
export function Screen() {
  const bem = createBem("Screen");
  const tournament = useTournament();
  const standings = useStandings();
  const now = useNow(1000);
  const nextUp = unplayedMatches(tournament).slice(0, 4);
  const leader = standings[0]?.played ? tournament.teams.find((team) => team.id === standings[0]?.teamId) : undefined;

  return (
    <div className={bem()}>
      <ViewHeader
        className={bem("header")}
        kicker="Signifly · table foosball"
        title={tournament.name}
        updatedAt={tournament.updatedAt}
        menu={false}
        aside={
          <time className={bem("clock")} dateTime={new Date(now).toISOString()}>
            {clockTime(new Date(now).toISOString())}
          </time>
        }
      />

      <section className={bem("panel", { standings: true })} aria-label="Leaderboard">
        <SectionHeading>Leaderboard</SectionHeading>
        <Leaderboard tournament={tournament} standings={standings} size="large" />
      </section>

      <section className={bem("panel", { plan: true })} aria-label="Tournament plan">
        <SectionHeading>Tournament plan</SectionHeading>
        <TournamentGrid tournament={tournament} size="large" />
      </section>

      <section className={bem("panel", { teams: true })} aria-label="Teams">
        <SectionHeading>Teams</SectionHeading>
        <TeamLegend teams={tournament.teams} columns={2} density="compact" />
      </section>

      <section className={bem("panel", { next: true })} aria-label="Upcoming games">
        <SectionHeading>Upcoming games</SectionHeading>
        {nextUp.length === 0 ? (
          <p className={bem("done")}>Every match is played. Congratulations{leader ? `, ${leader.name}` : ""}.</p>
        ) : (
          <ul className={bem("nextList")}>
            {nextUp.map((match) => {
              const home = tournament.teams.find((team) => team.id === match.homeTeamId);
              const away = tournament.teams.find((team) => team.id === match.awayTeamId);
              return home && away ? (
                <li key={match.id} className={bem("nextMatch")}>
                  <TeamMark team={home} size="small" wrap />
                  <span className={bem("versus")}>vs</span>
                  <TeamMark team={away} size="small" wrap />
                </li>
              ) : null;
            })}
          </ul>
        )}
      </section>

      <section className={bem("panel", { latest: true })} aria-label="Latest results">
        <SectionHeading>Latest results</SectionHeading>
        <ActivityFeed tournament={tournament} limit={6} density="compact" />
      </section>
    </div>
  );
}
