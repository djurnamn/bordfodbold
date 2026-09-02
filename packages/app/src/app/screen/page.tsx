import { TournamentProvider } from "@/store/provider";
import { Screen } from "./screen";

export default function ScreenPage() {
  return (
    <TournamentProvider>
      <Screen />
    </TournamentProvider>
  );
}
