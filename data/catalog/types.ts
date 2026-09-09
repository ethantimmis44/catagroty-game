export type ImageKind = "photo" | "original";

export type ImageStatus = "verified" | "needs_review" | "missing";

export type CatalogImage = {
  image_url: string;
  image_source: string;
  image_credit: string;
  image_license: string;
  image_kind?: ImageKind;
  image_focus_x?: number;
  image_focus_y?: number;
  image_status?: ImageStatus;
};

export type CatalogCategory = {
  name: string;
  slug: string;
  emoji: string;
  sort_order: number;
};

export type CatalogItem = {
  name: string;
  categories: string[];
  image?: CatalogImage | null;
  tags?: string[];
  metadata?: Record<string, unknown>;
};

export const PEOPLE_CATEGORY_SLUGS = [
  "football-players-male",
  "football-players-female",
  "basketball-players-male",
  "basketball-players-female",
  "american-football-players-male",
  "general-athletes-male",
  "general-athletes-female",
  "tennis-players-male",
  "tennis-players-female",
  "golfers-male",
  "rugby-players-male",
  "hockey-players-male",
  "celebrities",
  "singers",
  "actors-male",
  "actors-female",
] as const;

export const HERO_CATEGORY_SLUGS = ["marvel-heroes", "dc-heroes"] as const;

export const ILLUSTRATED_CATEGORY_SLUGS = [
  "marvel-heroes",
  "dc-heroes",
  "movies",
  "video-games",
  "brands",
  "top-tv-shows",
] as const;

export const DEFAULT_IMAGE_FOCUS = { x: 0.5, y: 0.5 } as const;
export const PEOPLE_IMAGE_FOCUS = { x: 0.5, y: 0.28 } as const;

export function isPeopleCategory(slug: string | null | undefined) {
  return Boolean(slug && (PEOPLE_CATEGORY_SLUGS as readonly string[]).includes(slug));
}

export function isHeroCategory(slug: string | null | undefined) {
  return Boolean(slug && (HERO_CATEGORY_SLUGS as readonly string[]).includes(slug));
}

export function isIllustratedCategory(slug: string | null | undefined) {
  return Boolean(
    slug && (ILLUSTRATED_CATEGORY_SLUGS as readonly string[]).includes(slug),
  );
}

export function isTitleCardCategory(slug: string | null | undefined) {
  return isIllustratedCategory(slug) && !isHeroCategory(slug);
}

export function defaultFocusForCategory(slug: string | null | undefined) {
  return isPeopleCategory(slug) ? PEOPLE_IMAGE_FOCUS : DEFAULT_IMAGE_FOCUS;
}

export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function commonsImage(
  filename: string,
  credit = "Wikimedia Commons",
  focus?: { x?: number; y?: number },
): CatalogImage {
  const file = filename.replace(/^File:/i, "").replace(/ /g, "_");
  return {
    image_url: `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=1280`,
    image_source: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file)}`,
    image_credit: credit,
    image_license: "See the Wikimedia Commons file page for the license",
    image_kind: "photo",
    image_status: "verified",
    image_focus_x: focus?.x,
    image_focus_y: focus?.y,
  };
}
