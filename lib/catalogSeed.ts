import { ALL_CATALOG_ITEMS, GAME_CATEGORIES, assertUniqueCatalog } from "@/data/catalog";
import {
  slugify,
  type CatalogItem,
} from "@/data/catalog/types";
import { licensedPhotoFor } from "@/data/catalog/licensedPhotos";
import { resolveCatalogVisual, skipWikipediaFor, type ResolvedCatalogVisual } from "@/lib/catalogVisual";
import { isMissingCommonsImage, missingCommonsFiles } from "@/lib/commonsVerify";
import { isPlaceholderVisual } from "@/lib/itemImage";
import { supabase } from "@/lib/supabase";
import { wikipediaPageImages, wikipediaTitleFor } from "@/lib/wikiImage";
import type { Category, Item } from "@/lib/catalog";

const RETIRED_CATEGORY_SLUGS = new Set([
  "american-football-players-female",
  "golfers-female",
  "rugby-players-female",
  "hockey-players-female",
  "celebrities-male",
  "celebrities-female",
  "musicians-male",
  "musicians-female",
]);
const RETIRED_CATEGORY_NAMES = new Set([
  "american football players - female",
  "american football players — female",
  "golfers - female",
  "golfers — female",
  "rugby players - female",
  "rugby players — female",
  "hockey players - female",
  "hockey players — female",
  "celebrities - male",
  "celebrities — male",
  "celebrities - female",
  "celebrities — female",
  "musicians - male",
  "musicians — male",
  "musicians - female",
  "musicians — female",
]);

function itemPayload(
  item: CatalogItem,
  categoryId: string,
  image: ResolvedCatalogVisual,
) {
  const verified =
    image.art === "photo" &&
    image.image_status === "verified" &&
    Boolean(image.image_url);
  return {
    name: item.name,
    slug: slugify(item.name),
    category_id: categoryId,
    image_url: image.image_url,
    image_source: image.image_source,
    image_credit: image.image_credit,
    image_license: image.image_license,
    image_path: null as string | null,
    image_focus_x: image.image_focus_x ?? 0.5,
    image_focus_y: image.image_focus_y ?? 0.5,
    image_status: image.image_status ?? "needs_review",
    image_kind: image.image_kind ?? "photo",
    tags: item.tags ?? [],
    metadata: {
      ...(item.metadata ?? {}),
      art: image.art,
      image_kind: image.image_kind ?? "photo",
      image_status: image.image_status ?? "needs_review",
    },
    is_active: verified,
  };
}

function keepExistingPhoto(
  found: Item | undefined,
  incoming: ResolvedCatalogVisual,
): ResolvedCatalogVisual {
  if (incoming.art === "photo" && incoming.image_status === "verified" && incoming.image_url) {
    return incoming;
  }
  if (!found || isPlaceholderVisual(found) || !found.image_url) {
    return incoming;
  }
  const status =
    found.image_status === "verified" || found.image_status === "needs_review"
      ? found.image_status
      : "needs_review";
  return {
    image_url: found.image_url,
    image_source: found.image_source ?? null,
    image_credit: found.image_credit ?? null,
    image_license: found.image_license ?? null,
    image_kind: found.image_kind === "original" ? "original" : "photo",
    image_status: status,
    image_focus_x: found.image_focus_x ?? incoming.image_focus_x,
    image_focus_y: found.image_focus_y ?? incoming.image_focus_y,
    art: "photo",
  };
}

async function loadCategories() {
  const { data, error } = await supabase.from("categories").select("*");
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []) as Category[];
}

function findCategory(categories: Category[], slug: string, name: string) {
  return (
    categories.find((category) => category.slug === slug) ??
    categories.find(
      (category) => category.name.toLowerCase() === name.toLowerCase(),
    ) ??
    null
  );
}

async function upsertCategories() {
  const existing = await loadCategories();
  const byKey = [...existing];

  for (const category of GAME_CATEGORIES) {
    const row = findCategory(byKey, category.slug, category.name);
    if (row) {
      await supabase
        .from("categories")
        .update({
          name: category.name,
          slug: category.slug,
          emoji: category.emoji,
          icon: category.emoji,
        })
        .eq("id", row.id);
      row.name = category.name;
      row.slug = category.slug;
      row.emoji = category.emoji;
      continue;
    }

    const inserted = await supabase
      .from("categories")
      .upsert(
        {
          name: category.name,
          slug: category.slug,
          emoji: category.emoji,
          icon: category.emoji,
        },
        { onConflict: "slug", ignoreDuplicates: false },
      )
      .select("*");

    if (inserted.error) {
      const fallback = await supabase
        .from("categories")
        .insert({ name: category.name, emoji: category.emoji })
        .select("*");
      if (fallback.error) {
        throw new Error(inserted.error.message);
      }
      byKey.push(...((fallback.data ?? []) as Category[]));
      continue;
    }

    byKey.push(...((inserted.data ?? []) as Category[]));
  }

  return loadCategories();
}

