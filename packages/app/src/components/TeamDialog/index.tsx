"use client";

import { teamColors, type Team, type TeamColor } from "@bordfodbold/domain";
import { Button, Field, Modal, Notice, Repeater, TextInput, type RepeaterRow } from "@bordfodbold/ui";
import { useEffect, useState, type FormEvent } from "react";
import { createBem } from "use-bem";

import { emblems } from "@/lib/emblems";
import { teamColorLabels, teamColorStyle } from "@/lib/team-color";
import "./styles.scss";

interface TeamDialogProps {
  /** The team to edit, or a fresh one to create. */
  team: Team | null;
  creating: boolean;
  pending: boolean;
  onSave: (team: Team) => Promise<void>;
  onClose: () => void;
}

const maximumMembers = 4;

/** Name, members, color and emblem. Everything a team is recognized by. */
export function TeamDialog({ team, creating, pending, onSave, onClose }: TeamDialogProps) {
  const bem = createBem("TeamDialog");
  const [draft, setDraft] = useState<Team | null>(team);
  const [failure, setFailure] = useState<string | null>(null);

  useEffect(() => {
    setDraft(team);
    setFailure(null);
  }, [team]);

  if (draft === null) {
    return null;
  }

  const update = (patch: Partial<Team>) => setDraft((current) => (current === null ? null : { ...current, ...patch }));
  const memberRows: RepeaterRow[] = draft.members.map((name, index) => ({ id: `member-${index}`, name }));

  const save = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await onSave({ ...draft, members: draft.members.filter((member) => member.trim() !== "") });
      onClose();
    } catch (error) {
      setFailure(error instanceof Error ? error.message : String(error));
    }
  };

  return (
    <Modal open onClose={onClose} label={creating ? "New team" : `Edit ${team?.name ?? "team"}`} width="small">
      <form className={bem()} onSubmit={save}>
        <h2 className={bem("title")}>{creating ? "New team" : "Edit team"}</h2>

        <Field label="Team name">
          {({ id, className, describedBy }) => (
            <TextInput id={id} className={className} aria-describedby={describedBy} value={draft.name} onChange={(event) => update({ name: event.currentTarget.value })} autoFocus={creating} required maxLength={40} />
          )}
        </Field>

        <Field label="Members" grouped>
          <Repeater
            value={memberRows}
            onChange={(rows) => update({ members: rows.map((row) => String(row.name ?? "")) })}
            columns={[{ key: "name", label: "Member" }]}
            renderCell={(_column, row, _index, setField, controlProps) => (
              <TextInput {...controlProps} value={String(row.name ?? "")} placeholder="Name" maxLength={40} onChange={(event) => setField("name", event.currentTarget.value)} />
            )}
            hideHeader
            variant="segmented"
            separators="rows"
            maxRows={maximumMembers}
            translations={{ add: "Add member", removeRow: "Remove member" }}
          />
        </Field>

        <Field label="Color" grouped>
          {({ labelledBy }) => (
          <div className={bem("swatches")} role="radiogroup" aria-labelledby={labelledBy}>
            {teamColors.map((color: TeamColor) => (
              <button
                key={color}
                type="button"
                role="radio"
                aria-checked={draft.color === color}
                aria-label={teamColorLabels[color]}
                className={bem("swatch", { selected: draft.color === color })}
                style={teamColorStyle(color)}
                onClick={() => update({ color })}
              />
            ))}
          </div>
          )}
        </Field>

        <Field label="Emblem" grouped>
          {({ labelledBy }) => (
          <div className={bem("emblems")} role="radiogroup" aria-labelledby={labelledBy}>
            {emblems.map((emblem) => (
              <button key={emblem} type="button" role="radio" aria-checked={draft.emblem === emblem} aria-label={emblem} className={bem("emblem", { selected: draft.emblem === emblem })} onClick={() => update({ emblem })}>
                {emblem}
              </button>
            ))}
          </div>
          )}
        </Field>

        {failure !== null && <Notice context="error">{failure}</Notice>}

        <div className={bem("actions")}>
          <Button label="Cancel" variant="plain" onClick={onClose} />
          <Button type="submit" label={creating ? "Add team" : "Save team"} variant="solid" disabled={pending || draft.name.trim() === ""} />
        </div>
      </form>
    </Modal>
  );
}
