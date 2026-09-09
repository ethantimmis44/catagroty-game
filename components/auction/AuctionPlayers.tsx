"use client";

import { formatBudget } from "@/lib/format";
import { collectionCount } from "@/lib/auctionEngine";
import type { Collection, GamePlayer } from "@/lib/types";

type AuctionPlayersProps = {
  players: GamePlayer[];
  collections: Collection[];
  listSize: number;
  currentBidderId: string | null;
  highestBidderId: string | null;
  playerId: string | null;
  passedIds: string[];
};

export function AuctionPlayers({
  players,
  collections,
  listSize,
  currentBidderId,
  highestBidderId,
  playerId,
  passedIds,
}: AuctionPlayersProps) {
  const passed = new Set(passedIds);

  return (
    <ul className="mt-4 divide-y divide-line rounded-xl border border-line">
      {players.map((player, index) => {
        const collected = collectionCount(collections, player.id);
        const isTurn = player.id === currentBidderId;

        return (
          <li
            key={player.id}
            className={`px-4 py-3 ${isTurn ? "bg-gold/10" : ""}`}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-foreground">
                {player.player_name}
                {index === 0 ? (
                  <span className="ml-2 text-xs font-semibold uppercase tracking-wide text-gold">
                    Host
                  </span>
                ) : null}
                {player.id === playerId ? (
                  <span className="ml-2 text-xs text-muted">(you)</span>
                ) : null}
              </span>
              <span className="text-sm font-medium text-foreground">
                {formatBudget(player.budget_remaining)}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-muted">
              <span>
                {collected} / {listSize} items
                {collected >= listSize ? " · finished" : ""}
                {player.id === highestBidderId ? " · highest bid" : ""}
                {passed.has(player.id) ? " · passed" : ""}
              </span>
              {isTurn ? (
                <span className="font-semibold uppercase tracking-wide text-gold">
                  {player.id === playerId ? "Your turn" : `${player.player_name}'s turn`}
                </span>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
