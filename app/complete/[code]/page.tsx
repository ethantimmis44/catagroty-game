import { redirect } from "next/navigation";
import { PageShell } from "@/components/ui/PageShell";
import { getAuction } from "@/lib/auction";
import { collectionCount } from "@/lib/auctionEngine";
import { formatBudget, formatGameMode } from "@/lib/format";
import { supabase } from "@/lib/supabase";
import { isGameFinished } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CompletePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const auction = await getAuction(code);

  if (!auction) {
    redirect("/");
  }

  if (auction.game.status === "waiting") {
    redirect(`/lobby/${auction.game.room_code}`);
  }

  if (!isGameFinished(auction.game)) {
    redirect(`/auction/${auction.game.room_code}`);
  }

  const itemIds = [...new Set(auction.collections.map((entry) => entry.item_id))];
  const { data: items } = itemIds.length
    ? await supabase.from("items").select("id, name").in("id", itemIds)
    : { data: [] };
  const itemNames = new Map((items ?? []).map((item) => [item.id, item.name]));
  const isDuel = auction.players.length <= 2;

  return (
    <PageShell>
      <div className="w-full max-w-lg text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">
          {auction.category?.name ?? "Auction"}
        </p>
        <h1 className="mt-3 font-display text-4xl text-foreground sm:text-5xl">
          {isDuel ? "Battle Complete" : "Game Complete"}
        </h1>
        {auction.game.challenge ? (
          <p className="mt-3 text-lg text-muted">{auction.game.challenge}</p>
        ) : null}
        <p className="mt-2 text-sm text-muted">
          {formatGameMode(auction.game.mode)} · {formatBudget(auction.game.budget)}
        </p>

        <ul className="mt-8 space-y-4 text-left">
          {auction.players.map((player) => {
            const owned = auction.collections.filter(
              (entry) => entry.player_id === player.id,
            );

            return (
              <li
                key={player.id}
                className="rounded-2xl border border-line bg-surface/80 p-5"
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium text-foreground">{player.player_name}</p>
                  <p className="text-sm text-muted">
                    {formatBudget(player.budget_remaining)} left
                  </p>
                </div>
                <p className="mt-1 text-xs text-muted">
                  {collectionCount(auction.collections, player.id)} /{" "}
                  {auction.listSize} items
                </p>
                <ul className="mt-3 space-y-1 text-sm text-foreground">
                  {owned.length === 0 ? (
                    <li className="text-muted">No items won</li>
                  ) : (
                    owned.map((entry) => (
                      <li key={entry.id}>
                        {itemNames.get(entry.item_id) ?? "Item"} ·{" "}
                        {formatBudget(entry.price_paid ?? entry.price ?? 0)}
                      </li>
                    ))
                  )}
                </ul>
              </li>
            );
          })}
        </ul>

        <p className="mt-8 text-sm text-muted">
          {isDuel
            ? "There is no official winner in 1v1. Publishing comes later."
            : "Player voting and publishing come next."}
        </p>
      </div>
    </PageShell>
  );
}
