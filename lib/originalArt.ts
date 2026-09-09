import type { CatalogImage } from "@/data/catalog/types";

function hashName(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function xmlEscape(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function palette(name: string) {
  const hash = hashName(name);
  const hue = hash % 360;
  return {
    background: `hsl(${hue} 42% 16%)`,
    accent: `hsl(${(hue + 28) % 360} 70% 52%)`,
    ink: "#f4efe4",
  };
}

function wrapName(name: string) {
  const words = name.trim().split(/\s+/);
  if (name.length <= 18 || words.length === 1) {
    return [name];
  }
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
}

/**
 * Generic letter-mark fallback. Used only when no photo and no character/title
 * artwork exists. Hosts see this as needs-review, never as a verified photo.
 */
export function originalGameArt(name: string, categorySlug: string): CatalogImage {
  const colors = palette(name);
  const mark = name.trim().charAt(0).toUpperCase() || "?";
  const lines = wrapName(name);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" role="img" aria-label="${xmlEscape(name)}">
  <rect width="800" height="1000" fill="${colors.background}"/>
  <circle cx="400" cy="320" r="140" fill="none" stroke="${colors.accent}" stroke-width="14"/>
  <text x="400" y="350" text-anchor="middle" font-size="120" fill="${colors.accent}" font-family="Georgia, serif">${xmlEscape(mark)}</text>
  ${lines
    .map(
      (line, index) =>
        `<text x="400" y="${620 + index * 56}" text-anchor="middle" font-size="42" fill="${colors.ink}" font-family="Georgia, serif">${xmlEscape(line)}</text>`,
    )
    .join("")}
  <text x="400" y="920" text-anchor="middle" font-size="20" fill="${colors.accent}" font-family="sans-serif">${xmlEscape(categorySlug.replace(/-/g, " "))}</text>
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

export { hashName, xmlEscape };
