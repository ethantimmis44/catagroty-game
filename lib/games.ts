import { ensureLiveAuction } from "@/lib/auction";
import { countItemsForCategory, getCategory, loadItemsForCategory } from "@/lib/catalog";
import { poolItemIds, savePool } from "@/lib/gameItems";
import { supabase } from "@/lib/supabase";
import {
  listSizeForPlayerCount,
  MAX_BUDGET,
  MIN_BUDGET,
  minimumPlayersFor,
  minimumPoolSize,
} from "@/lib/rules";
import type { Game, GamePlayer, LobbyData } from "@/lib/types";

const ROOM_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateRoomCode() {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(
    bytes,
    (byte) => ROOM_CODE_CHARS[byte % ROOM_CODE_CHARS.length],
  ).join("");
}

async function uniqueRoomCode() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const roomCode = generateRoomCode();
    const { data, error } = await supabase
      .from("games")
      .select("id")
      .eq("room_code", roomCode)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return roomCode;
    }
  }

  throw new Error("Could not generate a unique room code. Please try again.");
}

function asGame(row: Game) {
  return row;
}

function sortPlayers(players: GamePlayer[]) {
  return [...players].sort(
    (a, b) =>
      new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime(),
  );
}

export function isHostPlayer(players: GamePlayer[], playerId: string | null) {
  if (!playerId || players.length === 0) {
    return false;
  }

  return sortPlayers(players)[0]?.id === playerId;
}

export { minimumPlayersFor, listSizeForPlayerCount };

export async function createGame(input: {
  mode: "1v1" | "multiplayer";
  maxPlayers: number;
  budget: number;
  hostName: string;
  categoryId: string;
  challenge: string;
  itemIds: string[];
}): Promise<{ game: Game; player: GamePlayer }> {
  const roomCode = await uniqueRoomCode();
  const listSize = listSizeForPlayerCount(input.maxPlayers);
  const budget = Math.round(input.budget);

  if (!Number.isInteger(budget) || budget < MIN_BUDGET || budget > MAX_BUDGET) {
    throw new Error(
      `Budget must be a whole number between £${MIN_BUDGET} and £${MAX_BUDGET}.`,
    );
  }

  const challenge = input.challenge.trim();
  if (challenge.length < 4) {
    throw new Error("Enter a short challenge, such as “fastest animals”.");
  }

  const category = await getCategory(input.categoryId);
  if (!category) {
    throw new Error("Choose an existing category.");
  }

  const categoryItems = await loadItemsForCategory(category.id);
  const needed = minimumPoolSize(input.maxPlayers);
  if (categoryItems.length < needed) {
    throw new Error(
      `${category.name} only has ${categoryItems.length} items. A ${input.maxPlayers}-player game needs at least ${needed}.`,
    );
  }

  const inCategory = new Set(categoryItems.map((item) => item.id));
  const selected = [...new Set(input.itemIds)];
  const foreign = selected.filter((id) => !inCategory.has(id));

  if (foreign.length > 0) {
    throw new Error(
      `Every selected item must belong to ${category.name}. Reload the item pool and try again.`,
    );
  }

  if (selected.length < needed) {
    const short = needed - selected.length;
    throw new Error(
      `Select ${short} more item${short === 1 ? "" : "s"}. A ${input.maxPlayers}-player game needs at least ${needed}.`,
    );
  }

  const { data: game, error: gameError } = await supabase
    .from("games")
    .insert({
      room_code: roomCode,
      status: "waiting",
      mode: input.mode,
      max_players: input.maxPlayers,
      budget,
      category_id: input.categoryId,
      challenge,
      list_size: listSize,
    })
    .select()
    .single();

  if (gameError || !game) {
    const message = gameError?.message ?? "Could not create the game.";
    if (/challenge|list_size|schema cache|PGRST204/i.test(message)) {
      throw new Error(
        "The database is missing Stage 1 columns. Run supabase/migrations/20260824120000_stage1_category_game.sql in the Supabase SQL editor, then try again.",
      );
    }
    if (/games_budget_range|budget.*20|budget.*100/i.test(message)) {
      throw new Error(
        `Budget must be a whole number between £${MIN_BUDGET} and £${MAX_BUDGET}.`,
      );
    }
    throw new Error(message);
  }

  try {
    await savePool(game.id, selected);
  } catch (err) {
    // Roll the empty room back so a failed pool never leaves a playable game
    // that could auction items the host did not choose.
    await supabase.from("games").delete().eq("id", game.id);
    throw err;
  }

  const { data: player, error: playerError } = await supabase
    .from("game_players")
    .insert({
      game_id: game.id,
      player_name: input.hostName,
      budget_remaining: budget,
    })
    .select()
    .single();

  if (playerError || !player) {
    await supabase.from("games").delete().eq("id", game.id);
    throw new Error(playerError?.message ?? "Could not add you as the host.");
  }

  return { game: asGame(game), player };
}

