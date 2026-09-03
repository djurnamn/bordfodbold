import type { Score } from "@bordfodbold/domain";

export function formatScore(score: Score): string {
  return `${score[0]}–${score[1]}`;
}

/** The message a failure carries, for a notice. */
export function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** The members line under a team: names joined, or the empty note. */
export function formatMembers(members: readonly string[]): string {
  return members.join(" · ") || "No members yet";
}
