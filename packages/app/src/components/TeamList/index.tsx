"use client";

import { matchesDiscardedBy, maximumTeams, nextFreeColor, type Team, type Tournament } from "@bordfodbold/domain";
import { Button } from "@bordfodbold/ui";
import { useState } from "react";
import { createBem } from "use-bem";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { TeamDialog } from "@/components/TeamDialog";
import { TeamMark } from "@/components/TeamMark";
import { newTeamId } from "@/lib/ids";
import "./styles.scss";

interface TeamListProps {
  tournament: Tournament;
  pending: boolean;
  onSave: (team: Team) => Promise<void>;
  onRemove: (teamId: string) => Promise<void>;
}

/** The teams, each editable; add up to eight, remove with a warning about lost results. */
export function TeamList({ tournament, pending, onSave, onRemove }: TeamListProps) {
  const bem = createBem("TeamList");
  const [editing, setEditing] = useState<{ team: Team; creating: boolean } | null>(null);
  const [removing, setRemoving] = useState<Team | null>(null);
  const full = tournament.teams.length >= maximumTeams;

  const startCreating = () =>
    setEditing({
      creating: true,
      team: { id: newTeamId(), name: "", members: ["", ""], color: nextFreeColor(tournament), emblem: "⚽" },
    });

  const discarded = removing === null ? [] : matchesDiscardedBy(tournament, { teamIds: tournament.teams.filter((team) => team.id !== removing.id).map((team) => team.id) });

  return (
    <div className={bem()}>
      {tournament.teams.length === 0 && <p className={bem("empty")}>No teams yet. Add the first one below.</p>}
      {tournament.teams.length > 0 && (
      <div className={bem("frame")} data-djui-next-surface="">
      <ul className={bem("teams")}>
        {tournament.teams.map((team) => (
          <li key={team.id} className={bem("team")} data-djui-next-surface="">
            <span className={bem("mark")}>
              <TeamMark team={team} size="large" />
            </span>
            <span className={bem("members")}>{team.members.join(" · ") || "No members yet"}</span>
            <span className={bem("teamActions")}>
              <Button label="Edit" variant="soft" size={0.85} onClick={() => setEditing({ team, creating: false })} />
              <Button label="Remove" variant="plain" size={0.85} color="context-negative" onClick={() => setRemoving(team)} />
            </span>
          </li>
        ))}
      </ul>
      </div>
      )}
      <div className={bem("footer")}>
        <span className={bem("count")}>
          {tournament.teams.length} of {maximumTeams} teams
        </span>
        <Button label="Add team" variant="solid" onClick={startCreating} disabled={full || pending} />
      </div>

      <TeamDialog team={editing?.team ?? null} creating={editing?.creating ?? false} pending={pending} onSave={onSave} onClose={() => setEditing(null)} />

      <ConfirmDialog
        open={removing !== null}
        title={`Remove ${removing?.name ?? ""}?`}
        confirmLabel="Remove team"
        destructive
        onCancel={() => setRemoving(null)}
        onConfirm={async () => {
          if (removing !== null) {
            await onRemove(removing.id);
          }
          setRemoving(null);
        }}
      >
        {discarded.length === 0
          ? "The team has no results yet; its pairings are dropped from the plan."
          : `This also discards ${discarded.length} recorded ${discarded.length === 1 ? "result" : "results"} the team was part of, and the leaderboard changes.`}
      </ConfirmDialog>
    </div>
  );
}
