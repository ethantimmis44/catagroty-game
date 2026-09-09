import { loadItemsForCategory } from "@/lib/catalog";
import type { Category, Item } from "@/lib/catalog";
import {
  allListsFull,
  auctionPhase,
  collectionCount,
  decideLot,
  deadlineReached,
  isOpeningPhase,
  nextBidAmount,
  nextBidder,
  nextStartingIndex,
  playerHasFullList,
  playersWhoCannotAfford,
  sortPlayers,
} from "@/lib/auctionEngine";
import { poolItemIds } from "@/lib/gameItems";
import {
  AUCTION_TURN_SECONDS,
  listSizeForPlayerCount,
  MIN_BID,
  requiredItemsForPlayerCount,
  validateBidAmount,
} from "@/lib/rules";
import { supabase } from "@/lib/supabase";
import {
  GAME_STATUS,
  isGameFinished,
  type Collection,
  type Game,
  type GamePlayer,
} from "@/lib/types";

export type { Category, Item };

export type AuctionState = {
  game: Game;
  players: GamePlayer[];
  category: Category | null;
  item: Item | null;
  collections: Collection[];
  listSize: number;
  startingBidder: GamePlayer | null;
  currentBidder: GamePlayer | null;
  highestBidder: GamePlayer | null;
  passedIds: string[];
  /** "opening" until the first real bid lands; the opening bidder cannot pass. */
  phase: "opening" | "active";
  error: string | null;
};

export type AuctionActionResult = {
  ok: boolean;
  error?: string;
  code?: string;
  operation?: string;
  game_id?: string;
  current_item_id?: string | null;
  current_bidder_id?: string | null;
  submitted_player_id?: string | null;
  current_bid?: number | null;
  submitted_amount?: number | null;
  remaining_budget?: number | null;
  bid_deadline?: string | null;
  next_bidder_id?: string | null;
  highest_bidder_id?: string | null;
  skipped?: boolean;
  used_rpc?: boolean;
};

function asPlayer(row: Record<string, unknown>): GamePlayer {
  return {
    id: String(row.id),
    game_id: String(row.game_id),
    player_name: String(row.player_name),
    budget_remaining: Number(row.budget_remaining ?? 0),
    joined_at: String(row.joined_at ?? ""),
  };
}

function logAuction(label: string, payload: Record<string, unknown>) {
  console.info(`[auction] ${label}`, payload);
}

function asActionResult(value: unknown): AuctionActionResult {
  if (!value || typeof value !== "object") {
    return {
      ok: false,
      error: "Empty response from submit_auction_action.",
      operation: "submit_auction_action",
    };
  }
  const row = value as Record<string, unknown>;
  return {
    ok: row.ok === true,
    error: row.error ? String(row.error) : undefined,
    code: row.code ? String(row.code) : undefined,
    operation: row.operation ? String(row.operation) : undefined,
    game_id: row.game_id ? String(row.game_id) : undefined,
    current_item_id:
      row.current_item_id == null ? null : String(row.current_item_id),
    current_bidder_id:
      row.current_bidder_id == null ? null : String(row.current_bidder_id),
    submitted_player_id:
      row.submitted_player_id == null ? null : String(row.submitted_player_id),
    current_bid: row.current_bid == null ? null : Number(row.current_bid),
    submitted_amount:
      row.submitted_amount == null ? null : Number(row.submitted_amount),
    remaining_budget:
      row.remaining_budget == null ? null : Number(row.remaining_budget),
    bid_deadline:
      row.bid_deadline == null ? null : String(row.bid_deadline),
    next_bidder_id:
      row.next_bidder_id == null ? null : String(row.next_bidder_id),
    highest_bidder_id:
      row.highest_bidder_id == null ? null : String(row.highest_bidder_id),
    skipped: row.skipped === true,
    used_rpc: true,
  };
}

function rpcMissing(message: string) {
  return /could not find the function|does not exist|PGRST202|42883/i.test(
    message,
  );
}

