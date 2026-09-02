"use client";

import { teamColors, type Team, type TeamColor } from "@bordfodbold/domain";
import { Button, Field, Modal, Notice, TextInput } from "@bordfodbold/ui";
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

/** Name, members, colour and emblem. Everything a team is recognised by. */
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
  const setMember = (index: number, value: string) =>
    update({ members: draft.members.map((member, candidate) => (candidate === index ? value : member)) });

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

        <fieldset className={bem("group")}>
          <legend className={bem("legend")}>Members</legend>
          <div className={bem("members")}>
            {draft.members.map((member, index) => (
              <div key={index} className={bem("member")}>
                <TextInput value={member} placeholder={`Member ${index + 1}`} aria-label={`Member ${index + 1}`} onChange={(event) => setMember(index, event.currentTarget.value)} maxLength={40} />
                <Button label="Remove" variant="plain" size={0.8} onClick={() => update({ members: draft.members.filter((_, candidate) => candidate !== index) })} />
              </div>
            ))}
            {draft.members.length < maximumMembers && (
              <Button label="Add member" variant="soft" size={0.9} onClick={() => update({ members: [...draft.members, ""] })} />
            )}
          </div>
        </fieldset>

        <fieldset className={bem("group")}>
          <legend className={bem("legend")}>Colour</legend>
          <div className={bem("swatches")} role="radiogroup" aria-label="Team colour">
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
        </fieldset>

        <fieldset className={bem("group")}>
          <legend className={bem("legend")}>Emblem</legend>
          <div className={bem("emblems")} role="radiogroup" aria-label="Team emblem">
            {emblems.map((emblem) => (
              <button key={emblem} type="button" role="radio" aria-checked={draft.emblem === emblem} aria-label={emblem} className={bem("emblem", { selected: draft.emblem === emblem })} onClick={() => update({ emblem })}>
                {emblem}
              </button>
            ))}
          </div>
          <Field label="Or any emoji" grouped>
            {({ id, className }) => <TextInput id={id} className={className} value={draft.emblem} maxLength={4} size={1} onChange={(event) => update({ emblem: event.currentTarget.value.trim() || "⚽" })} />}
          </Field>
        </fieldset>

        {failure !== null && <Notice context="error">{failure}</Notice>}

        <div className={bem("actions")}>
          <Button label="Cancel" variant="plain" onClick={onClose} />
          <Button type="submit" label={creating ? "Add team" : "Save team"} variant="solid" disabled={pending || draft.name.trim() === ""} />
        </div>
      </form>
    </Modal>
  );
}
