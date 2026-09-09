import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const WIKI_API = "https://en.wikipedia.org/w/api.php";
const USER_AGENT =
  "CategoryGame/1.0 (catalogue image resolver; local development)";
const PLACEHOLDER_SOURCE = "Category Game original artwork";

type Row = {
  id: string;
  name: string;
  image_source: string | null;
  metadata: Record<string, unknown> | null;
};

type Resolved = {
  image_url: string;
  image_source: string;
  image_credit: string;
  image_license: string;
};

/** Wikipedia article title for an item: explicit override, else its name. */
function articleTitle(row: Row) {
  const override = row.metadata?.wikipedia;
  return typeof override === "string" && override.trim()
    ? override.trim()
    : row.name;
}

async function fetchPageImages(titles: string[]) {
  const params = new URLSearchParams({
    action: "query",
    titles: titles.join("|"),
    prop: "pageimages|pageprops",
    piprop: "original",
    ppprop: "disambiguation",
    redirects: "1",
    format: "json",
    formatversion: "2",
  });

  const response = await fetch(`${WIKI_API}?${params.toString()}`, {
    headers: { "User-Agent": USER_AGENT },
  });

  if (!response.ok) {
    throw new Error(`Wikipedia API returned ${response.status}`);
  }

  const payload = (await response.json()) as {
    query?: {
      normalized?: { from: string; to: string }[];
      redirects?: { from: string; to: string }[];
      pages?: {
        title: string;
        missing?: boolean;
        original?: { source: string };
        pageprops?: { disambiguation?: string };
      }[];
    };
  };

  // Map every requested title through normalisation and redirects to the page
  // that actually answered, so results line up with the titles we asked for.
  const alias = new Map<string, string>();
  for (const step of [
    ...(payload.query?.normalized ?? []),
    ...(payload.query?.redirects ?? []),
  ]) {
    alias.set(step.from, step.to);
  }

  function finalTitle(title: string) {
    let current = title;
    for (let hop = 0; hop < 5; hop += 1) {
      const next = alias.get(current);
      if (!next || next === current) {
        break;
      }
      current = next;
    }
    return current;
  }

  const byTitle = new Map(
    (payload.query?.pages ?? []).map((page) => [page.title, page]),
  );

  const results = new Map<string, Resolved | null>();
  for (const title of titles) {
    const page = byTitle.get(finalTitle(title));
    if (!page || page.missing || page.pageprops?.disambiguation != null) {
      results.set(title, null);
      continue;
    }
    const source = page.original?.source;
    if (!source) {
      results.set(title, null);
      continue;
    }
    results.set(title, {
      image_url: source,
      image_source: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, "_"))}`,
      image_credit: "Wikipedia / Wikimedia Commons",
      image_license: "See the Wikimedia Commons file page for the license",
    });
  }

  return results;
}

async function main() {
  const { supabase } = await import("../lib/supabase");

  // `--names A,B` re-sources specific items (used to repair the broken files
  // that `npm run catalog:audit` reports); otherwise every placeholder is filled.
  const nameArg = process.argv.find((arg) => arg.startsWith("--names="));
  const names = nameArg
    ? nameArg
        .slice("--names=".length)
        .split("|")
        .map((value) => value.trim())
        .filter(Boolean)
    : null;

  let query = supabase.from("items").select("id, name, image_source, metadata");
  query = names ? query.in("name", names) : query.eq("image_source", PLACEHOLDER_SOURCE);

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as Row[];
  if (rows.length === 0) {
    console.log("Every item already has a sourced image. Nothing to resolve.");
    return;
  }

  console.log(`Resolving images for ${rows.length} placeholder items...`);

  let updated = 0;
  const unresolved: string[] = [];

  for (let index = 0; index < rows.length; index += 40) {
    const chunk = rows.slice(index, index + 40);
    const titles = [...new Set(chunk.map(articleTitle))];

    let results: Map<string, Resolved | null>;
    try {
      results = await fetchPageImages(titles);
    } catch (err) {
      console.error(
        `Batch starting at ${index} failed:`,
        err instanceof Error ? err.message : err,
      );
      continue;
    }

    for (const row of chunk) {
      const resolved = results.get(articleTitle(row));
      if (!resolved) {
        unresolved.push(row.name);
        continue;
      }

      const { error: updateError } = await supabase
        .from("items")
        .update(resolved)
        .eq("id", row.id);

      if (updateError) {
        console.error(`Could not update ${row.name}: ${updateError.message}`);
        continue;
      }

      updated += 1;
    }

    process.stdout.write(`  ${Math.min(index + 40, rows.length)}/${rows.length}\r`);
  }

  console.log(`\nResolved ${updated} images from Wikipedia.`);
  if (unresolved.length > 0) {
    console.log(
      `${unresolved.length} items have no article photo and keep placeholder art:`,
    );
    console.log(unresolved.join(", "));
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