async function invokeAuctionAction(
  roomCode: string,
  playerId: string | null,
  action: "bid" | "pass" | "expire",
  amount: number | null,
) {
  const { data, error } = await supabase.rpc("submit_auction_action", {
    p_room_code: roomCode,
    p_player_id: playerId,
    p_action: action,
    p_amount: amount,
  });

  if (error && rpcMissing(error.message)) {
    return { missing: true as const, result: null };
  }

  if (error) {
    throw new Error(
      `Supabase error: ${error.message} | operation=submit_auction_action/${action} | player=${playerId ?? "none"} | amount=${amount ?? "n/a"}`,
    );
  }

  return { missing: false as const, result: asActionResult(data) };
}

function describeAuctionFailure(result: AuctionActionResult) {
  const parts = [
    result.error ?? "Auction action failed.",
    result.operation ? `operation=${result.operation}` : null,
    result.code ? `code=${result.code}` : null,
    result.game_id ? `game=${result.game_id}` : null,
    result.current_item_id ? `item=${result.current_item_id}` : null,
    result.current_bidder_id
      ? `authoritative_bidder=${result.current_bidder_id}`
      : null,
    result.submitted_player_id
      ? `submitted_bidder=${result.submitted_player_id}`
      : null,
    result.current_bid != null ? `current_bid=£${result.current_bid}` : null,
    result.submitted_amount != null
      ? `submitted_amount=£${result.submitted_amount}`
      : null,
    result.remaining_budget != null
      ? `remaining_budget=£${result.remaining_budget}`
      : null,
    result.next_bidder_id ? `next_bidder=${result.next_bidder_id}` : null,
  ].filter(Boolean);
  return parts.join(" | ");
}

function asGame(row: Record<string, unknown>): Game {
  return {
    id: String(row.id),
    created_at: String(row.created_at ?? ""),
    room_code: String(row.room_code),
    status: String(row.status),
    mode: String(row.mode),
    max_players: Number(row.max_players),
    budget: Number(row.budget),
    category_id: (row.category_id as string | null) ?? null,
    challenge: (row.challenge as string | null) ?? null,
    list_size: row.list_size == null ? null : Number(row.list_size),
    current_item_id: (row.current_item_id as string | null) ?? null,
    current_bidder_id: (row.current_bidder_id as string | null) ?? null,
    current_bid_player_id: (row.current_bid_player_id as string | null) ?? null,
    starting_bidder_index: Number(row.starting_bidder_index ?? 0),
    auction_round: Number(row.auction_round ?? 0),
    auction_status: (row.auction_status as string | null) ?? null,
    current_bid: row.current_bid == null ? null : Number(row.current_bid),
    bid_deadline: (row.bid_deadline as string | null) ?? null,
    bid_turn_started_at: (row.bid_turn_started_at as string | null) ?? null,
    completed_at: (row.completed_at as string | null) ?? null,
  };
}

function turnClock() {
  const startedAt = new Date().toISOString();
  return {
    bid_turn_started_at: startedAt,
    bid_deadline: new Date(Date.now() + AUCTION_TURN_SECONDS * 1000).toISOString(),
  };
}

function bidWriteError(message: string) {
  if (/bids_amount_check/i.test(message)) {
    return "That bid is not allowed. Real bids must be whole pounds from £1 to £100. Passes are recorded separately.";
  }
  if (/price_paid|price_paid/i.test(message)) {
    return "Could not save the winning bid. Run supabase/migrations/20260824200000_stage6_collection_price_paid.sql and supabase/migrations/20260824210000_stage7_collection_price_paid.sql in the Supabase SQL editor, then try again.";
  }
  if (/duplicate key.*collections/i.test(message)) {
    return "This item has already been won in this game.";
  }
  if (/not your turn|not your turn to bid/i.test(message)) {
    return "It's not your turn.";
  }
  if (/games_status_check/i.test(message)) {
    return "Something went wrong. Please try again.";
  }
  return message;
}

