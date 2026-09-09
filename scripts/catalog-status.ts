import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

type Row = {
  id: string;
  name: string;
  category_id: string;
  image_url: string | null;
  image_path: string | null;
  image_source: string | null;
  image_license: string | null;
  image_status: string | null;
  is_active: boolean | null;
  metadata: Record<string, unknown> | null;
};

type Verdict = "VALID ACTUAL IMAGE" | "PLACEHOLDER" | "MISSING" | "NEEDS REVIEW";

function previewUrl(url: string | null) {
  if (!url) {
    return "—";
  }
  return url.length > 72 ? `${url.slice(0, 69)}...` : url;
}

async function main() {
  const { supabase } = await import("../lib/supabase");
  const { GAME_CATEGORIES } = await import("../data/catalog");
  const { isPlaceholderVisual, itemImageStatus, resolveItemImage } = await import(
    "../lib/itemImage"
  );

  const { data: categoryRows, error: categoryError } = await supabase
    .from("categories")
    .select("id, name, slug");
  if (categoryError) {
    throw new Error(categoryError.message);
  }

  const wanted = new Map(GAME_CATEGORIES.map((entry) => [entry.slug, entry]));
  const playableCategories = (
    (categoryRows ?? []) as { id: string; name: string; slug: string | null }[]
  )
    .filter((entry) => entry.slug && wanted.has(entry.slug))
    .sort(
      (a, b) =>
        (wanted.get(a.slug as string)?.sort_order ?? 99) -
        (wanted.get(b.slug as string)?.sort_order ?? 99),
    );

  const items: Row[] = [];
  for (let from = 0; ; from += 1000) {
    let page = await supabase
      .from("items")
      .select(
        "id, name, category_id, image_url, image_path, image_source, image_license, image_status, is_active, metadata",
      )
      .range(from, from + 999);
    if (page.error && /image_status|image_license|schema cache|PGRST204/i.test(page.error.message)) {
      page = await supabase
        .from("items")
        .select("id, name, category_id, image_url, image_path, image_source, is_active, metadata")
        .range(from, from + 999) as typeof page;
    }
    if (page.error) {
      throw new Error(page.error.message);
    }
    const rows = page.data ?? [];
    items.push(...(rows as Row[]));
    if (rows.length < 1000) {
      break;
    }
  }

  const playable = items.filter((item) => item.is_active !== false);

  const rows: {
    category: string;
    name: string;
    image: string;
    status: string;
    source: string;
    verdict: Verdict;
  }[] = [];

  for (const category of playableCategories) {
    const categoryItems = playable.filter((item) => item.category_id === category.id);
    for (const item of categoryItems) {
      const url = resolveItemImage(item);
      const status = itemImageStatus(item);
      const source = item.image_source?.trim() || "—";
      let verdict: Verdict;
      if (isPlaceholderVisual(item)) {
        verdict = "PLACEHOLDER";
      } else if (!url || status === "missing") {
        verdict = "MISSING";
      } else if (status !== "verified") {
        verdict = "NEEDS REVIEW";
      } else {
        verdict = "VALID ACTUAL IMAGE";
      }
      rows.push({
        category: category.name,
        name: item.name,
        image: previewUrl(item.image_url),
        status: status,
        source,
        verdict,
      });
    }
  }

  console.log("Category | Item | Image | Image status | Image source | Verdict");
  const problems = rows.filter((row) => row.verdict !== "VALID ACTUAL IMAGE");
  const listAll = process.argv.includes("--all");
  const listed = listAll ? rows : problems;
  for (const row of listed) {
    console.log(
      `${row.category} | ${row.name} | ${row.image} | ${row.status} | ${row.source} | ${row.verdict}`,
    );
  }
  if (!listAll && problems.length === 0) {
    console.log("(every playable item is a valid actual image; pass --all to list them)");
  }

  console.log("");
  console.log("Category | Items | Valid | Placeholder | Missing | Needs review");
  for (const category of playableCategories) {
    const group = rows.filter((row) => row.category === category.name);
    const valid = group.filter((row) => row.verdict === "VALID ACTUAL IMAGE").length;
    const placeholder = group.filter((row) => row.verdict === "PLACEHOLDER").length;
    const missing = group.filter((row) => row.verdict === "MISSING").length;
    const review = group.filter((row) => row.verdict === "NEEDS REVIEW").length;
    console.log(
      `${category.name} | ${group.length} | ${valid} | ${placeholder} | ${missing} | ${review}`,
    );
  }

  const valid = rows.filter((row) => row.verdict === "VALID ACTUAL IMAGE").length;
  const placeholder = rows.filter((row) => row.verdict === "PLACEHOLDER").length;
  const missing = rows.filter((row) => row.verdict === "MISSING").length;
  const review = rows.filter((row) => row.verdict === "NEEDS REVIEW").length;

  console.log("");
  console.log(`Total playable items: ${rows.length}`);
  console.log(`Actual valid images: ${valid}`);
  console.log(`Placeholder images: ${placeholder}`);
  console.log(`Missing images: ${missing}`);
  console.log(`Needs review: ${review}`);

  const spot = [
    "Cyclops",
    "Daredevil",
    "Deadpool",
    "Doctor Strange",
    "Drax",
    "Falcon",
    "Among Us",
    "Animal Crossing",
    "Call of Duty",
    "Candy Crush Saga",
    "Iron Man",
    "Spider-Man",
    "Batman",
    "Superman",
    "Minecraft",
  ];
  console.log("\nSpot check:");
  for (const name of spot) {
    const matches = rows.filter((row) => row.name === name);
    if (matches.length === 0) {
      console.log(`  ${name}: not playable (no approved actual image)`);
      continue;
    }
    for (const match of matches) {
      console.log(`  ${match.category}: ${match.name} → ${match.verdict} (${match.source})`);
    }
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
