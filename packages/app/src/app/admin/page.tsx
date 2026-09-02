import { TournamentProvider } from "@/store/provider";
import { AdminGate } from "./admin-gate";

export default function AdminPage() {
  return (
    <TournamentProvider>
      <AdminGate pinHint={process.env.NEXT_PUBLIC_ADMIN_PIN_HINT} />
    </TournamentProvider>
  );
}