export function toPlayerAuctionError(err: unknown) {
  const message = err instanceof Error ? err.message : String(err ?? "");
  console.error("[auction]", message);
  if (
    /games_status_check|check constraint|23514|PGRST|supabase error|operation=|code=/i.test(
      message,
    )
  ) {
    return "Something went wrong. Please try again.";
  }
  const cleaned = message.split(" | ")[0]?.trim() ?? "";
  if (!cleaned || /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(cleaned)) {
    return "Something went wrong. Please try again.";
  }
  return cleaned;
}

function finishGameValues() {
  return {
    status: GAME_STATUS.finished,
    auction_status: "complete",
    current_item_id: null,
    current_bidder_id: null,
    current_bid_player_id: null,
    current_bid: 0,
    bid_deadline: null,
    bid_turn_started_at: null,
    completed_at: new Date().toISOString(),
  };
}

function asCollection(row: Record<string, unknown>): Collection {
  const paid = row.price_paid ?? row.price_paid ?? row.price;
  const amount = paid == null ? null : Number(paid);
  return {
    id: String(row.id),
    created_at: String(row.created_at ?? ""),
    game_id: String(row.game_id),
    player_id: String(row.player_id),
    item_id: String(row.item_id),
    price: amount,
    price_paid: amount,
    auction_round: row.auction_round == null ? null : Number(row.auction_round),
  };
}

async function loadGame(roomCode: string) {
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .eq("room_code", roomCode.trim().toUpperCase())
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? asGame(data as Record<string, unknown>) : null;
}

async function loadPlayers(gameId: string) {
  const { data, error } = await supabase
    .from("game_players")
    .select("*")
    .eq("game_id", gameId)
    .order("joined_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return sortPlayers(
    ((data ?? []) as Record<string, unknown>[]).map(asPlayer),
  );
}

async function loadCollections(gameId: string) {
  const { data, error } = await supabase
    .from("collections")
    .select("*")
    .eq("game_id", gameId);

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as Record<string, unknown>[]).map(asCollection);
}

async function loadPassedIds(game: Game) {
  if (!game.current_item_id || !game.auction_round) {
    return [] as string[];
  }

  const { data, error } = await supabase
    .from("bids")
    .select("player_id")
    .eq("game_id", game.id)
    .eq("item_id", game.current_item_id)
    .eq("auction_round", game.auction_round)
    .eq("is_pass", true);

  if (error) {
    throw new Error(error.message);
  }

  return [...new Set((data ?? []).map((row) => String(row.player_id)))];
}

async function usedItemIds(gameId: string) {
  const [{ data: collected, error: collectedError }, { data: bidItems, error: bidError }] =
    await Promise.all([
      supabase.from("collections").select("item_id").eq("game_id", gameId),
      supabase.from("bids").select("item_id").eq("game_id", gameId),
    ]);

  if (collectedError) {
    throw new Error(collectedError.message);
  }
  if (bidError) {
    throw new Error(bidError.message);
  }

  return new Set(
    [...(collected ?? []), ...(bidItems ?? [])]
      .map((row) => row.item_id)
      .filter((id): id is string => Boolean(id)),
  );
}

async function updateGame(
  gameId: string,
  values: Record<string, unknown>,
  match: Record<string, unknown> = {},
) {
  let query = supabase.from("games").update(values).eq("id", gameId);
  for (const [key, value] of Object.entries(match)) {
    query = query.eq(key, value as string | number);
  }

  const { data, error } = await query.select("*").maybeSingle();

  if (error) {
    if (/bid_deadline/i.test(error.message)) {
      throw new Error(
        "The database is missing bid_deadline. Run supabase/migrations/20260824180000_stage4_auction_deadline.sql in the Supabase SQL editor, then try again.",
      );
    }
    if (/bid_turn_started_at/i.test(error.message) && "bid_turn_started_at" in values) {
      const { bid_turn_started_at: _ignored, ...rest } = values;
      return updateGame(gameId, rest, match);
    }
    if (/bids_amount_check/i.test(error.message)) {
      throw new Error(bidWriteError(error.message));
    }
    if (/games_status_check/i.test(error.message)) {
      console.error("[auction] games_status_check", {
        gameId,
        attemptedStatus: values.status ?? null,
        supabaseError: error.message,
      });
      throw new Error("Something went wrong. Please try again.");
    }
    throw new Error(error.message);
  }

  return data ? asGame(data as Record<string, unknown>) : null;
}

