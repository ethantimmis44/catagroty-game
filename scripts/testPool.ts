import { loadCatalogItemsForCategory } from "../lib/catalog";
import { minimumPoolSize } from "../lib/rules";

/**
 * Item ids for a test game's pool. Defaults to the smallest legal pool for the
 * player count so tests exercise the same validation a host would hit.
 */
export async function pickPool(
  categoryId: string,
  playerCount: number,
  extra = 0,
) {
  const items = await loadCatalogItemsForCategory(categoryId);
  const needed = minimumPoolSize(playerCount) + extra;

  if (items.length < needed) {
    throw new Error(
      `Category ${categoryId} has ${items.length} items, need ${needed} for a ${playerCount}-player test.`,
    );
  }

  return items.slice(0, needed).map((item) => item.id);
}
