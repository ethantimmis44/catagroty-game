"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ItemVisual } from "@/components/ui/ItemVisual";
import type { Category, Item } from "@/lib/catalog";
import { itemImageStatus } from "@/lib/itemImage";

export type ImageState = "ok" | "broken";

type HostImageStatus = "verified" | "needs_review" | "missing" | "broken";

type Filter = "all" | "with-images" | "missing" | "needs-review";

const FILTERS: { label: string; value: Filter }[] = [
  { label: "All", value: "all" },
  { label: "With images", value: "with-images" },
  { label: "Missing images", value: "missing" },
  { label: "Needs review", value: "needs-review" },
];

type ItemPoolPickerProps = {
  category: Category;
  items: Item[];
  loading: boolean;
  selectedIds: string[];
  required: number;
  onChange: (ids: string[]) => void;
};

function hostImageStatus(
  item: Item,
  imageState: Record<string, ImageState>,
): HostImageStatus {
  if (imageState[item.id] === "broken") {
    return "broken";
  }
  return itemImageStatus(item);
}

export function ItemPoolPicker({
  category,
  items,
  loading,
  selectedIds,
  required,
  onChange,
}: ItemPoolPickerProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [imageState, setImageState] = useState<Record<string, ImageState>>({});

  const selected = useMemo(() => new Set(selectedIds), [selectedIds]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((item) => {
      if (term && !item.name.toLowerCase().includes(term)) {
        return false;
      }
      const status = hostImageStatus(item, imageState);
      if (filter === "with-images") {
        return status === "verified" || status === "needs_review";
      }
      if (filter === "missing") {
        return status === "missing" || status === "broken";
      }
      if (filter === "needs-review") {
        return status === "needs_review" || status === "broken";
      }
      return true;
    });
  }, [filter, imageState, items, search]);

  const shortfall = Math.max(0, required - selected.size);

  function toggle(item: Item) {
    const next = new Set(selected);
    if (next.has(item.id)) {
      next.delete(item.id);
    } else {
      next.add(item.id);
    }
    onChange([...next]);
  }

  function markBroken(itemId: string) {
    setImageState((current) =>
      current[itemId] === "broken" ? current : { ...current, [itemId]: "broken" },
    );
  }

  if (loading) {
    return (
      <p className="py-10 text-center text-sm text-muted">
        Loading the {category.name} catalogue...
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted">
        {category.name} has no items yet. Run{" "}
        <code className="text-foreground">npm run seed:catalog</code>, then come
        back.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-line bg-surface/80 p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
              Selected
            </p>
            <p className="font-display text-3xl text-gold">{selected.size}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
              Required
            </p>
            <p className="font-display text-3xl text-foreground">{required}</p>
          </div>
        </div>
        <p
          className={`mt-3 text-sm ${shortfall > 0 ? "text-gold" : "text-emerald-400"}`}
        >
          {shortfall > 0
            ? `Select ${shortfall} more item${shortfall === 1 ? "" : "s"}.`
            : "Ready to play"}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => onChange(items.map((item) => item.id))}
        >
          Select all
        </Button>
        <Button type="button" variant="secondary" onClick={() => onChange([])}>
          Unselect all
        </Button>
      </div>

      <input
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search items..."
        aria-label="Search items"
        className="min-h-12 w-full rounded-xl border border-line bg-background px-4 text-base text-foreground outline-none transition-colors focus:border-gold"
      />

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setFilter(option.value)}
            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
              filter === option.value
                ? "border-gold bg-gold/15 text-gold"
                : "border-line text-muted hover:border-gold/50"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">
          No items match that search or filter.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {visible.map((item) => {
            const status = hostImageStatus(item, imageState);
            const isSelected = selected.has(item.id);

            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => toggle(item)}
                  aria-pressed={isSelected}
                  className={`flex h-full w-full flex-col overflow-hidden rounded-2xl border text-left transition-colors hover:border-gold/60 ${
                    isSelected
                      ? "border-gold bg-gold/10"
                      : "border-line bg-surface/70"
                  }`}
                >
                  <ItemVisual
                    item={item}
                    categorySlug={category.slug}
                    alt={item.name}
                    variant="card"
                    onBroken={() => markBroken(item.id)}
                  />

                  <div className="flex flex-1 flex-col gap-1 p-3">
                    <p className="text-sm font-semibold text-foreground">
                      {item.name}
                    </p>
                    <p
                      className={`text-xs ${status === "verified" ? "text-muted" : "text-gold"}`}
                    >
                      {status === "verified"
                        ? "✓ Verified"
                        : status === "needs_review"
                          ? "⚠ Needs review"
                          : "⚠ Missing image"}
                    </p>
                    <p className="mt-auto pt-2 text-xs font-semibold text-muted">
                      {isSelected ? "☑ Included" : "☐ Excluded"}
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
