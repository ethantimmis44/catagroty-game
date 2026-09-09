import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const PLACEHOLDER_SOURCE = "Category Game original artwork";
const USER_AGENT = "CategoryGame/1.0 (catalogue audit; local development)";
const BATCH = 50;

type Row = {
  id: string;
  name: string;
  category_id: string;
  image_url: string | null;
  image_source: string | null;
};

type Status = "verified" | "placeholder" | "broken";

/**
 * Wiki host and file title for an image URL, or null when the URL is not a
 * wiki file. Checking file titles through the API in batches of 50 avoids the
 * rate limiting that makes healthy files look broken when fetched one by one.
 */
function wikiFile(url: string): { host: string; title: string } | null {
  const filePath = url.match(/Special:FilePath\/([^?#]+)/i);
  if (filePath?.[1]) {
    return {
      host: "commons.wikimedia.org",
      title: decodeURIComponent(filePath[1]).replace(/ /g, "_"),
    };
  }

  const upload = url.match(
    /upload\.wikimedia\.org\/wikipedia\/([a-z-]+)\/(?:thumb\/)?[0-9a-f]\/[0-9a-f]{2}\/([^/?#]+)/i,
  );
  if (upload) {
    const [, wiki, file] = upload;
    return {
      host: wiki === "commons" ? "commons.wikimedia.org" : `${wiki}.wikipedia.org`,
      title: decodeURIComponent(file).replace(/ /g, "_"),
    };
  }

  return null;
}

async function missingTitles(host: string, titles: string[]) {
  const missing = new Set<string>();

  for (let index = 0; index < titles.length; index += BATCH) {
    if (index > 0) {
      await new Promise((resolve) => setTimeout(resolve, 1200));
    }
    const chunk = titles.slice(index, index + BATCH);
    const params = new URLSearchParams({
      action: "query",
      titles: chunk.map((title) => `File:${title.replace(/_/g, " ")}`).join("|"),
      prop: "imageinfo",
      format: "json",
      formatversion: "2",
    });

    const url = `https://${host}/w/api.php?${params.toString()}`;
    let response: Response | null = null;

    // Wikimedia throttles bursts; back off rather than reporting live files
    // as missing.
    for (let attempt = 0; attempt < 6; attempt += 1) {
      response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
      if (response.ok) {
        break;
      }
      if (response.status !== 429 && response.status < 500) {
        throw new Error(`${host} API returned ${response.status}`);
      }
      await new Promise((resolve) => setTimeout(resolve, 4000 * (attempt + 1)));
      response = null;
    }

    if (!response) {
      throw new Error(`${host} API kept throttling; try again in a few minutes.`);
    }

    const payload = (await response.json()) as {
      query?: { pages?: { title: string; missing?: boolean }[] };
    };

    for (const page of payload.query?.pages ?? []) {
      if (page.missing) {
        missing.add(page.title.replace(/^File:/i, "").replace(/ /g, "_"));
      }
    }
  }

  return missing;
}

async function pagedSelect<T>(table: string, columns: string) {
  const rows: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { supabase } = await import("../lib/supabase");
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

async function main() {
  const { supabase } = await import("../lib/supabase");
  const { GAME_CATEGORIES } = await import("../data/catalog");
  const { listSizeForPlayerCount, minimumPoolSize } = await import("../lib/rules");

  const { data: categoryRows, error: categoryError } = await supabase
    .from("categories")
    .select("id, name, slug");

  if (categoryError) {
    throw new Error(categoryError.message);
  }

  const wanted = new Map(GAME_CATEGORIES.map((entry) => [entry.slug, entry]));
  const playable = ((categoryRows ?? []) as {
    id: string;
    name: string;
    slug: string | null;
  }[]).filter((entry) => entry.slug && wanted.has(entry.slug));

  const items = await pagedSelect<Row>(
    "items",
    "id, name, category_id, image_url, image_source",
  );
  const links = await pagedSelect<{ item_id: string; category_id: string }>(
    "item_categories",
    "item_id, category_id",
  );

  const byCategory = new Map<string, Set<string>>();
  function add(categoryId: string, itemId: string) {
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

  const status = new Map<string, Status>();
  const byHost = new Map<string, Map<string, string[]>>();
  let unknownHost = 0;

  for (const item of items) {
    const url = item.image_url;
    if (item.image_source === PLACEHOLDER_SOURCE || !url || url.startsWith("data:")) {
      status.set(item.id, "placeholder");
      continue;
    }

    const file = wikiFile(url);
    if (!file) {
      // Not a wiki file: nothing to verify against an API, count it as sourced.
      status.set(item.id, "verified");
      unknownHost += 1;
      continue;
    }

    const hostMap = byHost.get(file.host) ?? new Map<string, string[]>();
    const ids = hostMap.get(file.title) ?? [];
    ids.push(item.id);
    hostMap.set(file.title, ids);
    byHost.set(file.host, hostMap);
    status.set(item.id, "verified");
  }

  for (const [host, hostMap] of byHost) {
    const titles = [...hostMap.keys()];
    console.log(`Checking ${titles.length} file titles on ${host}...`);
    const missing = await missingTitles(host, titles);
    for (const title of missing) {
      for (const id of hostMap.get(title) ?? []) {
        status.set(id, "broken");
      }
    }
  }

  const itemsById = new Map(items.map((item) => [item.id, item]));
  const ordered = [...playable].sort(
    (a, b) =>
      (wanted.get(a.slug as string)?.sort_order ?? 99) -
      (wanted.get(b.slug as string)?.sort_order ?? 99),
  );

  console.log("");
  console.log("Category | Items | Verified | Needs image | Broken | Playable");

  let totalVerified = 0;
  let totalPlaceholder = 0;
  let totalBroken = 0;
  const brokenNames: string[] = [];
  const placeholderNames: string[] = [];

  for (const category of ordered) {
    const ids = [...(byCategory.get(category.id) ?? new Set<string>())];
    let verified = 0;
    let placeholder = 0;
    let broken = 0;

    for (const id of ids) {
      const state = status.get(id);
      if (state === "verified") {
        verified += 1;
      } else if (state === "broken") {
        broken += 1;
        brokenNames.push(`${category.name}: ${itemsById.get(id)?.name ?? id}`);
      } else {
        placeholder += 1;
        placeholderNames.push(`${category.name}: ${itemsById.get(id)?.name ?? id}`);
      }
    }

    totalVerified += verified;
    totalPlaceholder += placeholder;
    totalBroken += broken;

    const verdict =
      ids.length >= minimumPoolSize(6)
        ? "up to 6 players"
        : ids.length >= minimumPoolSize(2)
          ? "1v1 only"
          : "NOT PLAYABLE";

    console.log(
      `${category.name} | ${ids.length} | ${verified} | ${placeholder} | ${broken} | ${verdict}`,
    );
  }

  console.log("");
  console.log(`Categories: ${ordered.length}`);
  console.log(`Items in database: ${items.length}`);
  console.log(`Verified images: ${totalVerified} (${unknownHost} non-wiki URLs assumed good)`);
  console.log(`Placeholder art (needs a real image): ${totalPlaceholder}`);
  console.log(`Broken file references: ${totalBroken}`);
  console.log(
    `Minimum pool: 2p=${minimumPoolSize(2)} (${listSizeForPlayerCount(2)} each), 4p=${minimumPoolSize(4)}, 6p=${minimumPoolSize(6)}`,
  );

  if (brokenNames.length > 0) {
    console.log("\nBroken file references:");
    for (const entry of brokenNames) {
      console.log(`  ${entry}`);
    }
    const uniqueBroken = [
      ...new Set(brokenNames.map((entry) => entry.split(": ").slice(1).join(": "))),
    ];
    console.log("\nRe-source these with:");
    console.log(
      `  npx tsx scripts/resolve-item-images.ts "--names=${uniqueBroken.join("|")}"`,
    );
  }
  if (placeholderNames.length > 0) {
    console.log("\nStill on placeholder art:");
    for (const entry of placeholderNames) {
      console.log(`  ${entry}`);
    }
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