async function retireRemovedCategories(categories: Category[]) {
  for (const category of categories) {
    const slug = (category.slug ?? "").toLowerCase();
    const name = category.name.toLowerCase();
    if (!RETIRED_CATEGORY_SLUGS.has(slug) && !RETIRED_CATEGORY_NAMES.has(name)) {
      continue;
    }

    const { error } = await supabase
      .from("items")
      .update({ is_active: false })
      .eq("category_id", category.id);

    if (error) {
      throw new Error(error.message);
    }
  }
}

async function deactivateStalePlayableItems(
  categoriesBySlug: Map<string, Category>,
) {
  for (const category of GAME_CATEGORIES) {
    const row = categoriesBySlug.get(category.slug);
    if (!row) {
      continue;
    }
    const keep = new Set(
      ALL_CATALOG_ITEMS.filter((item) => item.categories[0] === category.slug).map((item) =>
        slugify(item.name),
      ),
    );
    const { data, error } = await supabase
      .from("items")
      .select("id, slug, name")
      .eq("category_id", row.id)
      .eq("is_active", true);
    if (error) {
      throw new Error(error.message);
    }
    for (const item of (data ?? []) as { id: string; slug: string | null; name: string }[]) {
      const slug = item.slug || slugify(item.name);
      if (keep.has(slug)) {
        continue;
      }
      const { error: updateError } = await supabase
        .from("items")
        .update({ is_active: false })
        .eq("id", item.id);
      if (updateError) {
        throw new Error(updateError.message);
      }
    }
  }
}

async function loadExistingItems(categoryId: string) {
  const wide =
    "id, name, slug, image_url, image_path, image_source, image_credit, image_license, image_status, image_kind, image_focus_x, image_focus_y, metadata";
  let result = await supabase.from("items").select(wide).eq("category_id", categoryId);
  if (result.error && /image_focus|image_status|image_kind|schema cache|PGRST204/i.test(result.error.message)) {
    result = await supabase
      .from("items")
      .select("id, name, slug, image_url, image_path, image_source, image_credit, image_license, metadata")
      .eq("category_id", categoryId) as typeof result;
  }
  if (result.error) {
    throw new Error(result.error.message);
  }

  const byName = new Map<string, Item>();
  const bySlug = new Map<string, Item>();
  for (const row of (result.data ?? []) as Item[]) {
    byName.set(row.name.toLowerCase(), row);
    if (row.slug) {
      bySlug.set(row.slug, row);
    }
  }
  return { byName, bySlug };
}

const linkFailures = new Set<string>();

async function linkMembership(itemId: string, categoryId: string) {
  const { error } = await supabase.from("item_categories").upsert(
    { item_id: itemId, category_id: categoryId },
    { onConflict: "item_id,category_id" },
  );

  if (!error) {
    return;
  }

  if (/schema cache|PGRST204|does not exist|row-level security|policy/i.test(error.message)) {
    linkFailures.add(error.message);
    return;
  }

  throw new Error(error.message);
}

async function wikiLookup(
  missingFiles: Set<string>,
) {
  const titles = ALL_CATALOG_ITEMS.filter((item) => {
    const slug = item.categories[0];
    if (skipWikipediaFor(slug)) {
      return false;
    }
    if (item.image && !isMissingCommonsImage(item.image, missingFiles)) {
      return false;
    }
    return true;
  }).map(wikipediaTitleFor);

  console.log(`Resolving Wikipedia photos for ${titles.length} items...`);
  try {
    return await wikipediaPageImages(titles);
  } catch (error) {
    console.warn(
      "Wikipedia image lookup failed; only explicitly sourced Commons photos will be attached.",
      error instanceof Error ? error.message : error,
    );
    return new Map<string, null>();
  }
}

