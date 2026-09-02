import type { Team } from "@bordfodbold/domain";
import type { ComponentPropsWithRef } from "react";
import { createBem } from "use-bem";

import { teamColorStyle } from "@/lib/team-color";
import "./styles.scss";

interface TeamMarkProps extends ComponentPropsWithRef<"span"> {
  team: Team;
  size?: "small" | "medium" | "large";
  /** Hide the name and keep the coloured emblem. */
  emblemOnly?: boolean;
}

/** A team's identity in one glance: its colour, its emblem, its name. */
export function TeamMark({ team, size = "medium", emblemOnly = false, className, style, ...rest }: TeamMarkProps) {
  const bem = createBem("TeamMark");
  return (
    <span
      {...rest}
      className={[bem(undefined, { [size]: true, emblemOnly }), className].filter(Boolean).join(" ")}
      style={{ ...teamColorStyle(team.color), ...style }}
      title={emblemOnly ? team.name : undefined}
    >
      <span className={bem("emblem")} aria-hidden="true">
        {team.emblem}
      </span>
      <span className={emblemOnly ? bem("name", { hidden: true }) : bem("name")}>{team.name}</span>
    </span>
  );
}
