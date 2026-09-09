import { supabase } from "@/lib/supabase";

export const GAME_ITEMS_MIGRATION =
  "supabase/migrations/20260825120000_stage10_game_items.sql";

export type GameItem = {
  id: string;
  game_id: string;
  item_id: string;
  created_at: string;
};

/** True when Postgres/PostgREST reports that game_items has not been created yet. */
export function poolTableMissing(message: string) {
  return /game_items/i.test(message) && /does not exist|schema cache|PGRST205|42P01/i.test(message);
}

export function poolMigrationError() {
  return new Error(
    `The database is missing the item pool table. Run ${GAME_ITEMS_MIGRATION} in the Supabase SQL editor, then try again.`,
  );
}

/**
 * Item ids the host picked for this game. An empty array means the game has no
 * stored pool (older games created before pools existed), and callers should
 * fall back to the whole category.
 */
export async function poolItemIds(gameId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("game_items")
    .select("item_id")
    .eq("game_id", gameId);

  if (error) {
    if (poolTableMissing(error.message)) {
      return [];
    }
    throw new Error(error.message);
  }

  return [
    ...new Set(
      (data ?? [])
        .map((row) => (row as { item_id: unknown }).item_id)
        .filter((id): id is string => typeof id === "string"),
    ),
  ];
}

export async function savePool(gameId: string, itemIds: string[]) {
  const unique = [...new Set(itemIds)];
  if (unique.length === 0) {
    throw new Error("Select at least one item for the game pool.");
  }

  const { error } = await supabase.from("game_items").insert(
    unique.map((itemId) => ({
      game_id: gameId,
      item_id: itemId,
    })),
  );

  if (error) {
    if (poolTableMissing(error.message)) {
      throw poolMigrationError();
    }
    throw new Error(error.message);
  }

  return unique.length;
}