export async function joinGame(input: {
  roomCode: string;
  playerName: string;
}): Promise<{ game: Game; player: GamePlayer }> {
  const roomCode = input.roomCode.trim().toUpperCase();
  const playerName = input.playerName.trim();

  const { data: game, error: gameError } = await supabase
    .from("games")
    .select("*")
    .eq("room_code", roomCode)
    .maybeSingle();

  if (gameError) {
    throw new Error(gameError.message);
  }

  if (!game) {
    throw new Error("No game found with that room code.");
  }

  if (game.status !== "waiting") {
    throw new Error("This game is no longer waiting for players.");
  }

  const { data: players, error: playersError } = await supabase
    .from("game_players")
    .select("*")
    .eq("game_id", game.id);

  if (playersError) {
    throw new Error(playersError.message);
  }

  const currentPlayers = players ?? [];

  if (currentPlayers.length >= game.max_players) {
    throw new Error("This game is already full.");
  }

  const nameTaken = currentPlayers.some(
    (player) =>
      player.player_name.trim().toLowerCase() === playerName.toLowerCase(),
  );

  if (nameTaken) {
    throw new Error("That name is already taken in this room.");
  }

  const { data: player, error: joinError } = await supabase
    .from("game_players")
    .insert({
      game_id: game.id,
      player_name: playerName,
      budget_remaining: game.budget,
    })
    .select()
    .single();

  if (joinError || !player) {
    throw new Error(joinError?.message ?? "Could not join this game.");
  }

  return { game: asGame(game), player };
}

export async function getLobby(roomCode: string): Promise<LobbyData | null> {
  const { data: game, error: gameError } = await supabase
    .from("games")
    .select("*")
    .eq("room_code", roomCode.trim().toUpperCase())
    .maybeSingle();

  if (gameError) {
    throw new Error(gameError.message);
  }

  if (!game) {
    return null;
  }

  const { data: players, error: playersError } = await supabase
    .from("game_players")
    .select("*")
    .eq("game_id", game.id)
    .order("joined_at", { ascending: true });

  if (playersError) {
    throw new Error(playersError.message);
  }

  return {
    game: asGame(game),
    players: sortPlayers(players ?? []),
  };
}

export async function startGame(input: {
  roomCode: string;
  playerId: string;
}) {
  const lobby = await getLobby(input.roomCode);

  if (!lobby) {
    throw new Error("Game not found.");
  }

  if (lobby.game.status !== "waiting") {
    throw new Error("This game has already started.");
  }

  if (!isHostPlayer(lobby.players, input.playerId)) {
    throw new Error("Only the host can start the game.");
  }

  const minimumPlayers = minimumPlayersFor(lobby.game.mode);

  if (lobby.players.length < minimumPlayers) {
    throw new Error(
      `Need at least ${minimumPlayers} players to start this game.`,
    );
  }

  if (!lobby.game.category_id) {
    throw new Error("This game has no category selected.");
  }

  if (!lobby.game.challenge?.trim()) {
    throw new Error("This game has no challenge set.");
  }

  if (
    !Number.isInteger(lobby.game.budget) ||
    lobby.game.budget < MIN_BUDGET ||
    lobby.game.budget > MAX_BUDGET
  ) {
    throw new Error(
      `Budget must be a whole number between £${MIN_BUDGET} and £${MAX_BUDGET}.`,
    );
  }

  const listSize = listSizeForPlayerCount(lobby.players.length);
  const needed = minimumPoolSize(lobby.players.length);
  const pool = await poolItemIds(lobby.game.id);

  if (pool.length > 0) {
    const categoryItems = await loadItemsForCategory(lobby.game.category_id);
    const inCategory = new Set(categoryItems.map((item) => item.id));
    const playable = pool.filter((id) => inCategory.has(id));

    if (playable.length < needed) {
      throw new Error(
        `This game's item pool only has ${playable.length} playable items. A ${lobby.players.length}-player game needs at least ${needed}.`,
      );
    }
  } else {
    const available = await countItemsForCategory(lobby.game.category_id);
    if (available < needed) {
      throw new Error(
        `This category only has ${available} items. A ${lobby.players.length}-player game needs at least ${needed}.`,
      );
    }
  }

  const { error } = await supabase
    .from("games")
    .update({
      status: "active",
      list_size: listSize,
      starting_bidder_index: 0,
      auction_round: 0,
      auction_status: "live",
    })
    .eq("id", lobby.game.id)
    .eq("status", "waiting");

  if (error) {
    throw new Error(error.message);
  }

  await ensureLiveAuction(input.roomCode);
}
