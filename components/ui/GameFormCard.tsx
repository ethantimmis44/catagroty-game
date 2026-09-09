import type { ReactNode } from "react";
import Link from "next/link";

type GameFormCardProps = {
  eyebrow: string;
  title: string;
  description: string;
  /** Use the full page width, for grids such as the item pool picker. */
  wide?: boolean;
  children: ReactNode;
};

export function GameFormCard({
  eyebrow,
  title,
  description,
  wide = false,
  children,
}: GameFormCardProps) {
  return (
    <div className={`w-full ${wide ? "max-w-3xl" : "max-w-lg"}`}>
      <Link
        href="/"
        className="mb-6 inline-block text-sm text-muted transition-colors hover:text-gold"
      >
        ← Back to home
      </Link>

      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">
        {eyebrow}
      </p>
      <h1 className="mt-3 font-display text-4xl tracking-tight text-foreground sm:text-5xl">
        {title}
      </h1>
      <p className="mt-3 text-base leading-relaxed text-muted">{description}</p>

      <div className="mt-8 rounded-2xl border border-line bg-surface/80 p-5 sm:p-6">
        {children}
      </div>
    </div>
  );
}
