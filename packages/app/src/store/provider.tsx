"use client";

import {
  computeStandings,
  type Score,
  type StandingRow,
  type Team,
  type Tournament,
  type TournamentSettings,
} from "@bordfodbold/domain";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { Notice } from "@bordfodbold/ui";
import { createBem } from "use-bem";

import { describeError } from "@/lib/format";
import { createStore } from "./index";
import type { TournamentStore } from "./types";
import "./provider.scss";

export interface TournamentCommands {
  unlock(pin: string): Promise<boolean>;
  lock(): void;
  setScore(matchId: string, score: Score | null): Promise<void>;
  undoLastChange(): Promise<void>;
  upsertTeam(team: Team): Promise<void>;
  removeTeam(teamId: string): Promise<void>;
  updateSettings(settings: Partial<TournamentSettings>): Promise<void>;
  renameTournament(name: string): Promise<void>;
  reset(): Promise<void>;
  loadDemoData(): Promise<void>;
}

interface TournamentContextValue {
  tournament: Tournament;
  standings: StandingRow[];
  unlocked: boolean;
  /** A command is in flight. */
  pending: boolean;
  /** The last command's failure, cleared by the next success. */
  error: string | null;
  commands: TournamentCommands;
}

const TournamentContext = createContext<TournamentContextValue | null>(null);

interface TournamentProviderProps {
  /** For tests and previews; the app creates its configured store. */
  store?: TournamentStore;
  /** What to render until the store has loaded. */
  fallback?: ReactNode;
  children: ReactNode;
}

export function TournamentProvider({ store: givenStore, fallback = null, children }: TournamentProviderProps) {
  const bem = createBem("TournamentProvider");
  const storeRef = useRef<TournamentStore | null>(givenStore ?? null);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loadFailure, setLoadFailure] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  // Commands in flight; two overlapping ones must not clear each other.
  const [inFlight, setInFlight] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // The provider owns the store it creates and closes it on unmount; a
    // given store is the caller's. Development mounts twice, so a closed
    // store is never reused: the next run creates a fresh one.
    const owned = givenStore === undefined;
    const store = storeRef.current ?? createStore();
    storeRef.current = store;
    let active = true;
    const unsubscribe = store.subscribe((next) => {
      if (active) {
        setTournament(next);
      }
    });
    store
      .load()
      .then(async (loaded) => {
        if (!active) {
          return;
        }
        // An admin who reloads stays unlocked for the tab's lifetime; the
        // remembered PIN is checked before anything renders, so the gate
        // never flashes on a reload.
        const remembered = readRememberedPin();
        if (remembered !== null && (await store.unlock(remembered)) && active) {
          setUnlocked(true);
        }
        if (active) {
          setTournament(loaded);
        }
      })
      .catch((failure: unknown) => {
        if (active) {
          setLoadFailure(describeError(failure));
        }
      });
    return () => {
      active = false;
      unsubscribe();
      if (owned) {
        store.close?.();
        storeRef.current = null;
      }
    };
  }, [givenStore]);

  const run = useCallback(async (command: (store: TournamentStore) => Promise<void>) => {
    const store = storeRef.current;
    if (store === null) {
      return;
    }
    setInFlight((count) => count + 1);
    try {
      await command(store);
      setError(null);
    } catch (failure) {
      setError(describeError(failure));
      throw failure;
    } finally {
      setInFlight((count) => count - 1);
    }
  }, []);

  const commands = useMemo<TournamentCommands>(
    () => ({
      unlock: async (pin) => {
        const store = storeRef.current;
        const ok = store === null ? false : await store.unlock(pin);
        setUnlocked(ok);
        rememberPin(ok ? pin : null);
        return ok;
      },
      lock: () => {
        storeRef.current?.lock();
        setUnlocked(false);
        rememberPin(null);
      },
      setScore: (matchId, score) => run((store) => store.setScore(matchId, score)),
      undoLastChange: () => run((store) => store.undoLastChange()),
      upsertTeam: (team) => run((store) => store.upsertTeam(team)),
      removeTeam: (teamId) => run((store) => store.removeTeam(teamId)),
      updateSettings: (settings) => run((store) => store.updateSettings(settings)),
      renameTournament: (name) => run((store) => store.renameTournament(name)),
      reset: () => run((store) => store.reset()),
      loadDemoData: () => run((store) => store.loadDemoData()),
    }),
    [run],
  );

  const standings = useMemo(() => (tournament === null ? [] : computeStandings(tournament)), [tournament]);

  if (loadFailure !== null) {
    return (
      <div className={bem("failure")} role="alert">
        <Notice context="error" title="The tournament could not be loaded">
          {loadFailure}
        </Notice>
      </div>
    );
  }

  if (tournament === null) {
    return <>{fallback}</>;
  }

  return (
    <TournamentContext.Provider value={{ tournament, standings, unlocked, pending: inFlight > 0, error, commands }}>
      {children}
    </TournamentContext.Provider>
  );
}

function useTournamentContext(): TournamentContextValue {
  const value = useContext(TournamentContext);
  if (value === null) {
    throw new Error("useTournament and friends need a TournamentProvider above them.");
  }
  return value;
}

export function useTournament(): Tournament {
  return useTournamentContext().tournament;
}

export function useStandings(): StandingRow[] {
  return useTournamentContext().standings;
}

export function useTournamentCommands(): Pick<TournamentContextValue, "commands" | "unlocked" | "pending" | "error"> {
  const { commands, unlocked, pending, error } = useTournamentContext();
  return { commands, unlocked, pending, error };
}

const rememberedPinKey = "bordfodbold:admin-pin";

function readRememberedPin(): string | null {
  try {
    return window.sessionStorage.getItem(rememberedPinKey);
  } catch {
    return null;
  }
}

function rememberPin(pin: string | null): void {
  try {
    if (pin === null) {
      window.sessionStorage.removeItem(rememberedPinKey);
    } else {
      window.sessionStorage.setItem(rememberedPinKey, pin);
    }
  } catch {
    // Storage can be unavailable; the admin then re-enters the PIN on reload.
  }
}