/**
 * Items this game is allowed to auction: the host's chosen pool when one was
 * stored, otherwise the whole category (games created before pools existed).
 */
async function auctionableItems(game: Game) {
  if (!game.category_id) {
    throw new Error("This game has no category selected.");
  }

  const items = await loadItemsForCategory(game.category_id);
  const pool = await poolItemIds(game.id);

  if (pool.length === 0) {
    return items;
  }

  const allowed = new Set(pool);
  return items.filter((item) => allowed.has(item.id));
}

async function pickNextItem(game: Game) {
  const used = await usedItemIds(game.id);
  if (game.current_item_id) {
    used.add(game.current_item_id);
  }
  const items = await auctionableItems(game);
  const unused = items.filter((item) => !used.has(item.id));

  if (unused.length === 0) {
    throw new Error(
      "There are not enough unused items left in this game's pool to continue the auction.",
    );
  }

  const index = Math.floor(Math.random() * unused.length);
  return unused[index];
}

async function beginLot(game: Game, players: GamePlayer[], collections: Collection[]) {
  const listSize = game.list_size ?? listSizeForPlayerCount(players.length);

  if (allListsFull(players, collections, listSize)) {
    return updateGame(game.id, finishGameValues());
  }

  if (game.category_id) {
    const available = (await auctionableItems(game)).length;
    const needed = requiredItemsForPlayerCount(players.length);
    const used = await usedItemIds(game.id);
    const remainingSlots = players.reduce(
      (sum, player) =>
        sum + Math.max(0, listSize - collectionCount(collections, player.id)),
      0,
    );
    if (available - used.size < remainingSlots || available < needed) {
      throw new Error(
        `This game's item pool does not have enough unused items left to finish every player's list.`,
      );
    }
  }

  const item = await pickNextItem(game);
  const startingIndex = game.starting_bidder_index ?? 0;
  const firstBidder = nextBidder({
    players,
    startingIndex,
    currentBidderId: null,
    highestBidderId: null,
    passedIds: new Set(),
    collections,
    listSize,
    currentBid: 0,
  });

  if (!firstBidder) {
    return updateGame(game.id, finishGameValues());
  }

  const nextRound = (game.auction_round ?? 0) + 1;

  const updated = await updateGame(
    game.id,
    {
      status: "active",
      auction_status: "live",
      current_item_id: item.id,
      current_bidder_id: firstBidder.id,
      current_bid_player_id: null,
      current_bid: 0,
      starting_bidder_index: startingIndex,
      auction_round: nextRound,
      list_size: listSize,
      ...turnClock(),
    },
    { auction_round: game.auction_round ?? 0 },
  );

  if (updated) {
    return updated;
  }

  const { data } = await supabase
    .from("games")
    .select("*")
    .eq("id", game.id)
    .maybeSingle();

  return data ? asGame(data as Record<string, unknown>) : game;
}

