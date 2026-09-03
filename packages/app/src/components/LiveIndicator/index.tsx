"use client";

import { createBem } from "use-bem";

import { clockTime, relativeTime, useNow } from "@/lib/time";
import "./styles.scss";

interface LiveIndicatorProps {
  updatedAt: string;
}

/**
 * Connected, and how fresh the data is. The status region carries only the
 * update time, so assistive tech hears a change when the data changes, not
 * every time the relative clock ticks.
 */
export function LiveIndicator({ updatedAt }: LiveIndicatorProps) {
  const bem = createBem("LiveIndicator");
  const now = useNow();
  return (
    <span className={bem()}>
      <span className={bem("dot")} aria-hidden="true" />
      <span className={bem("label")}>Live</span>
      <span className={bem("updated")} aria-hidden="true">
        updated {relativeTime(updatedAt, now)}
      </span>
      <span className={bem("status")} role="status">
        Updated {clockTime(updatedAt)}
      </span>
    </span>
  );
}
