import { GAME_CATEGORIES } from "@/data/catalog";
import { resolveItemImage } from "@/lib/itemImage";
import { supabase } from "@/lib/supabase";

export type Category = {
  id: string;
  created_at: string;
  name: string;
  emoji: string | null;
  slug?: string | null;
  icon?: string | null;
};

export type Item = {
  id: string;
  created_at: string;
  name: string;
  category_id: string;
  image_url: string | null;
  image_path?: string | null;
  image_source?: string | null;
  image_credit?: string | null;
  image_license?: string | null;
  image_focus_x?: number | null;
  image_focus_y?: number | null;
  image_status?: string | null;
  image_kind?: string | null;
  metadata?: Record<string, unknown> | null;
  tags?: string[] | null;
  slug?: string | null;
  is_active?: boolean | null;
};

const GAME_SLUGS = new Set(GAME_CATEGORIES.map((category) => category.slug));
const GAME_NAMES = new Set(GAME_CATEGORIES.map((category) => category.name));

function asRecord(value: unknown) {
  return (value ?? {}) as Record<string, unknown>;
}

export function itemHasVisual(item: Pick<Item, "image_url" | "image_path"> & {
  image_source?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  return Boolean(resolveItemImage(item));
}

export async function getCategory(categoryId: string): Promise<Category | null> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("id", categoryId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as Category | null) ?? null;
}

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const order = new Map(
    GAME_CATEGORIES.map((category) => [category.slug, category.sort_order]),
  );
  const nameOrder = new Map(
    GAME_CATEGORIES.map((category) => [category.name, category.sort_order]),
  );

  return ((data ?? []) as Category[])
    .filter((category) => {
      if (category.slug) {
        return GAME_SLUGS.has(category.slug);
      }
      return GAME_NAMES.has(category.name);
    })
    .sort((a, b) => {
      const aRank =
        (a.slug ? order.get(a.slug) : undefined) ??
        nameOrder.get(a.name) ??
        99;
      const bRank =
        (b.slug ? order.get(b.slug) : undefined) ??
        nameOrder.get(b.name) ??
        99;
      return aRank - bRank;
    });
}

export type CategoryWithCount = Category & { itemCount: number };

async function pagedSelect<T>(
  table: string,
  columns: string,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .range(from, from + 999);

    if (error) {
      if (/does not exist|schema cache|PGRST205/i.test(error.message)) {
        return rows;
      }
      throw new Error(error.message);
    }

    const page = (data ?? []) as T[];
    rows.push(...page);
    if (page.length < 1000) {
      return rows;
    }
  }
}

/**
 * Categories with how many items each one can offer, so the host can see at a
 * glance which categories have enough items for the game they are setting up.
 */
export async function getCategoriesWithCounts(): Promise<CategoryWithCount[]> {
  const categories = await getCategories();
  if (categories.length === 0) {
    return [];
  }

  const [items, links] = await Promise.all([
    pagedSelect<{ id: string; category_id: string; is_active: boolean | null }>(
      "items",
      "id, category_id, is_active",
    ),
    pagedSelect<{ item_id: string; category_id: string }>(
      "item_categories",
      "item_id, category_id",
    ),
  ]);

  const active = new Set(
    items.filter((item) => item.is_active !== false).map((item) => item.id),
  );

  const byCategory = new Map<string, Set<string>>();
  function add(categoryId: string, itemId: string) {
    if (!active.has(itemId)) {
      return;
    }
    const set = byCategory.get(categoryId) ?? new Set<string>();
    set.add(itemId);
    byCategory.set(categoryId, set);
  }

  for (const item of items) {
    add(item.category_id, item.id);
  }
  for (const link of links) {
    add(link.category_id, link.item_id);
  }

  return categories.map((category) => ({
    ...category,
    itemCount: byCategory.get(category.id)?.size ?? 0,
  }));
}

async function itemIdsForCategory(categoryId: string) {
  const ids = new Set<string>();

  const { data: primary, error: primaryError } = await supabase
    .from("items")
    .select("id")
    .eq("category_id", categoryId);

  if (primaryError) {
    throw new Error(primaryError.message);
  }
  for (const row of primary ?? []) {
    ids.add(String(asRecord(row).id));
  }

  const membership = await supabase
    .from("item_categories")
    .select("item_id")
    .eq("category_id", categoryId);

  if (!membership.error) {
    for (const row of membership.data ?? []) {
      ids.add(String(asRecord(row).item_id));
    }
  }

  return [...ids];
}

export async function countItemsForCategory(categoryId: string) {
  const items = await loadItemsForCategory(categoryId);
  return items.length;
}

export async function loadItemsForCategory(categoryId: string): Promise<Item[]> {
  const items = await loadCatalogItemsForCategory(categoryId);
  return items.filter(itemHasVisual);
}

/**
 * Every active item in a category, including ones with no image. The host's
 * pool picker needs these so missing artwork is visible instead of silently
 * disappearing from the catalogue.
 */
export async function loadCatalogItemsForCategory(
  categoryId: string,
): Promise<Item[]> {
  const ids = await itemIdsForCategory(categoryId);
  if (ids.length === 0) {
    return [];
  }

  const { data, error } = await supabase.from("items").select("*").in("id", ids);
  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as Item[])
    .filter((item) => item.is_active !== false)
    .sort((a, b) => a.name.localeCompare(b.name));
}
