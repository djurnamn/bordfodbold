"use client";

import { isPlayed, validateScore, type Match, type Score, type Tournament } from "@bordfodbold/domain";
import { Button, Modal, Notice, NumberInput } from "@bordfodbold/ui";
import { useEffect, useState, type FormEvent } from "react";
import { createBem } from "use-bem";

import { TeamMark } from "@/components/TeamMark";
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
  const homeTeam = tournament.teams.find((team) => team.id === match.homeTeamId);
  const awayTeam = tournament.teams.find((team) => team.id === match.awayTeamId);
  if (homeTeam === undefined || awayTeam === undefined) {
    return null;
  }

  const { goalsToWin } = tournament.settings;
  const played = isPlayed(match);
  const complete = home !== null && away !== null;
  const validation = complete ? validateScore([home, away], tournament.settings) : null;
  const unchanged = played && match.homeScore === home && match.awayScore === away;
  const winner = validation?.ok ? (home! > away! ? homeTeam : awayTeam) : null;

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
      setFailure(error instanceof Error ? error.message : String(error));
    }
  };

  const clear = async () => {
    if (!confirmingClear) {
      setConfirmingClear(true);
      return;
    }
    try {
      await onSave(match.id, null);
      onClose();
    } catch (error) {
      setFailure(error instanceof Error ? error.message : String(error));
    }
  };

  return (
    <Modal open onClose={onClose} label={`Result: ${homeTeam.name} versus ${awayTeam.name}`} width="small">
      <form className={bem()} onSubmit={save}>
        <div className={bem("intro")}>
          <span className={bem("kicker")}>{played ? "Change result" : "Enter result"}</span>
          <h2 className={bem("title")}>First to {goalsToWin}</h2>
        </div>

        <div className={bem("sides")}>
          <ScoreSide bem={bem} team={homeTeam} value={home} max={goalsToWin} onChange={setHome} winner={winner?.id === homeTeam.id} />
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
            The board shows {match.homeScore}–{match.awayScore}. Save again to replace it; the change is logged.
          </Notice>
        )}
        {confirmingClear && (
          <Notice context="warning" title="Clear this result?">
            The match goes back to unplayed. Press Clear again to confirm.
          </Notice>
        )}
        {failure !== null && <Notice context="error">{failure}</Notice>}

        <div className={bem("actions")}>
          {played && <Button label={confirmingClear ? "Clear, I am sure" : "Clear result"} variant="plain" color="context-negative" onClick={clear} disabled={pending} />}
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
}

function ScoreSide({ bem, team, value, max, winner, onChange }: ScoreSideProps) {
  return (
    <div className={bem("side", { winner })}>
      <TeamMark team={team} />
      <NumberInput stepper size={2.25} min={0} max={max} value={value} onChange={onChange} inputProps={{ "aria-label": `${team.name} goals`, inputMode: "numeric" }} />
      <Button label={`${max}`} variant="soft" size={0.8} onClick={() => onChange(max)} aria-label={`${team.name} wins with ${max}`} />
    </div>
  );
}
