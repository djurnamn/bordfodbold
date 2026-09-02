"use client";

import { unplayedMatches } from "@bordfodbold/domain";
import { createBem } from "use-bem";

import { ActivityFeed } from "@/components/ActivityFeed";
import { Leaderboard } from "@/components/Leaderboard";
import { LiveIndicator } from "@/components/LiveIndicator";
import { TeamLegend } from "@/components/TeamLegend";
import { TeamMark } from "@/components/TeamMark";
import { TournamentGrid } from "@/components/TournamentGrid";
import { useNow } from "@/lib/time";
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
      <header className={bem("header")}>
        <div className={bem("titles")}>
          <span className={bem("kicker")}>Signifly · table foosball</span>
          <h1 className={bem("title")}>{tournament.name}</h1>
        </div>
        {leader !== undefined && (
          <div className={bem("leader")}>
            <span className={bem("leaderLabel")}>In the lead</span>
            <TeamMark team={leader} size="large" />
          </div>
        )}
        <div className={bem("status")}>
          <time className={bem("clock")} dateTime={new Date(now).toISOString()}>
            {new Date(now).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" })}
          </time>
          <LiveIndicator updatedAt={tournament.updatedAt} />
        </div>
      </header>

      <section className={bem("panel", { standings: true })} aria-label="Leaderboard">
        <h2 className={bem("heading")}>Leaderboard</h2>
        <Leaderboard tournament={tournament} standings={standings} compact />
      </section>

      <section className={bem("panel", { plan: true })} aria-label="Tournament plan">
        <h2 className={bem("heading")}>Tournament plan</h2>
        <TournamentGrid tournament={tournament} compact />
      </section>

      <section className={bem("panel", { teams: true })} aria-label="Teams">
        <h2 className={bem("heading")}>Teams</h2>
        <TeamLegend teams={tournament.teams} />
      </section>

      <section className={bem("panel", { next: true })} aria-label="Still to play">
        <h2 className={bem("heading")}>Still to play</h2>
        {nextUp.length === 0 ? (
          <p className={bem("done")}>Every match is played. Congratulations{leader ? `, ${leader.name}` : ""}.</p>
        ) : (
          <ul className={bem("nextList")}>
            {nextUp.map((match) => {
              const home = tournament.teams.find((team) => team.id === match.homeTeamId);
              const away = tournament.teams.find((team) => team.id === match.awayTeamId);
              return home && away ? (
                <li key={match.id} className={bem("nextMatch")}>
                  <TeamMark team={home} size="small" />
                  <span className={bem("versus")}>vs</span>
                  <TeamMark team={away} size="small" />
                </li>
              ) : null;
            })}
          </ul>
        )}
      </section>

      <section className={bem("panel", { latest: true })} aria-label="Latest results">
        <h2 className={bem("heading")}>Latest results</h2>
        <ActivityFeed tournament={tournament} limit={4} />
      </section>
    </div>
  );
}
