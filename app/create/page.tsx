import { CreateGameForm } from "@/components/create/CreateGameForm";
import { GameFormCard } from "@/components/ui/GameFormCard";
import { PageShell } from "@/components/ui/PageShell";
import { getCategoriesWithCounts } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function CreateGamePage() {
  const categories = await getCategoriesWithCounts();

  if (categories.length === 0) {
    return (
      <PageShell>
        <GameFormCard
          eyebrow="Host"
          title="Create Game"
          description="Pick a category, write the challenge, and set the table for your room."
        >
          <p className="text-sm text-muted">
            No categories are available yet. Run{" "}
            <code className="text-foreground">npm run seed:catalog</code> once,
            then refresh this page.
          </p>
        </GameFormCard>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <CreateGameForm categories={categories} />
    </PageShell>
  );
}
