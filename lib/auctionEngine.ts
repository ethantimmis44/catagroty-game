import { MIN_BID } from "@/lib/rules";
import type { GamePlayer } from "@/lib/types";

export type AuctionLotStatus = "waiting" | "starting" | "active" | "completed";

export type LotDecision = {
  status: AuctionLotStatus;
  outcome: "continue" | "sell" | "skip";
  nextBidderId: string | null;
  winnerId: string | null;
  activeBidderIds: string[];
};

export function sortPlayers(players: GamePlayer[]) {
  return [...players].sort(
    (a, b) =>
      new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime(),
  );
}

export function biddingOrder(players: GamePlayer[], startingIndex: number) {
  const sorted = sortPlayers(players);
  if (sorted.length === 0) {
    return [];
  }

  const index =
    ((startingIndex % sorted.length) + sorted.length) % sorted.length;
  return [...sorted.slice(index), ...sorted.slice(0, index)];
}

export function collectionCount(
  collections: { player_id: string }[],
  playerId: string,
) {
  return collections.filter((entry) => entry.player_id === playerId).length;
}

export function playerHasFullList(
  playerId: string,
  collections: { player_id: string }[],
  listSize: number,
) {
  return collectionCount(collections, playerId) >= listSize;
}

export function allListsFull(
  players: GamePlayer[],
  collections: { player_id: string }[],
  listSize: number,
) {
  return players.every((player) =>
    playerHasFullList(player.id, collections, listSize),
  );
}

export function nextBidAmount(currentBid: number | null) {
  return Math.max(MIN_BID, (currentBid ?? 0) + MIN_BID);
}

/**
 * A lot is "opening" until somebody holds the high bid. The opening bidder
 * must bid at least MIN_BID and is not allowed to pass.
 */
export function isOpeningPhase(lot: {
  current_bid_player_id?: string | null;
  current_bid?: number | null;
}) {
  return !lot.current_bid_player_id || (lot.current_bid ?? 0) <= 0;
}

export function auctionPhase(lot: {
  current_bid_player_id?: string | null;
  current_bid?: number | null;
}): "opening" | "active" {
  return isOpeningPhase(lot) ? "opening" : "active";
}

export function canAffordNextBid(
  remainingBudget: number,
  currentBid: number | null,
) {
  return remainingBudget >= nextBidAmount(currentBid);
}

/**
 * Active on this lot: not finished, not passed, and either already the
 * high bidder or able to make the minimum next bid.
 * Being outbid does NOT remove a player.
 */
export function isActiveOnLot(input: {
  player: GamePlayer;
  collections: { player_id: string }[];
  listSize: number;
  passedIds: Set<string>;
  currentBid: number | null;
  highestBidderId: string | null;
}) {
  if (playerHasFullList(input.player.id, input.collections, input.listSize)) {
    return false;
  }
  if (input.passedIds.has(input.player.id)) {
    return false;
  }
  if (input.player.id === input.highestBidderId) {
    return true;
  }
  return canAffordNextBid(input.player.budget_remaining, input.currentBid);
}

export function activeBidders(input: {
  players: GamePlayer[];
  collections: { player_id: string }[];
  listSize: number;
  passedIds: Set<string>;
  currentBid: number | null;
  highestBidderId: string | null;
}) {
  return input.players.filter((player) =>
    isActiveOnLot({
      player,
      collections: input.collections,
      listSize: input.listSize,
      passedIds: input.passedIds,
      currentBid: input.currentBid,
      highestBidderId: input.highestBidderId,
    }),
  );
}

export function playersWhoCannotAfford(input: {
  players: GamePlayer[];
  collections: { player_id: string }[];
  listSize: number;
  passedIds: Set<string>;
  currentBid: number | null;
  highestBidderId: string | null;
}) {
  return input.players.filter((player) => {
    if (playerHasFullList(player.id, input.collections, input.listSize)) {
      return false;
    }
    if (input.passedIds.has(player.id)) {
      return false;
    }
    if (player.id === input.highestBidderId) {
      return false;
    }
    return !canAffordNextBid(player.budget_remaining, input.currentBid);
  });
}

