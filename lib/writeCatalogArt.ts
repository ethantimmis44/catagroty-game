import fs from "node:fs";
import path from "node:path";
import { ALL_CATALOG_ITEMS } from "@/data/catalog";
import { isIllustratedCategory, slugify } from "@/data/catalog/types";
import { illustratedSvg } from "@/lib/illustratedArt";

export function writeCatalogArtFiles(root = process.cwd()) {
  let written = 0;
  for (const item of ALL_CATALOG_ITEMS) {
    const category = item.categories[0];
    if (!isIllustratedCategory(category)) {
      continue;
    }
    const dir = path.join(root, "public", "catalog-art", category);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, `${slugify(item.name)}.svg`),
      illustratedSvg(item.name, category),
    );
    written += 1;
  }
  return written;
}
