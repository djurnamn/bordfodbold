/** A short id for a new team: readable in match ids, unique enough for a tournament. */
export function newTeamId(): string {
  return `team-${Math.random().toString(36).slice(2, 8)}`;
}
