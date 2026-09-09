import type { CatalogImage } from "@/data/catalog/types";

const WIKI_API = "https://en.wikipedia.org/w/api.php";
const USER_AGENT = "CategoryGame/1.0 (catalogue image resolver; local development)";
const BATCH = 20;

type WikiPage = {
  title: string;
  missing?: boolean;
  original?: { source: string };
  thumbnail?: { source: string };
  pageprops?: { disambiguation?: string };
};

function asImage(page: WikiPage, sourceUrl: string): CatalogImage {
  return {
    image_url: sourceUrl,
    image_source: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, "_"))}`,
    image_credit: "Wikipedia / Wikimedia Commons",
    image_license: "See the Wikimedia Commons file page for the license",
    image_kind: "photo",
    // Lead image of this item's Wikipedia article, not "a file happened to load".
    image_status: "verified",
  };
}

async function fetchWiki(params: URLSearchParams) {
  const url = `${WIKI_API}?${params.toString()}`;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
    });
    if (response.ok) {
      return response.json() as Promise<{
        query?: {
          normalized?: { from: string; to: string }[];
          redirects?: { from: string; to: string }[];
          pages?: WikiPage[];
        };
      }>;
    }
    if (response.status !== 429 && response.status < 500) {
      throw new Error(`Wikipedia API returned ${response.status}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 3000 * (attempt + 1)));
  }
  throw new Error("Wikipedia API returned 429");
}

/**
 * Batch-resolve page images from English Wikipedia. Titles that miss, redirect
 * to a disambiguation page, or have no infobox image return null so callers
 * can fall back to original artwork instead of borrowing another item's photo.
 */
export async function wikipediaPageImages(titles: string[]) {
  const unique = [...new Set(titles.map((title) => title.trim()).filter(Boolean))];
  const results = new Map<string, CatalogImage | null>();
  if (unique.length === 0) {
    return results;
  }

  for (let index = 0; index < unique.length; index += BATCH) {
    const chunk = unique.slice(index, index + BATCH);
    const params = new URLSearchParams({
      action: "query",
      titles: chunk.join("|"),
      prop: "pageimages|pageprops",
      piprop: "thumbnail|original",
      pithumbsize: "1280",
      ppprop: "disambiguation",
      redirects: "1",
      format: "json",
      formatversion: "2",
    });

    const payload = await fetchWiki(params);

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

    for (const title of chunk) {
      const page = byTitle.get(finalTitle(title));
      if (!page || page.missing || page.pageprops?.disambiguation != null) {
        results.set(title, null);
        continue;
      }
      const source = page.thumbnail?.source ?? page.original?.source;
      results.set(title, source ? asImage(page, source) : null);
    }

    if (index + BATCH < unique.length) {
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
  }

  return results;
}

const COMMONS_API = "https://commons.wikimedia.org/w/api.php";

type CommonsSearchPage = {
  title?: string;
  missing?: boolean;
  imageinfo?: { url?: string; thumburl?: string; mime?: string }[];
};

function lastName(name: string) {
  const parts = name.trim().split(/\s+/);
  return (parts[parts.length - 1] ?? name).replace(/[^a-zA-Z0-9-]/g, "");
}

/**
 * Find a Commons file whose title mentions the person/place, used when
 * Wikipedia has no pageimage. Does not scrape search engines.
 */
export async function commonsSearchImages(names: string[]) {
  const unique = [...new Set(names.map((name) => name.trim()).filter(Boolean))];
  const results = new Map<string, CatalogImage | null>();

  for (const name of unique) {
    const params = new URLSearchParams({
      action: "query",
      generator: "search",
      gsrsearch: name,
      gsrnamespace: "6",
      gsrlimit: "8",
      prop: "imageinfo",
      iiprop: "url|mime",
      iiurlwidth: "1280",
      format: "json",
      formatversion: "2",
    });

    try {
      const response = await fetch(`${COMMONS_API}?${params.toString()}`, {
        headers: { "User-Agent": USER_AGENT },
      });
      if (!response.ok) {
        results.set(name, null);
        continue;
      }
      const payload = (await response.json()) as {
        query?: { pages?: CommonsSearchPage[] };
      };
      const needle = lastName(name).toLowerCase();
      const pages = payload.query?.pages ?? [];
      const match = pages.find((page) => {
        const title = (page.title ?? "").replace(/^File:/i, "");
        const mime = page.imageinfo?.[0]?.mime ?? "";
        if (!mime.startsWith("image/")) {
          return false;
        }
        if (needle && !title.toLowerCase().includes(needle.toLowerCase())) {
          return false;
        }
        return Boolean(page.imageinfo?.[0]?.thumburl ?? page.imageinfo?.[0]?.url);
      }) ?? pages.find((page) => {
        const mime = page.imageinfo?.[0]?.mime ?? "";
        return mime.startsWith("image/") && Boolean(page.imageinfo?.[0]?.url);
      });

      const info = match?.imageinfo?.[0];
      const source = info?.thumburl ?? info?.url;
      if (!match || !source) {
        results.set(name, null);
        continue;
      }
      const file = (match.title ?? "").replace(/^File:/i, "").replace(/ /g, "_");
      results.set(name, {
        image_url: source,
        image_source: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file)}`,
        image_credit: "Wikimedia Commons",
        image_license: "See the Wikimedia Commons file page for the license",
        image_kind: "photo",
        image_status: "needs_review",
      });
    } catch {
      results.set(name, null);
    }

    await new Promise((resolve) => setTimeout(resolve, 400));
  }

  return results;
}

export function wikipediaTitleFor(item: {
  name: string;
  metadata?: Record<string, unknown>;
}) {
  const override = item.metadata?.wikipedia;
  return typeof override === "string" && override.trim()
    ? override.trim()
    : item.name;
}
