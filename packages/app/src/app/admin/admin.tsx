"use client";

import type { Match } from "@bordfodbold/domain";
import { Button, Tab, TabList, TabPanel, Tabs } from "@bordfodbold/ui";
import { useState } from "react";
import { createBem } from "use-bem";

import { ActivityFeed } from "@/components/ActivityFeed";
import { BoardHeader } from "@/components/BoardHeader";
import { ScoreDialog } from "@/components/ScoreDialog";
import { SettingsForm } from "@/components/SettingsForm";
import { TeamList } from "@/components/TeamList";
import { TournamentGrid } from "@/components/TournamentGrid";
import { useTournament, useTournamentCommands } from "@/store/provider";
import "./admin.scss";

/** Results, teams, settings. Every change lands on every screen at once. */
export function Admin() {
  const bem = createBem("Admin");
  const tournament = useTournament();
  const { commands, pending } = useTournamentCommands();
  const [editing, setEditing] = useState<Match | null>(null);
  const lastChange = tournament.activity[0];

  return (
    <div className={bem()}>
      <BoardHeader kicker="Admin · every change goes live" title={tournament.name} updatedAt={tournament.updatedAt} actions={<Button label="Lock" variant="plain" size={0.9} onClick={commands.lock} />} />

      <Tabs defaultValue="results" className={bem("tabs")}>
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
              <Button label={lastChange === undefined ? "Nothing to undo" : "Undo last change"} variant="soft" disabled={lastChange === undefined || pending} onClick={() => void commands.undoLastChange()} />
            </div>
            <h2 className={bem("heading")}>Change log</h2>
            <ActivityFeed tournament={tournament} limit={12} />
          </section>
        </TabPanel>

        <TabPanel value="teams">
          <section className={bem("panel")}>
            <TeamList tournament={tournament} pending={pending} onSave={commands.upsertTeam} onRemove={commands.removeTeam} />
          </section>
        </TabPanel>

        <TabPanel value="settings">
          <section className={bem("panel")}>
            <SettingsForm tournament={tournament} pending={pending} onRename={commands.renameTournament} onUpdateSettings={commands.updateSettings} onReset={commands.reset} onLock={commands.lock} />
          </section>
        </TabPanel>
      </Tabs>

      <ScoreDialog tournament={tournament} match={editing} pending={pending} onSave={commands.setScore} onClose={() => setEditing(null)} />
    </div>
  );
}