async function resolveLot(
  game: Game,
  players: GamePlayer[],
  collections: Collection[],
  passedIds: Set<string>,
  expectedMatch: Record<string, unknown> = {},
) {
  const listSize = game.list_size ?? listSizeForPlayerCount(players.length);

  const unaffordable = playersWhoCannotAfford({
    players,
    collections,
    listSize,
    passedIds,
    currentBid: game.current_bid,
    highestBidderId: game.current_bid_player_id,
  });

  for (const player of unaffordable) {
    if (passedIds.has(player.id)) {
      continue;
    }
    const { error: autoPassError } = await supabase.from("bids").insert({
      game_id: game.id,
      player_id: player.id,
      item_id: game.current_item_id,
      amount: 0,
      auction_round: game.auction_round,
      is_pass: true,
    });
    if (autoPassError && !/duplicate/i.test(autoPassError.message)) {
      throw new Error(bidWriteError(autoPassError.message));
    }
    passedIds.add(player.id);
  }

  const decision = decideLot({
    players,
    collections,
    listSize,
    passedIds,
    currentBidderId: game.current_bidder_id,
    highestBidderId: game.current_bid_player_id,
    currentBid: game.current_bid,
    startingIndex: game.starting_bidder_index ?? 0,
  });

  if (decision.outcome === "continue" && decision.nextBidderId) {
    const updated = await updateGame(
      game.id,
      {
        current_bidder_id: decision.nextBidderId,
        current_bid: game.current_bid ?? 0,
        current_bid_player_id: game.current_bid_player_id,
        ...turnClock(),
      },
      expectedMatch,
    );
    if (!updated) {
      throw new Error(
        "Bid rejected: the auction changed before this write was saved. Refresh and try again.",
      );
    }
    return updated;
  }

  if (decision.outcome === "sell" && game.current_bid_player_id && game.current_item_id) {
    const winner = players.find((player) => player.id === game.current_bid_player_id);
    const pricePaid = game.current_bid;

    if (!winner) {
      throw new Error("The winning player could not be found.");
    }

    if (pricePaid == null || !Number.isInteger(pricePaid) || pricePaid < 1) {
      throw new Error("The winning bid was missing, so the item could not be collected.");
    }

    if (playerHasFullList(winner.id, collections, listSize)) {
      throw new Error("That player already has a full list.");
    }

    if (pricePaid > winner.budget_remaining) {
      throw new Error("The winning bid is higher than the player's remaining budget.");
    }

    const { data: existingWin, error: existingError } = await supabase
      .from("collections")
      .select("id")
      .eq("game_id", game.id)
      .eq("item_id", game.current_item_id)
      .maybeSingle();

    if (existingError) {
      throw new Error(bidWriteError(existingError.message));
    }

    if (!existingWin) {
      const { error: collectionError } = await supabase.from("collections").insert({
        game_id: game.id,
        player_id: winner.id,
        item_id: game.current_item_id,
        price_paid: pricePaid,
        price: pricePaid,
        auction_round: game.auction_round,
      });

      const alreadyWon = Boolean(
        collectionError &&
          /duplicate key|collections_game_id_item_id/i.test(collectionError.message),
      );

      if (collectionError && !alreadyWon) {
        throw new Error(bidWriteError(collectionError.message));
      }

      if (!alreadyWon) {
        const remaining = winner.budget_remaining - pricePaid;
        if (remaining < 0) {
          throw new Error("The winning bid is higher than the player's remaining budget.");
        }

        const { error: budgetError, data: budgetRows } = await supabase
          .from("game_players")
          .update({
            budget_remaining: remaining,
          })
          .eq("id", winner.id)
          .gte("budget_remaining", pricePaid)
          .select("id");

        if (budgetError) {
          throw new Error(budgetError.message);
        }

        if (!budgetRows?.length) {
          throw new Error("The winning bid is higher than the player's remaining budget.");
        }

        collections = [
          ...collections,
          {
            id: "local",
            created_at: new Date().toISOString(),
            game_id: game.id,
            player_id: winner.id,
            item_id: game.current_item_id,
            price: pricePaid,
            price_paid: pricePaid,
            auction_round: game.auction_round,
          },
        ];
        players = players.map((player) =>
          player.id === winner.id
            ? {
                ...player,
                budget_remaining: Math.max(0, player.budget_remaining - pricePaid),
              }
            : player,
        );
      }
    }
  }

  const rotated: Game = {
    ...game,
    starting_bidder_index: nextStartingIndex(
      players,
      game.starting_bidder_index ?? 0,
      collections,
      listSize,
    ),
    current_item_id: game.current_item_id,
  };

  return beginLot(rotated, players, collections);
}

