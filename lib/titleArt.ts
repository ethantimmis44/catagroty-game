import type { CatalogImage } from "@/data/catalog/types";
import { hashName, xmlEscape } from "@/lib/originalArt";

function wrapName(name: string) {
  const words = name.trim().split(/\s+/);
  if (name.length <= 18 || words.length === 1) {
    return [name];
  }
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
}

const BRAND_COLORS: Record<string, { background: string; accent: string }> = {
  nike: { background: "#111111", accent: "#f4efe4" },
  adidas: { background: "#0a0a0a", accent: "#f4efe4" },
  apple: { background: "#1c1c1e", accent: "#f4efe4" },
  google: { background: "#1a237e", accent: "#f4efe4" },
  microsoft: { background: "#0d47a1", accent: "#f4efe4" },
  amazon: { background: "#1b1208", accent: "#ff9900" },
  "coca-cola": { background: "#6a0f14", accent: "#f4efe4" },
  pepsi: { background: "#0c1c4a", accent: "#e31c23" },
  "mcdonald's": { background: "#1a1200", accent: "#ffc107" },
  starbucks: { background: "#0a2e1c", accent: "#d4e157" },
  toyota: { background: "#111111", accent: "#eb0a1e" },
  samsung: { background: "#0a1628", accent: "#1428a0" },
  sony: { background: "#111111", accent: "#f4efe4" },
  nintendo: { background: "#3b0a0a", accent: "#e60012" },
  lego: { background: "#3b1400", accent: "#fdd835" },
  ikea: { background: "#0c1c4a", accent: "#f9a825" },
  netflix: { background: "#140404", accent: "#e50914" },
  disney: { background: "#0a1a3a", accent: "#f4efe4" },
  ferrari: { background: "#4a0a0a", accent: "#ff2800" },
  rolex: { background: "#0e2418", accent: "#c9a227" },
  gucci: { background: "#0e1a10", accent: "#c9a227" },
  "louis vuitton": { background: "#1a1408", accent: "#c9a227" },
  tesla: { background: "#111111", accent: "#cc0000" },
};

/**
 * Original title-card artwork for movies, games, and brands when a freely
 * licensed still or logo cannot be stored. The name on the card is the visual.
 */
export function titleArt(
  name: string,
  categorySlug: string,
  subtitle?: string,
): CatalogImage {
  const brand = BRAND_COLORS[name.trim().toLowerCase()];
  const hue = hashName(name) % 360;
  const background = brand?.background ?? `hsl(${hue} 40% 12%)`;
  const accent = brand?.accent ?? `hsl(${(hue + 32) % 360} 70% 54%)`;
  const lines = wrapName(name);
  const kind =
    categorySlug === "video-games"
      ? "VIDEO GAME"
      : categorySlug === "brands"
        ? "BRAND"
        : "FILM";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" role="img" aria-label="${xmlEscape(name)}">
  <rect width="800" height="1000" fill="${background}"/>
  <rect x="40" y="40" width="720" height="920" fill="none" stroke="${accent}" stroke-width="6"/>
  <text x="400" y="140" text-anchor="middle" font-size="22" fill="${accent}" font-family="sans-serif" letter-spacing="8">${xmlEscape(kind)}</text>
  ${lines
    .map(
      (line, index) =>
        `<text x="400" y="${460 + index * 64}" text-anchor="middle" font-size="${lines.length > 1 ? 44 : 56}" fill="#f4efe4" font-family="Georgia, serif">${xmlEscape(line)}</text>`,
    )
    .join("")}
  ${
    subtitle
      ? `<text x="400" y="820" text-anchor="middle" font-size="28" fill="${accent}" font-family="sans-serif">${xmlEscape(subtitle)}</text>`
      : ""
  }
</svg>`;

  return {
    image_url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    image_source: "Category Game original artwork",
    image_credit: "Category Game",
    image_license: "Original game asset created for this project",
    image_kind: "original",
    image_status: "needs_review",
    image_focus_x: 0.5,
    image_focus_y: 0.5,
  };
}
