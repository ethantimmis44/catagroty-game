"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ItemPoolPicker } from "@/components/create/ItemPoolPicker";
import { Button } from "@/components/ui/Button";
import { ChoiceGroup } from "@/components/ui/ChoiceGroup";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { GameFormCard } from "@/components/ui/GameFormCard";
import { TextArea } from "@/components/ui/TextArea";
import { TextField } from "@/components/ui/TextField";
import type { CategoryWithCount, Item } from "@/lib/catalog";
import { loadCatalogItemsForCategory } from "@/lib/catalog";
import { createGame } from "@/lib/games";
import { savePlayerId } from "@/lib/playerSession";
import {
  DEFAULT_BUDGET,
  MAX_BUDGET,
  MIN_BUDGET,
  listSizeForPlayerCount,
  minimumPoolSize,
  MULTIPLAYER_COUNTS,
  playerCountForMode,
} from "@/lib/rules";
import type { GameMode } from "@/lib/types";

type CreateGameFormProps = {
  categories: CategoryWithCount[];
};

type Step = "settings" | "pool";

export function CreateGameForm({ categories }: CreateGameFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("settings");
  const [hostName, setHostName] = useState("");
  const [mode, setMode] = useState<GameMode>("1v1");
  const [maxPlayers, setMaxPlayers] = useState<number>(4);
  const [budget, setBudget] = useState(DEFAULT_BUDGET);
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [challenge, setChallenge] = useState("");
  const [catalogue, setCatalogue] = useState<{
    categoryId: string;
    items: Item[];
  } | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const playerCount = playerCountForMode(mode, maxPlayers);
  const listSize = listSizeForPlayerCount(playerCount);
  const required = minimumPoolSize(playerCount);
  const category = categories.find((entry) => entry.id === categoryId) ?? null;
  const loaded = catalogue?.categoryId === categoryId ? catalogue : null;
  const items = loaded?.items ?? [];
  const loadingItems = step === "pool" && !loaded;

  useEffect(() => {
    if (step !== "pool" || !categoryId || loaded) {
      return;
    }

    let cancelled = false;

    loadCatalogItemsForCategory(categoryId)
      .then((rows) => {
        if (!cancelled) {
          setCatalogue({ categoryId, items: rows });
        }
      })
      .catch((err: unknown) => {
        console.error("[create] load catalogue", err);
        if (!cancelled) {
          setCatalogue({ categoryId, items: [] });
          setError("Could not load that category. Please try again.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [categoryId, loaded, step]);

  // Changing category discards the previous selection: a pool may only ever
  // contain items from the game's own category.
  function changeCategory(nextCategoryId: string) {
    setCategoryId(nextCategoryId);
    setSelectedIds([]);
    setError(null);
  }

  function validateSettings() {
    if (hostName.trim().length < 2) {
      return "Enter a name with at least 2 characters.";
    }
    if (!categoryId) {
      return "Choose a category.";
    }
    if (challenge.trim().length < 4) {
      return "Enter a short challenge, such as “fastest animals”.";
    }
    if (category && category.itemCount < required) {
      return `${category.name} only has ${category.itemCount} items. A ${playerCount}-player game needs at least ${required}. Pick another category or add more items.`;
    }
    if (!Number.isInteger(budget) || budget < MIN_BUDGET || budget > MAX_BUDGET) {
      return `Budget must be a whole number between £${MIN_BUDGET} and £${MAX_BUDGET}.`;
    }
    return null;
  }

  function handleContinue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const problem = validateSettings();
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setStep("pool");
  }

  async function handleCreate() {
    const problem = validateSettings();
    if (problem) {
      setError(problem);
      setStep("settings");
      return;
    }

    if (selectedIds.length < required) {
      const short = required - selectedIds.length;
      setError(`Select ${short} more item${short === 1 ? "" : "s"} before creating the game.`);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const { game, player } = await createGame({
        mode,
        maxPlayers: playerCount,
        budget: Math.round(budget),
        hostName: hostName.trim(),
        categoryId,
        challenge: challenge.trim(),
        itemIds: selectedIds,
      });

      savePlayerId(game.room_code, player.id);
      router.push(`/lobby/${game.room_code}`);
    } catch (err) {
      console.error("[create] createGame", err);
      setError(err instanceof Error ? err.message : "Could not create the game.");
      setSubmitting(false);
    }
  }

  if (step === "pool") {
    return (
      <GameFormCard
        wide
        eyebrow="Step 2 of 2"
        title="Choose Item Pool"
        description={`Choose which ${category?.name.toLowerCase() ?? "items"} can appear in this game. ${playerCount} players collect ${listSize} items each, and the auction picks at random from the items you include.`}
      >
        <div className="flex flex-col gap-5">
          {category ? (
            <ItemPoolPicker
              category={category}
              items={items}
              loading={loadingItems}
              selectedIds={selectedIds}
              required={required}
              onChange={setSelectedIds}
            />
          ) : null}

          <ErrorBanner message={error} />

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              variant="secondary"
              className="sm:flex-1"
              onClick={() => {
                setError(null);
                setStep("settings");
              }}
              disabled={submitting}
            >
              Back
            </Button>
            <Button
              type="button"
              className="sm:flex-1"
              onClick={() => void handleCreate()}
              disabled={submitting || selectedIds.length < required}
            >
              {submitting ? "Creating..." : "Create Game"}
            </Button>
          </div>
        </div>
      </GameFormCard>
    );
  }

  return (
    <GameFormCard
      eyebrow="Step 1 of 2"
      title="Create Game"
      description="Pick a category, write the challenge, and set the table for your room."
    >
      <form className="flex flex-col gap-5" onSubmit={handleContinue}>
        <TextField
          label="Your name"
          name="hostName"
          autoComplete="nickname"
          maxLength={20}
          value={hostName}
          onChange={(event) => setHostName(event.target.value)}
          placeholder="Host name"
          required
        />

        <ChoiceGroup
          label="Game mode"
          value={mode}
          onChange={setMode}
          options={[
            { label: "1v1", value: "1v1" },
            { label: "Multiplayer", value: "multiplayer" },
          ]}
        />

        {mode === "multiplayer" ? (
          <ChoiceGroup
            label="Number of players"
            value={maxPlayers}
            onChange={setMaxPlayers}
            options={MULTIPLAYER_COUNTS.map((count) => ({
              label: String(count),
              value: count,
            }))}
          />
        ) : (
          <p className="text-sm text-muted">1v1 games always use 2 players.</p>
        )}

        <ChoiceGroup
          label="Category"
          value={categoryId}
          onChange={changeCategory}
          options={categories.map((entry) => ({
            label: `${entry.emoji ? `${entry.emoji} ` : ""}${entry.name} (${entry.itemCount})`,
            value: entry.id,
          }))}
        />
        {category && category.itemCount < required ? (
          <p className="text-sm text-gold">
            {category.name} has {category.itemCount} items, so it cannot fill a{" "}
            {playerCount}-player game yet. It needs at least {required}.
          </p>
        ) : null}

        <TextArea
          label="Build a list of..."
          name="challenge"
          value={challenge}
          onChange={(event) => setChallenge(event.target.value)}
          placeholder="the fastest animals"
          maxLength={120}
          required
        />

        <label className="block text-left" htmlFor="budget">
          <span className="mb-2 block text-sm font-medium text-muted">
            Budget: £{budget}
          </span>
          <input
            id="budget"
            name="budget"
            type="range"
            min={MIN_BUDGET}
            max={MAX_BUDGET}
            step={1}
            value={budget}
            onChange={(event) => setBudget(Number(event.target.value))}
            className="w-full accent-gold"
          />
          <input
            className="mt-3 min-h-12 w-full rounded-xl border border-line bg-background px-4 text-base text-foreground outline-none transition-colors focus:border-gold"
            type="number"
            min={MIN_BUDGET}
            max={MAX_BUDGET}
            step={1}
            value={budget}
            onChange={(event) => setBudget(Number(event.target.value))}
            required
          />
          <span className="mt-2 block text-xs text-muted">
            Allowed range £{MIN_BUDGET}–£{MAX_BUDGET}
          </span>
        </label>

        <div className="rounded-xl border border-line bg-background/60 px-4 py-3 text-sm text-muted">
          <p>{playerCount} players</p>
          <p className="mt-1 text-foreground">
            Each player will collect:{" "}
            <span className="font-semibold text-gold">{listSize} items</span>
          </p>
          <p className="mt-1 text-foreground">
            Minimum item pool:{" "}
            <span className="font-semibold text-gold">{required} items</span>
          </p>
        </div>

        <ErrorBanner message={error} />

        <Button type="submit" className="w-full">
          Choose item pool
        </Button>
      </form>
    </GameFormCard>
  );
}