export async function ensureLiveAuction(roomCode: string) {
  const game = await loadGame(roomCode);
  if (!game) {
    return null;
  }

  if (game.status === "waiting") {
    return game;
  }

  if (isGameFinished(game)) {
    return game;
  }

  if (game.auction_status === "live" && game.current_item_id) {
    return game;
  }

  const players = await loadPlayers(game.id);
  const collections = await loadCollections(game.id);
  return beginLot(game, players, collections);
}

export async function getAuction(roomCode: string): Promise<AuctionState | null> {
  const game = await loadGame(roomCode);
  if (!game) {
    return null;
  }

  const players = await loadPlayers(game.id);
  const collections = await loadCollections(game.id);
  const passedIds = await loadPassedIds(game);
  const listSize = game.list_size ?? listSizeForPlayerCount(players.length);

  let category: Category | null = null;
  let item: Item | null = null;
  let error: string | null = null;

  if (game.category_id) {
    const { data, error: categoryError } = await supabase
      .from("categories")
      .select("*")
      .eq("id", game.category_id)
      .maybeSingle();

    if (categoryError) {
      error = categoryError.message;
    } else {
      category = (data as Category | null) ?? null;
    }
  }

  if (game.current_item_id) {
    const { data, error: itemError } = await supabase
      .from("items")
      .select("*")
      .eq("id", game.current_item_id)
      .maybeSingle();

    if (itemError) {
      error = itemError.message;
    } else {
      item = (data as Item | null) ?? null;
    }
  }

  const startingBidder = nextBidder({
    players,
    startingIndex: game.starting_bidder_index ?? 0,
    currentBidderId: null,
    highestBidderId: null,
    passedIds: new Set(),
    collections,
    listSize,
  });
  const currentBidder =
    players.find((player) => player.id === game.current_bidder_id) ?? null;
  const highestBidder =
    players.find((player) => player.id === game.current_bid_player_id) ?? null;

  return {
    game,
    players,
    category,
    item,
    collections,
    listSize,
    startingBidder,
    currentBidder,
    highestBidder,
    passedIds,
    phase: auctionPhase(game),
    error,
  };
}

async function loadTurnContext(roomCode: string, playerId?: string) {
  const state = await getAuction(roomCode);
  if (!state) {
    throw new Error("Game not found.");
  }

  const { game, players, collections, listSize, passedIds } = state;

  if (isGameFinished(game)) {
    throw new Error("The auction has ended.");
  }

  if (game.status !== "active" || game.auction_status !== "live") {
    throw new Error("The auction has ended.");
  }

  if (!game.current_item_id) {
    throw new Error("There is no current auction item.");
  }

  const player = playerId
    ? players.find((entry) => entry.id === playerId)
    : null;

  return {
    ...state,
    player,
    passed: new Set(passedIds),
    listSize,
    collections,
  };
}

