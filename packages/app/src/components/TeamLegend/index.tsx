import type { Team } from "@bordfodbold/domain";
import { createBem } from "use-bem";

import { EmptyState } from "@/components/EmptyState";
import { TeamMark } from "@/components/TeamMark";
import { formatMembers } from "@/lib/format";
import "./styles.scss";

interface TeamLegendProps {
  teams: Team[];
  /** Column count; `responsive` is two columns from the small band up, one below. */
  columns?: 1 | 2 | "responsive";
  density?: "default" | "compact";
}

/** Every team with its members: who is actually at the table. */
export function TeamLegend({ teams, columns = "responsive", density = "default" }: TeamLegendProps) {
  const bem = createBem("TeamLegend");
  if (teams.length === 0) {
    return <EmptyState>No teams yet.</EmptyState>;
  }
  return (
    <div className={bem(undefined, { [`columns-${columns}`]: true, [density]: true })} data-djui-next-surface="">
      <ul className={bem("list")}>
        {teams.map((team) => (
          <li key={team.id} className={bem("team")} data-djui-next-surface="">
            <TeamMark team={team} />
            <span className={bem("members")}>{formatMembers(team.members)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