async function upsertItems(categories: Category[]) {
  const categoriesBySlug = new Map(
    GAME_CATEGORIES.map((category) => {
      const row = findCategory(categories, category.slug, category.name);
      if (!row) {
        throw new Error(`Missing category ${category.name}.`);
      }
      return [category.slug, row] as const;
    }),
  );

  const existingByCategory = new Map<
    string,
    Awaited<ReturnType<typeof loadExistingItems>>
  >();
  for (const category of categoriesBySlug.values()) {
    existingByCategory.set(category.id, await loadExistingItems(category.id));
  }

  const missingFiles = await missingCommonsFiles(
    ALL_CATALOG_ITEMS.map((item) => {
      if (skipWikipediaFor(item.categories[0])) {
        return licensedPhotoFor(item.name) ?? item.image;
      }
      return item.image;
    }).filter((image): image is NonNullable<typeof image> => Boolean(image)),
  );
  const wikiImages = await wikiLookup(missingFiles);

  const payloadsByCategory = new Map<string, ReturnType<typeof itemPayload>[]>();
  const memberships: { name: string; primaryId: string; extraIds: string[] }[] =
    [];

  for (const item of ALL_CATALOG_ITEMS) {
    const primary = categoriesBySlug.get(item.categories[0]);
    if (!primary) {
      continue;
    }

    const existing = existingByCategory.get(primary.id);
    if (!existing) {
      continue;
    }

    const slug = slugify(item.name);
    const found =
      existing.bySlug.get(slug) ?? existing.byName.get(item.name.toLowerCase());
    const extraIds = item.categories
      .slice(1)
      .map((value) => categoriesBySlug.get(value)?.id)
      .filter((id): id is string => Boolean(id));
    const image = keepExistingPhoto(
      found,
      resolveCatalogVisual(
        item,
        missingFiles,
        wikiImages.get(wikipediaTitleFor(item)) ?? null,
      ),
    );
    const payload = itemPayload(item, primary.id, image);
    if (found?.image_path && found.image_url === payload.image_url) {
      payload.image_path = found.image_path;
    }

    memberships.push({
      name: item.name,
      primaryId: primary.id,
      extraIds,
    });

    const list = payloadsByCategory.get(primary.id) ?? [];
    list.push(payload);
    payloadsByCategory.set(primary.id, list);
  }

  for (const [categoryId, payloads] of payloadsByCategory) {
    for (let index = 0; index < payloads.length; index += 50) {
      const chunk = payloads.slice(index, index + 50);
      let upserted: { data: unknown; error: { message: string } | null } | null = null;
      for (let attempt = 0; attempt < 6; attempt += 1) {
        try {
          upserted = await supabase
            .from("items")
            .upsert(chunk, {
              onConflict: "category_id,slug",
              ignoreDuplicates: false,
            })
            .select("id, name, slug, image_url");

          if (upserted.error && /image_focus|image_status|image_kind|schema cache|PGRST204/i.test(upserted.error.message)) {
            const slim = chunk.map((row) => ({
              name: row.name,
              slug: row.slug,
              category_id: row.category_id,
              image_url: row.image_url,
              image_source: row.image_source,
              image_credit: row.image_credit,
              image_license: row.image_license,
              image_path: row.image_path,
              tags: row.tags,
              metadata: row.metadata,
              is_active: row.is_active,
            }));
            upserted = await supabase
              .from("items")
              .upsert(slim, {
                onConflict: "category_id,slug",
                ignoreDuplicates: false,
              })
              .select("id, name, slug, image_url");
          }
          if (!upserted.error) {
            break;
          }
        } catch (error) {
          if (attempt === 5) {
            throw error;
          }
          await new Promise((resolve) => setTimeout(resolve, 2500 * (attempt + 1)));
        }
      }

      if (upserted?.error) {
        throw new Error(upserted.error.message);
      }

      const existing = existingByCategory.get(categoryId);
      for (const row of (upserted?.data ?? []) as Item[]) {
        existing?.byName.set(row.name.toLowerCase(), row);
        if (row.slug) {
          existing?.bySlug.set(row.slug, row);
        }
      }
    }
  }

  const refreshed = new Map<string, Awaited<ReturnType<typeof loadExistingItems>>>();
  for (const category of categoriesBySlug.values()) {
    refreshed.set(category.id, await loadExistingItems(category.id));
  }

  for (const membership of memberships) {
    const row =
      refreshed
        .get(membership.primaryId)
        ?.byName.get(membership.name.toLowerCase()) ??
      refreshed.get(membership.primaryId)?.bySlug.get(slugify(membership.name));
    if (!row) {
      continue;
    }
    await linkMembership(row.id, membership.primaryId);
    for (const extraId of membership.extraIds) {
      await linkMembership(row.id, extraId);
    }
  }

  await deactivateStalePlayableItems(categoriesBySlug);
}

export async function seedCatalog() {
  assertUniqueCatalog();
  const categories = await upsertCategories();
  await retireRemovedCategories(categories);
  await upsertItems(categories);

  if (linkFailures.size > 0) {
    console.warn(
      "Could not write cross-category memberships to item_categories. Categories still work from their primary items.",
    );
    for (const message of linkFailures) {
      console.warn(`  ${message}`);
    }
    console.warn(
      "  Fix: run supabase/migrations/20260825130000_stage11_item_categories_policies.sql, then seed again.",
    );
  }
}
