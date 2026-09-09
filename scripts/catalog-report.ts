import { ALL_CATALOG_ITEMS, GAME_CATEGORIES, catalogCounts, assertUniqueCatalog } from "../data/catalog";
import { hasLicensedPhoto } from "../data/catalog/licensedPhotos";
import { isIllustratedCategory } from "../data/catalog/types";

assertUniqueCatalog();
const counts = catalogCounts();
console.log("Category | Seed items");
for (const category of GAME_CATEGORIES) {
  const items = ALL_CATALOG_ITEMS.filter((item) =>
    item.categories.includes(category.slug),
  );
  console.log(`${category.name} | ${counts.get(category.slug) ?? items.length}`);
}

const fiction = ALL_CATALOG_ITEMS.filter((item) =>
  isIllustratedCategory(item.categories[0]),
);
const withoutPhoto = fiction.filter((item) => !hasLicensedPhoto(item.name));
if (withoutPhoto.length > 0) {
  throw new Error(
    `Fiction/brand seed items must have a curated Commons photo: ${withoutPhoto
      .map((item) => item.name)
      .join(", ")}`,
  );
}

console.log(`Total seed items: ${ALL_CATALOG_ITEMS.length}`);
console.log("Hero, movie, TV, game, and brand items are limited to curated actual photos.");
