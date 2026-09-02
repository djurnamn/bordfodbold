import type { TeamColor } from "@bordfodbold/domain";
import type { CSSProperties } from "react";

/** Each team colour is one of the design system's eight accent ordinals. */
const accentOrdinal: Record<TeamColor, string> = {
  violet: "primary",
  green: "secondary",
  magenta: "tertiary",
  yellow: "quaternary",
  blue: "quinary",
  orange: "senary",
  aqua: "septenary",
  coral: "octonary",
};

/** Inline variables a component reads its team colour from. */
export function teamColorStyle(color: TeamColor): CSSProperties {
  const ordinal = accentOrdinal[color];
  return {
    "--team-rgb": `var(--djui-accent-${ordinal}-rgb)`,
    "--team-contrast-rgb": `var(--djui-accent-${ordinal}-contrast-rgb)`,
  };
}

export const teamColorLabels: Record<TeamColor, string> = {
  violet: "Violet",
  green: "Green",
  magenta: "Magenta",
  yellow: "Yellow",
  blue: "Blue",
  orange: "Orange",
  aqua: "Aqua",
  coral: "Coral",
};
