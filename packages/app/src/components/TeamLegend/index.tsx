import type { Team } from "@bordfodbold/domain";
import { createBem } from "use-bem";

import { TeamMark } from "@/components/TeamMark";
import "./styles.scss";

interface TeamLegendProps {
  teams: Team[];
}

/** Every team with its members: who is actually at the table. */
export function TeamLegend({ teams }: TeamLegendProps) {
  const bem = createBem("TeamLegend");
  return (
    <ul className={bem()}>
      {teams.map((team) => (
        <li key={team.id} className={bem("team")}>
          <TeamMark team={team} />
          <span className={bem("members")}>{team.members.join(" · ") || "No members yet"}</span>
        </li>
      ))}
    </ul>
  );
}
