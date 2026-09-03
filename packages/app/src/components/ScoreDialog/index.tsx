"use client";

import { isPlayed, teamById, validateScore, type Match, type Score, type Tournament } from "@bordfodbold/domain";
import { Button, Modal, Notice, NumberInput } from "@bordfodbold/ui";
import { useEffect, useState, type FormEvent } from "react";
import { createBem } from "use-bem";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { SectionHeading } from "@/components/SectionHeading";
import { TeamMark } from "@/components/TeamMark";
import { describeError, formatScore } from "@/lib/format";
import "./styles.scss";

interface ScoreDialogProps {
  tournament: Tournament;
  match: Match | null;
  pending: boolean;
  onSave: (matchId: string, score: Score | null) => Promise<void>;
  onClose: () => void;
}

/**
 * Enter or change one result. Both goal counts are steppers capped at the
 * winning score; the dialog says who wins as you type, refuses an unfinished
 * game, and asks once more before replacing a result already on the board.
 */
const homeInputId = "score-dialog-home-goals";

export function ScoreDialog({ tournament, match, pending, onSave, onClose }: ScoreDialogProps) {
  const bem = createBem("ScoreDialog");
  const [home, setHome] = useState<number | null>(null);
  const [away, setAway] = useState<number | null>(null);
  const [confirmingReplace, setConfirmingReplace] = useState(false);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  useEffect(() => {
    setHome(match?.homeScore ?? null);
    setAway(match?.awayScore ?? null);
    setConfirmingReplace(false);
    setConfirmingClear(false);
    setFailure(null);
  }, [match]);

  if (match === null) {
    return null;
  }
  const homeTeam = teamById(tournament, match.homeTeamId);
  const awayTeam = teamById(tournament, match.awayTeamId);
  if (homeTeam === undefined || awayTeam === undefined) {
    return null;
  }

  const { goalsToWin } = tournament.settings;
  const played = isPlayed(match);
  const complete = home !== null && away !== null;
  const validation = complete ? validateScore([home, away], tournament.settings) : null;
  const unchanged = played && match.homeScore === home && match.awayScore === away;
  const winner = complete && validation?.ok ? (home > away ? homeTeam : awayTeam) : null;
  const recorded = played ? formatScore([match.homeScore, match.awayScore]) : null;

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!complete || validation === null || !validation.ok || unchanged) {
      return;
    }
    if (played && !confirmingReplace) {
      setConfirmingReplace(true);
      return;
    }
    try {
      await onSave(match.id, [home, away]);
      onClose();
    } catch (error) {
      setFailure(describeError(error));
    }
  };

  const clear = async () => {
    setConfirmingClear(false);
    try {
      await onSave(match.id, null);
      onClose();
    } catch (error) {
      setFailure(describeError(error));
    }
  };

  return (
    <Modal open onClose={onClose} label={`Result: ${homeTeam.name} versus ${awayTeam.name}`} width="small" initialFocus={() => document.getElementById(homeInputId)}>
      <form className={bem()} onSubmit={save}>
        <div className={bem("intro")}>
          <SectionHeading as="span" flush>
            {played ? "Change result" : "Enter result"}
          </SectionHeading>
          <h2 className={bem("title")}>First to {goalsToWin}</h2>
        </div>

        <div className={bem("sides")}>
          <ScoreSide bem={bem} team={homeTeam} value={home} max={goalsToWin} onChange={setHome} winner={winner?.id === homeTeam.id} inputId={homeInputId} />
          <span className={bem("versus")} aria-hidden="true">
            –
          </span>
          <ScoreSide bem={bem} team={awayTeam} value={away} max={goalsToWin} onChange={setAway} winner={winner?.id === awayTeam.id} />
        </div>

        <p className={bem("status")} aria-live="polite">
          {!complete && "Enter both scores."}
          {complete && validation !== null && !validation.ok && validation.reason}
          {winner !== null && `${winner.name} wins.`}
        </p>

        {confirmingReplace && (
          <Notice context="warning" title="This replaces a recorded result">
            The board shows {recorded}. Save again to replace it; the change is logged.
          </Notice>
        )}
        {failure !== null && <Notice context="error">{failure}</Notice>}

        <div className={bem("actions")}>
          {played && <Button label="Clear result" variant="plain" color="context-negative" onClick={() => setConfirmingClear(true)} disabled={pending} />}
          <span className={bem("spacer")} />
          <Button label="Cancel" variant="plain" onClick={onClose} />
          <Button
            type="submit"
            label={confirmingReplace ? "Replace result" : "Save result"}
            variant="solid"
            disabled={pending || !complete || validation === null || !validation.ok || unchanged}
          />
        </div>
      </form>
      <ConfirmDialog open={confirmingClear} title="Clear this result?" confirmLabel="Clear result" destructive onCancel={() => setConfirmingClear(false)} onConfirm={clear}>
        {homeTeam.name} {recorded} {awayTeam.name} goes back to unplayed. The change is logged and can be undone.
      </ConfirmDialog>
    </Modal>
  );
}

interface ScoreSideProps {
  bem: ReturnType<typeof createBem>;
  team: Tournament["teams"][number];
  value: number | null;
  max: number;
  winner: boolean;
  onChange: (value: number | null) => void;
  inputId?: string;
}

function ScoreSide({ bem, team, value, max, winner, onChange, inputId }: ScoreSideProps) {
  return (
    <div className={bem("side", { winner })}>
      <TeamMark team={team} />
      <NumberInput stepper min={0} max={max} value={value} onChange={onChange} inputProps={{ id: inputId, "aria-label": `${team.name} goals`, inputMode: "numeric" }} />
      <Button label={`${max}`} variant="soft" size={0.8} onClick={() => onChange(max)} aria-label={`${team.name} wins with ${max}`} />
    </div>
  );
}
