"use client";

import { useState } from "react";
import {
  itemFocus,
  itemImageStatus,
  portraitCategory,
  resolveItemImage,
  type ItemVisualFields,
} from "@/lib/itemImage";

type ItemVisualProps = {
  item: ItemVisualFields & { name?: string | null };
  categorySlug?: string | null;
  alt?: string;
  /** Auction hero is taller; catalogue cards are compact. */
  variant?: "card" | "hero";
  className?: string;
  onBroken?: () => void;
};

/**
 * Catalogue/auction image with a controlled focal point.
 * People categories use a portrait frame and object-position from
 * image_focus_x / image_focus_y so faces stay in frame instead of a
 * centred cover crop that shears off heads on full-body photos.
 */
export function ItemVisual({
  item,
  categorySlug,
  alt,
  variant = "card",
  className = "",
  onBroken,
}: ItemVisualProps) {
  const [broken, setBroken] = useState(false);
  const url = resolveItemImage(item);
  const portrait = portraitCategory(categorySlug);
  const focus = itemFocus(item, categorySlug);
  const status = itemImageStatus(item);
  const label = alt ?? item.name ?? "Catalogue item";
  const src = !url || broken || status === "missing" ? null : url;

  const frame =
    variant === "hero"
      ? portrait
        ? "aspect-[3/4] max-h-[28rem] w-full"
        : "aspect-[4/3] w-full"
      : portrait
        ? "aspect-[3/4] w-full"
        : "aspect-square w-full";

  if (!src) {
    return (
      <div
        className={`flex items-center justify-center bg-background px-3 text-center ${frame} ${className}`}
      >
        <span className="text-xs font-semibold text-gold">
          ⚠ Missing image
        </span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-background ${frame} ${className}`}>
      <img
        src={src}
        alt={label}
        loading="lazy"
        onError={() => {
          setBroken(true);
          onBroken?.();
        }}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: `${focus.x * 100}% ${focus.y * 100}%` }}
      />
    </div>
  );
}