export function nextBidder(input: {
  players: GamePlayer[];
  startingIndex: number;
  currentBidderId: string | null;
  highestBidderId: string | null;
  passedIds: Set<string>;
  collections: { player_id: string }[];
  listSize: number;
  currentBid?: number | null;
}): GamePlayer | null {
  const order = biddingOrder(input.players, input.startingIndex);
  const active = (player: GamePlayer) =>
    isActiveOnLot({
      player,
      collections: input.collections,
      listSize: input.listSize,
      passedIds: input.passedIds,
      currentBid: input.currentBid ?? 0,
      highestBidderId: input.highestBidderId,
    });

  if (!input.currentBidderId) {
    return order.find(active) ?? null;
  }

  const start = order.findIndex((player) => player.id === input.currentBidderId);
  if (start === -1) {
    return order.find(active) ?? null;
  }

  for (let step = 1; step <= order.length; step += 1) {
    const player = order[(start + step) % order.length];
    if (active(player)) {
      return player;
    }
  }

  return null;
}

/**
 * Clockwise lot state machine.
 * Sell only when exactly one active bidder remains and they hold the high bid.
 */
export function decideLot(input: {
  players: GamePlayer[];
  collections: { player_id: string }[];
  listSize: number;
  passedIds: Set<string>;
  currentBidderId: string | null;
  highestBidderId: string | null;
  currentBid: number | null;
  startingIndex: number;
}): LotDecision {
  const active = activeBidders({
    players: input.players,
    collections: input.collections,
    listSize: input.listSize,
    passedIds: input.passedIds,
    currentBid: input.currentBid,
    highestBidderId: input.highestBidderId,
  });
  const activeIds = active.map((player) => player.id);

  if (active.length === 0) {
    return {
      status: "completed",
      outcome: "skip",
      nextBidderId: null,
      winnerId: null,
      activeBidderIds: [],
    };
  }

  if (
    active.length === 1 &&
    input.highestBidderId &&
    active[0].id === input.highestBidderId
  ) {
    return {
      status: "completed",
      outcome: "sell",
      nextBidderId: null,
      winnerId: input.highestBidderId,
      activeBidderIds: activeIds,
    };
  }

  const next = nextBidder({
    players: input.players,
    startingIndex: input.startingIndex,
    currentBidderId: input.currentBidderId,
    highestBidderId: input.highestBidderId,
    passedIds: input.passedIds,
    collections: input.collections,
    listSize: input.listSize,
    currentBid: input.currentBid,
  });

  if (!next) {
    if (input.highestBidderId && activeIds.includes(input.highestBidderId)) {
      return {
        status: "completed",
        outcome: "sell",
        nextBidderId: null,
        winnerId: input.highestBidderId,
        activeBidderIds: activeIds,
      };
    }
    return {
      status: "completed",
      outcome: "skip",
      nextBidderId: null,
      winnerId: null,
      activeBidderIds: activeIds,
    };
  }

  return {
    status: input.highestBidderId ? "active" : "starting",
    outcome: "continue",
    nextBidderId: next.id,
    winnerId: null,
    activeBidderIds: activeIds,
  };
}

/** @deprecated Use decideLot; kept for existing tests during the swap. */
export function auctionOutcome(input: {
  players: GamePlayer[];
  collections: { player_id: string }[];
  listSize: number;
  passedIds: Set<string>;
  highestBidderId: string | null;
  currentBid?: number | null;
  currentBidderId?: string | null;
  startingIndex?: number;
}): "sell" | "skip" | "continue" {
  return decideLot({
    players: input.players,
    collections: input.collections,
    listSize: input.listSize,
    passedIds: input.passedIds,
    currentBidderId: input.currentBidderId ?? input.highestBidderId,
    highestBidderId: input.highestBidderId,
    currentBid: input.currentBid ?? 0,
    startingIndex: input.startingIndex ?? 0,
  }).outcome;
}

export function secondsLeft(deadline: string | null, now = Date.now()) {
  if (!deadline) {
    return 0;
  }

  return Math.max(0, Math.ceil((new Date(deadline).getTime() - now) / 1000));
}

export function deadlineReached(deadline: string | null, now = Date.now()) {
  if (!deadline) {
    return false;
  }

  return now >= new Date(deadline).getTime();
}

export function nextStartingIndex(
  players: GamePlayer[],
  currentIndex: number,
  collections: { player_id: string }[] = [],
  listSize = Number.POSITIVE_INFINITY,
) {
  const sorted = sortPlayers(players);
  if (sorted.length === 0) {
    return 0;
  }

  for (let step = 1; step <= sorted.length; step += 1) {
    const index = (currentIndex + step) % sorted.length;
    if (!playerHasFullList(sorted[index].id, collections, listSize)) {
      return index;
    }
  }

  return (currentIndex + 1) % sorted.length;
}
