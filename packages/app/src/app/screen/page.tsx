import type { Metadata } from "next";

import { TournamentProvider } from "@/store/provider";
import { Screen } from "./screen";

export const metadata: Metadata = { title: "Screen · Bordfodbold" };

export default function ScreenPage() {
  return (
    <TournamentProvider>
      <Screen />
    </TournamentProvider>
  );
}