async function applyAuctionAction(input: {
  roomCode: string;
  playerId: string | null;
  action: "bid" | "pass" | "expire";
  amount: number | null;
}) {
  const latest = await getAuction(input.roomCode);
  const currentPlayer = latest?.players.find(
    (player) => player.id === input.playerId,
  );

  logAuction(`${input.action}:request`, {
    roomCode: input.roomCode,
    gameId: latest?.game.id ?? null,
    itemId: latest?.game.current_item_id ?? null,
    localPlayerId: input.playerId,
    authoritativeBidderId: latest?.game.current_bidder_id ?? null,
    submittedPlayerId: input.playerId,
    currentBid: latest?.game.current_bid ?? 0,
    submittedAmount: input.amount,
    remainingBudget: currentPlayer?.budget_remaining ?? null,
    deadline: latest?.game.bid_deadline ?? null,
  });

  const invoked = await invokeAuctionAction(
    input.roomCode,
    input.playerId,
    input.action,
    input.amount,
  );

  if (!invoked.missing) {
    logAuction(`${input.action}:rpc`, invoked.result as Record<string, unknown>);
    if (invoked.result.ok) {
      return invoked.result;
    }
    const rpcError = invoked.result.error ?? "";
    if (/games_status_check/i.test(rpcError)) {
      logAuction(`${input.action}:rpc_status_fallback`, {
        note: "RPC tried to write games.status='complete'; using TypeScript path with 'finished'.",
        rpcError,
      });
      return null;
    }
    throw new Error(describeAuctionFailure(invoked.result));
  }

  logAuction(`${input.action}:rpc_missing`, {
    note: "submit_auction_action is not installed; using TypeScript fallback",
  });
  return null;
}

export async function placeBid(input: {
  roomCode: string;
  playerId: string;
  amount: number;
}) {
  const rpc = await applyAuctionAction({
    roomCode: input.roomCode,
    playerId: input.playerId,
    action: "bid",
    amount: input.amount,
  });
  if (rpc) {
    return;
  }

  const context = await loadTurnContext(input.roomCode, input.playerId);
  const { game, players, collections, listSize, passed, player } = context;

  if (!player) {
    throw new Error("You are not in this game.");
  }

  if (game.current_bidder_id !== player.id) {
    throw new Error(
      `Bid rejected: it is not your turn. Current bidder is ${game.current_bidder_id}, submitted bidder is ${player.id}.`,
    );
  }

  if (deadlineReached(game.bid_deadline)) {
    throw new Error("Bid rejected: the turn deadline has expired.");
  }

  if (playerHasFullList(player.id, collections, listSize)) {
    throw new Error("Bid rejected: your list is already full.");
  }

  if (passed.has(player.id)) {
    throw new Error("Bid rejected: you have already passed this item.");
  }

  const bidErrorMessage = validateBidAmount({
    amount: input.amount,
    currentBid: game.current_bid ?? 0,
    remainingBudget: player.budget_remaining,
  });
  if (bidErrorMessage) {
    throw new Error(`Bid rejected: ${bidErrorMessage}`);
  }

  logAuction("placeBid:validation", {
    ok: true,
    gameId: game.id,
    itemId: game.current_item_id,
    currentBidderId: game.current_bidder_id,
    submittedPlayerId: player.id,
    currentBid: game.current_bid ?? 0,
    submittedAmount: input.amount,
    remainingBudget: player.budget_remaining,
    deadline: game.bid_deadline,
  });

  const { error: bidError } = await supabase.from("bids").insert({
    game_id: game.id,
    player_id: player.id,
    item_id: game.current_item_id,
    amount: input.amount,
    auction_round: game.auction_round,
    is_pass: false,
  });

  if (bidError) {
    throw new Error(
      `Supabase error: ${bidWriteError(bidError.message)} | operation=insert bids | game=${game.id} | player=${player.id} | amount=${input.amount}`,
    );
  }

  const afterBid: Game = {
    ...game,
    current_bid: input.amount,
    current_bid_player_id: player.id,
  };

  await resolveLot(afterBid, players, collections, passed, {
    current_bidder_id: player.id,
    current_item_id: game.current_item_id,
  });
}

