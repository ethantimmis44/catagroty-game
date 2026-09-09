import {
  defaultFocusForCategory,
  isPeopleCategory,
  type ImageKind,
  type ImageStatus,
} from "@/data/catalog/types";

export function publicStorageUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) {
    return null;
  }
  return `${base.replace(/\/$/, "")}/storage/v1/object/public/item-images/${path.replace(/^\//, "")}`;
}

export const PLACEHOLDER_IMAGE_SOURCE = "Category Game original artwork";

const PLACEHOLDER_ART = new Set(["illustration", "character", "title", "fallback"]);

export type ItemVisualFields = {
  image_url?: string | null;
  image_path?: string | null;
  image_source?: string | null;
  image_credit?: string | null;
  image_kind?: ImageKind | string | null;
  image_status?: ImageStatus | string | null;
  image_focus_x?: number | null;
  image_focus_y?: number | null;
  metadata?: Record<string, unknown> | null;
};

function metadataString(item: ItemVisualFields, key: string) {
  const value = item.metadata?.[key];
  return typeof value === "string" ? value : null;
}

function rawImageUrl(item: ItemVisualFields) {
  if (item.image_path) {
    return publicStorageUrl(item.image_path) ?? item.image_url ?? null;
  }
  return item.image_url ?? null;
}

/**
 * Generated vector cards, initials, and generic category art. These are files,
 * but they do not represent the item.
 */
export function isPlaceholderVisual(item: ItemVisualFields) {
  const art = metadataString(item, "art");
  if (art && PLACEHOLDER_ART.has(art)) {
    return true;
  }
  if (item.image_source === PLACEHOLDER_IMAGE_SOURCE) {
    return true;
  }
  const url = item.image_url ?? "";
  if (url.startsWith("data:")) {
    return true;
  }
  if (url.startsWith("/catalog-art/")) {
    return true;
  }
  if ((item.image_path ?? "").includes("catalog-art")) {
    return true;
  }
  return false;
}

export function hasFallbackArtwork(item: ItemVisualFields) {
  return isPlaceholderVisual(item);
}

export function hasPlaceholderImage(item: ItemVisualFields) {
  return isPlaceholderVisual(item) || !rawImageUrl(item);
}

/**
 * URL to display. Placeholder artwork is not a visual of the item, so it is
 * not returned.
 */
export function resolveItemImage(item: ItemVisualFields) {
  if (isPlaceholderVisual(item)) {
    return null;
  }
  return rawImageUrl(item);
}

export function itemImageKind(item: ItemVisualFields): ImageKind | null {
  if (isPlaceholderVisual(item) || !resolveItemImage(item)) {
    return null;
  }
  if (item.image_kind === "photo" || item.image_kind === "original") {
    return item.image_kind;
  }
  const fromMeta = metadataString(item, "image_kind");
  if (fromMeta === "photo" || fromMeta === "original") {
    return fromMeta;
  }
  return "photo";
}

/**
 * Host/game status. A file existing is not enough. Verified means a real
 * image was explicitly marked as representing this item.
 */
export function itemImageStatus(item: ItemVisualFields): ImageStatus {
  if (isPlaceholderVisual(item)) {
    return "missing";
  }
  const url = rawImageUrl(item);
  const stored =
    item.image_status === "verified" ||
    item.image_status === "needs_review" ||
    item.image_status === "missing"
      ? item.image_status
      : metadataString(item, "image_status");
  if (!url || stored === "missing") {
    return "missing";
  }
  if (stored === "verified") {
    return "verified";
  }
  return "needs_review";
}

export function itemFocus(
  item: ItemVisualFields,
  categorySlug?: string | null,
) {
  const fallback = defaultFocusForCategory(categorySlug);
  const x =
    typeof item.image_focus_x === "number"
      ? item.image_focus_x
      : fallback.x;
  const y =
    typeof item.image_focus_y === "number"
      ? item.image_focus_y
      : fallback.y;
  return {
    x: Math.min(1, Math.max(0, x)),
    y: Math.min(1, Math.max(0, y)),
  };
}

export function portraitCategory(categorySlug?: string | null) {
  return isPeopleCategory(categorySlug);
}
