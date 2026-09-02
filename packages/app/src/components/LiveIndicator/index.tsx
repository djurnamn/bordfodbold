"use client";

import { createBem } from "use-bem";

import { relativeTime, useNow } from "@/lib/time";
import "./styles.scss";

interface LiveIndicatorProps {
  updatedAt: string;
}

/** Connected, and how fresh the data is. */
export function LiveIndicator({ updatedAt }: LiveIndicatorProps) {
  const bem = createBem("LiveIndicator");
  const now = useNow();
  return (
    <span className={bem()} role="status">
      <span className={bem("dot")} aria-hidden="true" />
      <span className={bem("label")}>Live</span>
      <span className={bem("updated")}>updated {relativeTime(updatedAt, now)}</span>
    </span>
  );
}
