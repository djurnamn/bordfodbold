"use client";

import { PinGate } from "@/components/PinGate";
import { useTournamentCommands } from "@/store/provider";
import { Admin } from "./admin";

interface AdminGateProps {
  pinHint?: string;
}

/** The PIN stands between everyone and the admin; once proven, the admin view. */
export function AdminGate({ pinHint }: AdminGateProps) {
  const { unlocked, commands } = useTournamentCommands();
  if (!unlocked) {
    return <PinGate onSubmit={commands.unlock} hint={pinHint} />;
  }
  return <Admin />;
}
