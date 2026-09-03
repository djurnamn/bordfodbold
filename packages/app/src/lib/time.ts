import { useEffect, useState } from "react";

/** "just now", "4 min ago", "2 h ago", or a date for anything older. */
export function relativeTime(isoTimestamp: string, now: number = Date.now()): string {
  const seconds = Math.round((now - new Date(isoTimestamp).getTime()) / 1000);
  if (seconds < 45) {
    return "just now";
  }
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes} min ago`;
  }
  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `${hours} h ago`;
  }
  return new Date(isoTimestamp).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export function clockTime(isoTimestamp: string): string {
  return new Date(isoTimestamp).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
}

/** A `Date.now()` that re-renders the caller every `intervalMilliseconds`. */
export function useNow(intervalMilliseconds = 30_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMilliseconds);
    return () => clearInterval(timer);
  }, [intervalMilliseconds]);
  return now;
}
