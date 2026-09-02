import type { Team } from "@bordfodbold/domain";
import type { ComponentPropsWithRef } from "react";
import { createBem } from "use-bem";

import { teamColorStyle } from "@/lib/team-color";
import "./styles.scss";

interface TeamMarkProps extends ComponentPropsWithRef<"span"> {
  team: Team;
  size?: "small" | "medium" | "large";
  /** Hide the name and keep the colored emblem. */
  emblemOnly?: boolean;
  /** Keep the name on wide viewports and drop it below the named band. */
  hideNameBelow?: "small";
  /** Which side of the name the emblem sits on. */
  emblemPosition?: "start" | "end";
}

/** A team's identity in one glance: its color, its emblem, its name. */
export function TeamMark({ team, size = "medium", emblemOnly = false, hideNameBelow, emblemPosition = "start", className, style, ...rest }: TeamMarkProps) {
  const bem = createBem("TeamMark");
  return (
    <span
      {...rest}
      className={[bem(undefined, { [size]: true, emblemOnly, emblemEnd: emblemPosition === "end", [`hideNameBelow-${hideNameBelow}`]: hideNameBelow !== undefined }), className].filter(Boolean).join(" ")}
      style={{ ...teamColorStyle(team.color), ...style }}
      title={emblemOnly ? team.name : undefined}
    >
      <span className={bem("emblem")} aria-hidden="true">
        {team.emblem}
      </span>
      <span className={bem("name", { hidden: emblemOnly })}>{team.name}</span>
    </span>
  );
}
