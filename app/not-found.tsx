import { ButtonLink } from "@/components/ui/Button";
import { PageShell } from "@/components/ui/PageShell";

export default function NotFound() {
  return (
    <PageShell>
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">
          Not found
        </p>
        <h1 className="mt-3 font-display text-4xl text-foreground">
          Game not found
        </h1>
        <p className="mt-3 text-muted">
          That room code does not match a current game.
        </p>
        <div className="mt-8 flex justify-center">
          <ButtonLink href="/" className="w-full sm:w-auto sm:min-w-44">
            Back to home
          </ButtonLink>
        </div>
      </div>
    </PageShell>
  );
}
