import { licensedPhotoFor } from "@/data/catalog/licensedPhotos";
import {
  defaultFocusForCategory,
  isIllustratedCategory,
  type CatalogImage,
  type CatalogItem,
} from "@/data/catalog/types";
import { isMissingCommonsImage } from "@/lib/commonsVerify";

export type ArtRole = "photo" | "none";

export type ResolvedCatalogVisual = {
  image_url: string | null;
  image_source: string | null;
  image_credit: string | null;
  image_license: string | null;
  image_kind: CatalogImage["image_kind"];
  image_status: NonNullable<CatalogImage["image_status"]>;
  image_focus_x: number;
  image_focus_y: number;
  art: ArtRole;
};

function withFocus(image: CatalogImage, categorySlug: string): ResolvedCatalogVisual {
  const focus = defaultFocusForCategory(categorySlug);
  return {
    image_url: image.image_url,
    image_source: image.image_source,
    image_credit: image.image_credit,
    image_license: image.image_license,
    image_kind: image.image_kind ?? "photo",
    image_status: image.image_status ?? "needs_review",
    image_focus_x: image.image_focus_x ?? focus.x,
    image_focus_y: image.image_focus_y ?? focus.y,
    art: "photo",
  };
}

function missingVisual(categorySlug: string): ResolvedCatalogVisual {
  const focus = defaultFocusForCategory(categorySlug);
  return {
    image_url: null,
    image_source: null,
    image_credit: null,
    image_license: null,
    image_kind: "photo",
    image_status: "missing",
    image_focus_x: focus.x,
    image_focus_y: focus.y,
    art: "none",
  };
}

export function skipWikipediaFor(categorySlug: string) {
  return isIllustratedCategory(categorySlug);
}

/**
 * Pick a visual for a seed item. Only a photograph that actually shows the
 * item is attached. Generated illustrations are never used as the item image.
 */
export function resolveCatalogVisual(
  item: CatalogItem,
  missingFiles: Set<string>,
  wiki: CatalogImage | null,
): ResolvedCatalogVisual {
  const categorySlug = item.categories[0];
  const licensed = skipWikipediaFor(categorySlug) ? licensedPhotoFor(item.name) : null;
  const sourced = licensed ?? item.image ?? null;

  if (sourced && !isMissingCommonsImage(sourced, missingFiles)) {
    return withFocus(sourced, categorySlug);
  }

  if (!skipWikipediaFor(categorySlug) && wiki) {
    return withFocus(wiki, categorySlug);
  }

  return missingVisual(categorySlug);
}
