import { ANIMAL_ITEMS } from "@/data/catalog/animals";
import { ATHLETE_ITEMS } from "@/data/catalog/athletes";
import { GAME_CATEGORIES } from "@/data/catalog/categories";
import { DC_ITEMS, MARVEL_ITEMS, MOVIE_ITEMS, VIDEO_GAME_ITEMS } from "@/data/catalog/culture";
import { TV_SHOW_ITEMS } from "@/data/catalog/tv";
import { PEOPLE_ITEMS } from "@/data/catalog/people";
import { CITY_ITEMS, COUNTRY_ITEMS } from "@/data/catalog/places";
import { BRAND_ITEMS, CAR_ITEMS, FOOD_ITEMS, SPORT_ITEMS } from "@/data/catalog/things";
import type { CatalogItem } from "@/data/catalog/types";

export { GAME_CATEGORIES };

export const ALL_CATALOG_ITEMS: CatalogItem[] = [
  ...ANIMAL_ITEMS,
  ...ATHLETE_ITEMS,
  ...PEOPLE_ITEMS,
  ...CITY_ITEMS,
  ...COUNTRY_ITEMS,
  ...MARVEL_ITEMS,
  ...DC_ITEMS,
  ...MOVIE_ITEMS,
  ...TV_SHOW_ITEMS,
  ...VIDEO_GAME_ITEMS,
  ...SPORT_ITEMS,
  ...CAR_ITEMS,
  ...FOOD_ITEMS,
  ...BRAND_ITEMS,
];

export function catalogCounts() {
  const counts = new Map<string, number>();
  for (const category of GAME_CATEGORIES) {
    counts.set(category.slug, 0);
  }
  for (const item of ALL_CATALOG_ITEMS) {
    for (const slug of item.categories) {
      counts.set(slug, (counts.get(slug) ?? 0) + 1);
    }
  }
  return counts;
}

export function assertUniqueCatalog() {
  const seen = new Set<string>();
  for (const item of ALL_CATALOG_ITEMS) {
    const key = `${item.categories[0]}::${item.name.trim().toLowerCase()}`;
    if (seen.has(key)) {
      throw new Error(`Duplicate catalogue item in ${item.categories[0]}: ${item.name}`);
    }
    seen.add(key);
  }
}
