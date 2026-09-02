import { TournamentProvider } from "@/store/provider";
import { BoardPreview } from "./board-preview";

export default function BoardPage() {
  return (
    <TournamentProvider>
      <BoardPreview />
    </TournamentProvider>
  );
}
