"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getAuctionAction,
  passTurnAction,
  placeBidAction,
  resolveExpiredTurnAction,
} from "@/app/actions/auction";
import { AuctionPlayers } from "@/components/auction/AuctionPlayers";
import { AuctionTimer } from "@/components/auction/AuctionTimer";
import { BidControls } from "@/components/auction/BidControls";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import type { AuctionState } from "@/lib/auction";
import {
  deadlineReached,
  nextBidAmount,
  playerHasFullList,
} from "@/lib/auctionEngine";
import { ItemVisual } from "@/components/ui/ItemVisual";
import { formatBudget } from "@/lib/format";
import { getPlayerId, savePlayerId } from "@/lib/playerSession";
import { supabase } from "@/lib/supabase";
import { isGameFinished } from "@/lib/types";

type AuctionScreenProps = {
  initialState: AuctionState;
};

export function AuctionScreen({ initialState }: AuctionScreenProps) {
  const router = useRouter();
  const [state, setState] = useState(initialState);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const expireLock = useRef(false);

  const roomCode = state.game.room_code;
  const live = state.game.auction_status === "live" && Boolean(state.item);
  const isMyTurn = Boolean(
    playerId && playerId === state.game.current_bidder_id,
  );
  const currentPlayer = state.players.find((player) => player.id === playerId);
  const currentBid = state.game.current_bid ?? 0;
  const opening = state.phase === "opening";
  const openingBid = Boolean(opening && isMyTurn);
  const passed = Boolean(playerId && state.passedIds.includes(playerId));
  const fullList = Boolean(
    playerId &&
      playerHasFullList(playerId, state.collections, state.listSize),
  );
  const expired = deadlineReached(state.game.bid_deadline);
  const canAffordNext = Boolean(
    currentPlayer &&
      currentPlayer.budget_remaining >= nextBidAmount(currentBid),
  );
  const canAct = Boolean(
    live &&
      isMyTurn &&
      currentPlayer &&
      !passed &&
      !fullList &&
      !expired,
  );

  const refresh = useCallback(async () => {
    const next = await getAuctionAction(roomCode);
    if (!next) {
      return;
    }
    setState(next);
    if (isGameFinished(next.game)) {
      router.replace(`/complete/${next.game.room_code}`);
    }
  }, [roomCode, router]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get("player");
    if (fromQuery) {
      savePlayerId(roomCode, fromQuery);
      window.history.replaceState({}, "", window.location.pathname);
    }
    setPlayerId(getPlayerId(roomCode) ?? fromQuery);
  }, [roomCode]);

  useEffect(() => {
    if (isGameFinished(state.game)) {
      router.replace(`/complete/${state.game.room_code}`);
    }
  }, [
    router,
    state.game.auction_status,
    state.game.room_code,
    state.game.status,
  ]);

  useEffect(() => {
    const channel = supabase
      .channel(`auction:${state.game.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "games",
          filter: `id=eq.${state.game.id}`,
        },
        () => {
          void refresh();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_players",
          filter: `game_id=eq.${state.game.id}`,
        },
        () => {
          void refresh();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bids",
          filter: `game_id=eq.${state.game.id}`,
        },
        () => {
          void refresh();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "collections",
          filter: `game_id=eq.${state.game.id}`,
        },
        () => {
          void refresh();
        },
      )
      .subscribe();

    const poll = window.setInterval(() => {
      void refresh();
    }, 2000);

    return () => {
      window.clearInterval(poll);
      void supabase.removeChannel(channel);
    };
  }, [refresh, state.game.id]);

  const handleExpire = useCallback(() => {
    if (expireLock.current || !live) {
      return;
    }
    expireLock.current = true;
    void resolveExpiredTurnAction(roomCode)
      .then((result) => {
        if (!result.ok && result.error) {
          console.error("[auction] expire", result.error);
          setError("Something went wrong. Please try again.");
        }
        return refresh();
      })
      .catch((err: unknown) => {
        console.error("[auction] expire", err);
        setError("Something went wrong. Please try again.");
      })
      .finally(() => {
        expireLock.current = false;
      });
  }, [live, refresh, roomCode]);

  async function handleBid(amount: number) {
    if (!playerId) {
      throw new Error("Could not identify you. Rejoin the room.");
    }
    setError(null);
    const result = await placeBidAction(roomCode, playerId, amount);
    if (!result.ok) {
      setError(result.error ?? "Bid rejected.");
      throw new Error(result.error ?? "Bid rejected.");
    }
    await refresh();
  }

  async function handlePass() {
    if (!playerId) {
      throw new Error("Could not identify you. Rejoin the room.");
    }
    setError(null);
    const result = await passTurnAction(roomCode, playerId);
    if (!result.ok) {
      setError(result.error ?? "Pass rejected.");
      throw new Error(result.error ?? "Pass rejected.");
    }
    await refresh();
  }

  if (!live) {
    return (
      <div className="w-full max-w-lg text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">
          Auction about to begin
        </p>
        <p className="mt-4 text-muted">Setting the first lot...</p>
        <ErrorBanner message={error} />
      </div>
    );
  }

  const turnLabel = !state.currentBidder
    ? "Waiting..."
    : isMyTurn
      ? "Your turn"
      : `${state.currentBidder.player_name}'s turn`;

  let disabledReason: string | null = null;
  if (!playerId || !currentPlayer) {
    disabledReason =
      "This browser is not identified as a player in this room. Rejoin from the join page.";
  } else if (!isMyTurn) {
    disabledReason = `Waiting for ${state.currentBidder?.player_name ?? "the current bidder"}.`;
  } else if (passed) {
    disabledReason = "You have passed this item.";
  } else if (fullList) {
    disabledReason = "Your list is already full.";
  } else if (expired) {
    disabledReason = "The turn deadline has expired.";
  }

  return (
    <div className="w-full max-w-lg text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">
        {state.category?.name ?? "Auction"}
      </p>
      {state.game.challenge ? (
        <p className="mt-3 text-lg text-foreground">{state.game.challenge}</p>
      ) : null}
      <p className="mt-2 font-mono text-sm tracking-[0.2em] text-muted">
        {state.game.room_code}
      </p>

      <div className="mt-6 overflow-hidden rounded-3xl border border-line bg-surface/90">
        <ItemVisual
          item={state.item ?? { image_url: null, name: "Item" }}
          categorySlug={state.category?.slug}
          alt={state.item?.name ?? "Auction item"}
          variant="hero"
        />
        <div className="p-5 text-left sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            Current item
          </p>
          <h1 className="mt-2 font-display text-4xl text-foreground">
            {state.item?.name}
          </h1>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted">Current bid</p>
              <p className="text-2xl font-semibold text-gold">
                {formatBudget(currentBid)}
              </p>
            </div>
            <div>
              <p className="text-muted">Highest bidder</p>
              <p className="text-lg text-foreground">
                {state.highestBidder?.player_name ?? "None yet"}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-muted">Your budget</p>
              <p className="text-lg text-foreground">
                {formatBudget(currentPlayer?.budget_remaining ?? 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col items-center gap-3">
        <AuctionTimer
          deadline={state.game.bid_deadline}
          onExpire={handleExpire}
        />
        <p className="text-sm text-muted">
          Starting bidder: {state.startingBidder?.player_name ?? "—"}
        </p>
        <p className="font-display text-2xl text-foreground">{turnLabel}</p>
        {opening ? (
          <p className="text-sm text-gold">
            {openingBid
              ? "Open the bidding — you cannot pass this one."
              : `${state.currentBidder?.player_name ?? "The opening bidder"} must open the bidding.`}
          </p>
        ) : null}
      </div>

      <BidControls
        currentBid={currentBid}
        remainingBudget={currentPlayer?.budget_remaining ?? 0}
        disabled={!canAct}
        openingBid={openingBid}
        onBid={handleBid}
        onPass={handlePass}
      />
      {disabledReason ? (
        <p className="mt-3 text-sm text-muted">{disabledReason}</p>
      ) : null}
      {isMyTurn && !canAffordNext && canAct && !openingBid ? (
        <p className="mt-2 text-sm text-gold">
          You cannot afford the next bid. Pass or wait for the timer.
        </p>
      ) : null}

      <div className="mt-4">
        <ErrorBanner message={error} />
      </div>

      <div className="mt-4 rounded-2xl border border-line bg-surface/80 p-5 text-left sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          Players
        </p>
        <AuctionPlayers
          players={state.players}
          collections={state.collections}
          listSize={state.listSize}
          currentBidderId={state.game.current_bidder_id}
          highestBidderId={state.game.current_bid_player_id}
          playerId={playerId}
          passedIds={state.passedIds}
        />
      </div>
    </div>
  );
}
