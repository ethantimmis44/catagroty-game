import { JoinGameForm } from "@/components/join/JoinGameForm";
import { GameFormCard } from "@/components/ui/GameFormCard";
import { PageShell } from "@/components/ui/PageShell";

export default function JoinGamePage() {
  return (
    <PageShell>
      <GameFormCard
        eyebrow="Join"
        title="Join Game"
        description="Enter the 6-character room code and the name the table will see."
      >
        <JoinGameForm />
      </GameFormCard>
    </PageShell>
  );
}
