import { notFound, redirect } from "next/navigation";
import { LobbyView } from "@/components/lobby/LobbyView";
import { PageShell } from "@/components/ui/PageShell";
import { getLobby } from "@/lib/games";
import { isGameFinished } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function LobbyPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const lobby = await getLobby(code);

  if (!lobby) {
    notFound();
  }

  if (lobby.game.status === "active" || lobby.game.auction_status === "live") {
    redirect(`/auction/${lobby.game.room_code}`);
  }

  if (isGameFinished(lobby.game)) {
    redirect(`/complete/${lobby.game.room_code}`);
  }

  return (
    <PageShell>
      <LobbyView initialGame={lobby.game} initialPlayers={lobby.players} />
    </PageShell>
  );
}