export async function passTurn(input: { roomCode: string; playerId: string }) {
  const rpc = await applyAuctionAction({
    roomCode: input.roomCode,
    playerId: input.playerId,
    action: "pass",
    amount: null,
  });
  if (rpc) {
    return;
  }

  const context = await loadTurnContext(input.roomCode, input.playerId);
  const { game, players, collections, listSize, passed, player } = context;

  if (!player) {
    throw new Error("You are not in this game.");
  }

  if (game.current_bidder_id !== player.id) {
    throw new Error(
      `Pass rejected: it is not your turn. Current bidder is ${game.current_bidder_id}, submitted bidder is ${player.id}.`,
    );
  }

  if (deadlineReached(game.bid_deadline)) {
    throw new Error("Pass rejected: the turn deadline has expired.");
  }

  if (playerHasFullList(player.id, collections, listSize)) {
    throw new Error("Pass rejected: your list is already full.");
  }

  if (passed.has(player.id)) {
    throw new Error("Pass rejected: you have already passed this item.");
  }

  if (isOpeningPhase(game)) {
    throw new Error(
      `The opening bid cannot be passed. Bid at least £${MIN_BID} to start this item.`,
    );
  }

  const { error: bidError } = await supabase.from("bids").insert({
    game_id: game.id,
    player_id: player.id,
    item_id: game.current_item_id,
    amount: 0,
    auction_round: game.auction_round,
    is_pass: true,
  });

  if (bidError) {
    throw new Error(
      `Supabase error: ${bidWriteError(bidError.message)} | operation=insert pass | game=${game.id} | player=${player.id}`,
    );
  }

  passed.add(player.id);
  await resolveLot(game, players, collections, passed, {
    current_bidder_id: player.id,
    current_item_id: game.current_item_id,
  });
}

export async function resolveExpiredTurn(roomCode: string) {
  const rpc = await applyAuctionAction({
    roomCode,
    playerId: null,
    action: "expire",
    amount: null,
  });
  if (rpc) {
    return;
  }

  const state = await getAuction(roomCode);
  if (!state) {
    throw new Error("Game not found.");
  }

  const { game, players, collections, passedIds, listSize } = state;

  if (game.status !== "active" || game.auction_status !== "live") {
    return;
  }

  if (!deadlineReached(game.bid_deadline)) {
    return;
  }

  const current = players.find((player) => player.id === game.current_bidder_id);
  if (!current || !game.current_item_id) {
    return;
  }

  const passed = new Set(passedIds);
  const eligible =
    !passed.has(current.id) &&
    !playerHasFullList(current.id, collections, listSize);

  // The opening bidder is not allowed to pass, so a timeout places the
  // minimum opening bid for them rather than skipping the lot.
  if (eligible && isOpeningPhase(game) && current.budget_remaining >= MIN_BID) {
    const { error: openError } = await supabase.from("bids").insert({
      game_id: game.id,
      player_id: current.id,
      item_id: game.current_item_id,
      amount: MIN_BID,
      auction_round: game.auction_round,
      is_pass: false,
    });

    if (openError && !/duplicate/i.test(openError.message)) {
      throw new Error(
        `Supabase error: ${bidWriteError(openError.message)} | operation=auto opening bid | game=${game.id} | player=${current.id}`,
      );
    }

    logAuction("expire:auto_opening_bid", {
      gameId: game.id,
      itemId: game.current_item_id,
      playerId: current.id,
      amount: MIN_BID,
    });

    const opened: Game = {
      ...game,
      current_bid: MIN_BID,
      current_bid_player_id: current.id,
    };

    await resolveLot(opened, players, collections, passed, {
      current_bidder_id: current.id,
      current_item_id: game.current_item_id,
    });
    return;
  }

  if (eligible) {
    const { error: bidError } = await supabase.from("bids").insert({
      game_id: game.id,
      player_id: current.id,
      item_id: game.current_item_id,
      amount: 0,
      auction_round: game.auction_round,
      is_pass: true,
    });

    if (bidError && !/duplicate/i.test(bidError.message)) {
      throw new Error(
        `Supabase error: ${bidWriteError(bidError.message)} | operation=expire turn | game=${game.id} | player=${current.id}`,
      );
    }

    passed.add(current.id);
  }

  await resolveLot(game, players, collections, passed, {
    current_bidder_id: current.id,
    current_item_id: game.current_item_id,
  });
}

export { collectionCount, nextBidAmount };
