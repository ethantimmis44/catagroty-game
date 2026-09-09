import { ButtonLink } from "@/components/ui/Button";
import { PageShell } from "@/components/ui/PageShell";

const categories = [
  "Animals",
  "Movies",
  "Food",
  "Sports",
  "Cities",
  "Music",
];

export function LandingPage() {
  return (
    <PageShell>
      <div className="flex w-full flex-col items-center text-center">
        <p className="mb-5 text-xs font-semibold uppercase tracking-[0.28em] text-gold">
          Multiplayer auction
        </p>

        <h1 className="font-display text-5xl leading-none tracking-tight text-foreground sm:text-7xl">
          Category Game
        </h1>

        <p className="mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
          Bid against other players to claim the names that complete each
          category. Build the strongest collection, outspend your rivals, and
          win the table.
        </p>

        <ul className="mt-8 flex max-w-lg flex-wrap items-center justify-center gap-2">
          {categories.map((category) => (
            <li
              key={category}
              className="rounded-full border border-line bg-surface/70 px-3 py-1 text-xs font-medium tracking-wide text-muted sm:text-sm"
            >
              {category}
            </li>
          ))}
        </ul>

        <div className="mt-10 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
          <ButtonLink
            href="/create"
            variant="primary"
            className="w-full sm:w-auto sm:min-w-44"
          >
            Create Game
          </ButtonLink>
          <ButtonLink
            href="/join"
            variant="secondary"
            className="w-full sm:w-auto sm:min-w-44"
          >
            Join Game
          </ButtonLink>
        </div>
      </div>
    </PageShell>
  );
}
