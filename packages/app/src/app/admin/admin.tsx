"use client";

import { undoableChange, type Match } from "@bordfodbold/domain";
import { Button, Tab, TabList, TabPanel, Tabs } from "@bordfodbold/ui";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createBem } from "use-bem";

import { ActivityFeed } from "@/components/ActivityFeed";
import { ViewHeader } from "@/components/ViewHeader";
import { ScoreDialog } from "@/components/ScoreDialog";
import { SectionHeading } from "@/components/SectionHeading";
import { SettingsForm } from "@/components/SettingsForm";
import { TeamList } from "@/components/TeamList";
import { TournamentGrid } from "@/components/TournamentGrid";
import { useTournament, useTournamentCommands } from "@/store/provider";
import "./admin.scss";

const titleId = "admin-title";

/** Results, teams, settings. Every change lands on every screen at once. */
export function Admin() {
  const bem = createBem("Admin");
  const tournament = useTournament();
  const { commands, pending } = useTournamentCommands();
  const router = useRouter();
  // Locking sends the admin back to the board: the PIN gate is for arriving,
  // not for the screen you just left.
  const lock = () => {
    commands.lock();
    router.push("/");
  };
  const [editing, setEditing] = useState<Match | null>(null);
  const undoable = undoableChange(tournament);

  // The gate unmounts on unlock; focus lands on the title so a keyboard
  // user continues from the top of the admin rather than from the page.
  useEffect(() => {
    document.getElementById(titleId)?.focus();
  }, []);

  return (
    <div className={bem()}>
      <ViewHeader className={bem("header")} titleId={titleId} kicker="Admin · manage your tournament" title={tournament.name} updatedAt={tournament.updatedAt} />

      <Tabs defaultValue="results">
        <TabList>
          <Tab value="results">Results</Tab>
          <Tab value="teams">Teams</Tab>
          <Tab value="settings">Settings</Tab>
        </TabList>

        <TabPanel value="results">
          <section className={bem("panel")}>
            <p className={bem("help")}>Tap a cell to enter or change a result. A cell reads from its row team&apos;s side.</p>
            <TournamentGrid tournament={tournament} onSelectMatch={setEditing} />
            <div className={bem("toolbar")}>
              <Button label={undoable === undefined ? "Nothing to undo" : "Undo last change"} variant="soft" disabled={undoable === undefined || pending} onClick={() => commands.undoLastChange().catch(() => undefined)} />
            </div>
            <SectionHeading>Change log</SectionHeading>
            <ActivityFeed tournament={tournament} limit={12} />
          </section>
        </TabPanel>

        <TabPanel value="teams">
          <section className={bem("panel")}>
            <TeamList tournament={tournament} pending={pending} onSave={commands.upsertTeam} onRemove={commands.removeTeam} />
          </section>
        </TabPanel>

        <TabPanel value="settings">
          <section className={bem("panel", { surface: true })}>
            <SettingsForm tournament={tournament} pending={pending} onRename={commands.renameTournament} onUpdateSettings={commands.updateSettings} onReset={commands.reset} onLoadDemoData={commands.loadDemoData} onLock={lock} />
          </section>
        </TabPanel>
      </Tabs>

      <ScoreDialog tournament={tournament} match={editing} pending={pending} onSave={commands.setScore} onClose={() => setEditing(null)} />
    </div>
  );
}
