"use client";

import { matchesDiscardedBy, type Legs, type Tournament, type TournamentSettings } from "@bordfodbold/domain";
import { Button, Field, Notice, NumberInput, Switch, TextInput } from "@bordfodbold/ui";
import { useEffect, useState, type FormEvent } from "react";
import { createBem } from "use-bem";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { describeError } from "@/lib/format";
import "./styles.scss";

interface SettingsFormProps {
  tournament: Tournament;
  pending: boolean;
  onRename: (name: string) => Promise<void>;
  onUpdateSettings: (settings: Partial<TournamentSettings>) => Promise<void>;
  onReset: () => Promise<void>;
  onLoadDemoData: () => Promise<void>;
  onLock: () => void;
}

/** The tournament's name and rules, a reset to the demo data, and the lock. */
export function SettingsForm({ tournament, pending, onRename, onUpdateSettings, onReset, onLoadDemoData, onLock }: SettingsFormProps) {
  const bem = createBem("SettingsForm");
  const [name, setName] = useState(tournament.name);
  const [goalsToWin, setGoalsToWin] = useState<number | null>(tournament.settings.goalsToWin);
  const [pointsPerWin, setPointsPerWin] = useState<number | null>(tournament.settings.pointsPerWin);
  const [legs, setLegs] = useState<Legs>(tournament.settings.legs);
  const [confirming, setConfirming] = useState<"legs" | "clear" | "demo" | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setName(tournament.name);
    setGoalsToWin(tournament.settings.goalsToWin);
    setPointsPerWin(tournament.settings.pointsPerWin);
    setLegs(tournament.settings.legs);
  }, [tournament]);

  const discardedByLegs = legs < tournament.settings.legs ? matchesDiscardedBy(tournament, { legs }) : [];

  const apply = async () => {
    setFailure(null);
    setSaved(false);
    try {
      if (name.trim() !== tournament.name) {
        await onRename(name);
      }
      if (goalsToWin !== null && pointsPerWin !== null) {
        await onUpdateSettings({ goalsToWin, pointsPerWin, legs });
      }
      setSaved(true);
    } catch (error) {
      setFailure(describeError(error));
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (discardedByLegs.length > 0) {
      setConfirming("legs");
      return;
    }
    void apply();
  };

  return (
    <form className={bem()} onSubmit={submit}>
      <Field label="Tournament name">
        {({ id, className }) => <TextInput id={id} className={className} value={name} onChange={(event) => setName(event.currentTarget.value)} required maxLength={60} />}
      </Field>

      <div className={bem("row")}>
        <Field label="Goals to win" description="A game ends when a team reaches this.">
          {({ id, className, describedBy }) => <NumberInput inputProps={{ id, className, "aria-describedby": describedBy }} stepper min={1} max={99} value={goalsToWin} onChange={setGoalsToWin} />}
        </Field>
        <Field label="Points per win">
          {({ id, className }) => <NumberInput inputProps={{ id, className }} stepper min={1} max={10} value={pointsPerWin} onChange={setPointsPerWin} />}
        </Field>
      </div>

      <Switch
        checked={legs === 2}
        onChange={(checked) => setLegs(checked ? 2 : 1)}
        inlineLabel="Each pairing is played twice"
        description={legs === 2 ? "Home and away: two matches per pairing, the row team hosting." : "Once: the grid's mirrored cells show the same match from each side."}
      />

      {failure !== null && <Notice context="error">{failure}</Notice>}
      {saved && failure === null && <Notice context="success">Settings saved.</Notice>}

      <div className={bem("actions")}>
        <Button type="submit" label="Save settings" variant="solid" disabled={pending || name.trim() === "" || goalsToWin === null || pointsPerWin === null} />
      </div>

      <hr className={bem("rule")} />

      <div className={bem("danger")}>
        <div>
          <h2 className={bem("dangerTitle")}>Start over</h2>
          <p className={bem("dangerText")}>Clears the tournament: every team, result and log entry goes. The name and the rules stay.</p>
        </div>
        <Button label="Clear the tournament" variant="soft" color="context-negative" onClick={() => setConfirming("clear")} disabled={pending} />
      </div>

      <div className={bem("danger")}>
        <div>
          <h2 className={bem("dangerTitle")}>Demo data</h2>
          <p className={bem("dangerText")}>Replaces the tournament with the demo: six teams and a handful of results.</p>
        </div>
        <Button label="Load demo data" variant="soft" onClick={() => setConfirming("demo")} disabled={pending} />
      </div>

      <div className={bem("danger")}>
        <div>
          <h2 className={bem("dangerTitle")}>Lock the admin</h2>
          <p className={bem("dangerText")}>Ask for the PIN again on this device.</p>
        </div>
        <Button label="Lock" variant="soft" onClick={onLock} />
      </div>

      <ConfirmDialog open={confirming === "legs"} title="Play each pairing once?" confirmLabel="Discard and save" destructive onCancel={() => setConfirming(null)} onConfirm={() => { setConfirming(null); void apply(); }}>
        Going back to one leg discards {discardedByLegs.length} recorded second-leg {discardedByLegs.length === 1 ? "result" : "results"}.
      </ConfirmDialog>

      <ConfirmDialog open={confirming === "clear"} title="Clear the tournament?" confirmLabel="Clear" destructive onCancel={() => setConfirming(null)} onConfirm={async () => { setConfirming(null); await onReset(); }}>
        Every team, result and log entry is discarded. This cannot be undone.
      </ConfirmDialog>

      <ConfirmDialog open={confirming === "demo"} title="Load the demo data?" confirmLabel="Load" onCancel={() => setConfirming(null)} onConfirm={async () => { setConfirming(null); await onLoadDemoData(); }}>
        The current teams, results and log are replaced by the demo tournament.
      </ConfirmDialog>
    </form>
  );
}
