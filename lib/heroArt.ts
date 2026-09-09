import type { CatalogImage } from "@/data/catalog/types";
import { hashName, xmlEscape } from "@/lib/originalArt";

type HeroStyle = {
  background: string;
  accent: string;
  ink: string;
  mark: string;
};

const MARVEL: Record<string, HeroStyle> = {
  "spider-man": { background: "#4a0d12", accent: "#e31c23", ink: "#f4efe4", mark: "✶" },
  "iron man": { background: "#2a1408", accent: "#d4a017", ink: "#f4efe4", mark: "◈" },
  "captain america": { background: "#0c1c3d", accent: "#c4122f", ink: "#f4efe4", mark: "◎" },
  "black panther": { background: "#0b0b12", accent: "#7b5ea7", ink: "#f4efe4", mark: "▲" },
  thor: { background: "#1a2433", accent: "#c9a227", ink: "#f4efe4", mark: "⚡" },
  hulk: { background: "#10240f", accent: "#4caf50", ink: "#f4efe4", mark: "H" },
  "black widow": { background: "#1a0a0a", accent: "#b71c1c", ink: "#f4efe4", mark: "◆" },
  "doctor strange": { background: "#1a1030", accent: "#e0b34a", ink: "#f4efe4", mark: "✧" },
  "scarlet witch": { background: "#2a0a14", accent: "#c62828", ink: "#f4efe4", mark: "◇" },
  "captain marvel": { background: "#1a2040", accent: "#f0c040", ink: "#f4efe4", mark: "★" },
  wolverine: { background: "#1c1408", accent: "#f9a825", ink: "#f4efe4", mark: "⨯" },
  storm: { background: "#0e1a28", accent: "#90caf9", ink: "#f4efe4", mark: "☁" },
  deadpool: { background: "#3b0a0a", accent: "#d32f2f", ink: "#f4efe4", mark: "D" },
  "ant-man": { background: "#3b1010", accent: "#c62828", ink: "#f4efe4", mark: "A" },
  wasp: { background: "#1a1428", accent: "#fdd835", ink: "#f4efe4", mark: "W" },
  hawkeye: { background: "#1c2430", accent: "#8d6e63", ink: "#f4efe4", mark: "➳" },
  falcon: { background: "#1a2038", accent: "#ef6c00", ink: "#f4efe4", mark: "F" },
  "nick fury": { background: "#121212", accent: "#546e7a", ink: "#f4efe4", mark: "N" },
  loki: { background: "#0d2818", accent: "#2e7d32", ink: "#f4efe4", mark: "L" },
  groot: { background: "#1a140c", accent: "#6d4c41", ink: "#f4efe4", mark: "G" },
  "star-lord": { background: "#1c1010", accent: "#d84315", ink: "#f4efe4", mark: "S" },
  gamora: { background: "#0e2418", accent: "#2e7d32", ink: "#f4efe4", mark: "G" },
  "ms. marvel": { background: "#1a1030", accent: "#e040fb", ink: "#f4efe4", mark: "M" },
  "shang-chi": { background: "#2a1008", accent: "#e65100", ink: "#f4efe4", mark: "S" },
  daredevil: { background: "#3b0a0a", accent: "#c62828", ink: "#f4efe4", mark: "DD" },
  "moon knight": { background: "#12141c", accent: "#eceff1", ink: "#f4efe4", mark: "☽" },
  "she-hulk": { background: "#143018", accent: "#66bb6a", ink: "#f4efe4", mark: "SH" },
  vision: { background: "#2a0c14", accent: "#e53935", ink: "#f4efe4", mark: "V" },
  "winter soldier": { background: "#121820", accent: "#90a4ae", ink: "#f4efe4", mark: "★" },
  "war machine": { background: "#121212", accent: "#b0bec5", ink: "#f4efe4", mark: "WM" },
  rocket: { background: "#1a120c", accent: "#ff7043", ink: "#f4efe4", mark: "R" },
  drax: { background: "#102018", accent: "#26a69a", ink: "#f4efe4", mark: "X" },
  nebula: { background: "#0c1c28", accent: "#29b6f6", ink: "#f4efe4", mark: "N" },
  mantis: { background: "#142014", accent: "#aed581", ink: "#f4efe4", mark: "M" },
  "miles morales": { background: "#0d0d14", accent: "#e040fb", ink: "#f4efe4", mark: "✶" },
  "spider-gwen": { background: "#eceff1", accent: "#ec407a", ink: "#1a1a1a", mark: "✶" },
  "professor x": { background: "#101828", accent: "#5c6bc0", ink: "#f4efe4", mark: "X" },
  magneto: { background: "#1a0a14", accent: "#8e24aa", ink: "#f4efe4", mark: "M" },
  "jean grey": { background: "#2a0c0c", accent: "#ef6c00", ink: "#f4efe4", mark: "J" },
  cyclops: { background: "#1a1020", accent: "#c62828", ink: "#f4efe4", mark: "C" },
  blade: { background: "#0a0a0a", accent: "#b71c1c", ink: "#f4efe4", mark: "B" },
  "ghost rider": { background: "#1a0a00", accent: "#ff6f00", ink: "#f4efe4", mark: "☠" },
  "silver surfer": { background: "#263238", accent: "#eceff1", ink: "#f4efe4", mark: "≈" },
  punisher: { background: "#0a0a0a", accent: "#fafafa", ink: "#f4efe4", mark: "†" },
};

const DC: Record<string, HeroStyle> = {
  superman: { background: "#0c1c3d", accent: "#c4122f", ink: "#f4efe4", mark: "S" },
  batman: { background: "#0b0d14", accent: "#f4c430", ink: "#f4efe4", mark: "▲" },
  "wonder woman": { background: "#1a0a10", accent: "#d4a017", ink: "#f4efe4", mark: "W" },
  "the flash": { background: "#3b0a0a", accent: "#f9a825", ink: "#f4efe4", mark: "»" },
  aquaman: { background: "#0a2430", accent: "#f9a825", ink: "#f4efe4", mark: "A" },
  "green lantern": { background: "#0a2010", accent: "#43a047", ink: "#f4efe4", mark: "◎" },
  cyborg: { background: "#121418", accent: "#78909c", ink: "#f4efe4", mark: "C" },
  "martian manhunter": { background: "#0c1c14", accent: "#2e7d32", ink: "#f4efe4", mark: "M" },
  supergirl: { background: "#0c1c3d", accent: "#c4122f", ink: "#f4efe4", mark: "S" },
  batgirl: { background: "#0b0d14", accent: "#f4c430", ink: "#f4efe4", mark: "▲" },
  nightwing: { background: "#0a1224", accent: "#29b6f6", ink: "#f4efe4", mark: "N" },
  robin: { background: "#0d1a0d", accent: "#e53935", ink: "#f4efe4", mark: "R" },
  "harley quinn": { background: "#1a0a14", accent: "#ec407a", ink: "#f4efe4", mark: "HQ" },
  catwoman: { background: "#121212", accent: "#9c27b0", ink: "#f4efe4", mark: "C" },
  joker: { background: "#0d1a12", accent: "#8e24aa", ink: "#f4efe4", mark: "J" },
  "lex luthor": { background: "#1a1a14", accent: "#9e9d24", ink: "#f4efe4", mark: "L" },
  "green arrow": { background: "#0a2010", accent: "#43a047", ink: "#f4efe4", mark: "➳" },
  shazam: { background: "#3b1408", accent: "#f9a825", ink: "#f4efe4", mark: "⚡" },
  "black canary": { background: "#121018", accent: "#fdd835", ink: "#f4efe4", mark: "BC" },
  zatanna: { background: "#120a1a", accent: "#7e57c2", ink: "#f4efe4", mark: "Z" },
  hawkman: { background: "#1a1208", accent: "#ef6c00", ink: "#f4efe4", mark: "H" },
  hawkgirl: { background: "#1a1008", accent: "#ef6c00", ink: "#f4efe4", mark: "H" },
  raven: { background: "#12081c", accent: "#7b1fa2", ink: "#f4efe4", mark: "R" },
  starfire: { background: "#2a1408", accent: "#ff7043", ink: "#f4efe4", mark: "★" },
  "beast boy": { background: "#0e2410", accent: "#66bb6a", ink: "#f4efe4", mark: "BB" },
  "poison ivy": { background: "#0a1c10", accent: "#2e7d32", ink: "#f4efe4", mark: "P" },
  "blue beetle": { background: "#0a1a2a", accent: "#0288d1", ink: "#f4efe4", mark: "BB" },
  constantine: { background: "#14120c", accent: "#c0a062", ink: "#f4efe4", mark: "JC" },
  "swamp thing": { background: "#0a1a0c", accent: "#33691e", ink: "#f4efe4", mark: "ST" },
  "black adam": { background: "#101018", accent: "#f9a825", ink: "#f4efe4", mark: "BA" },
  deathstroke: { background: "#1a0c08", accent: "#ef6c00", ink: "#f4efe4", mark: "DS" },
  "red hood": { background: "#1a0808", accent: "#c62828", ink: "#f4efe4", mark: "RH" },
  batwoman: { background: "#0b0d14", accent: "#c62828", ink: "#f4efe4", mark: "▲" },
  "static shock": { background: "#0c1020", accent: "#7c4dff", ink: "#f4efe4", mark: "⚡" },
  "plastic man": { background: "#3b0a0a", accent: "#e53935", ink: "#f4efe4", mark: "PM" },
};

function styleFor(name: string, categorySlug: string): HeroStyle {
  const key = name.trim().toLowerCase();
  const table = categorySlug.includes("dc") ? DC : MARVEL;
  if (table[key]) {
    return table[key];
  }
  for (const [entry, style] of Object.entries(table)) {
    if (key.includes(entry) || entry.includes(key)) {
      return style;
    }
  }
  const hue = hashName(name) % 360;
  return {
    background: `hsl(${hue} 48% 12%)`,
    accent: `hsl(${(hue + 24) % 360} 72% 52%)`,
    ink: "#f4efe4",
    mark: name.trim().charAt(0).toUpperCase() || "?",
  };
}

function wrapName(name: string) {
  const words = name.trim().split(/\s+/);
  if (name.length <= 16 || words.length === 1) {
    return [name];
  }
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
}

/**
 * Original Category Game character cards. Costume colours and emblems identify
 * the hero without using copyrighted comic or film stills.
 */
export function heroArt(name: string, categorySlug: string): CatalogImage {
  const style = styleFor(name, categorySlug);
  const lines = wrapName(name);
  const publisher = categorySlug.includes("dc") ? "DC" : "Marvel";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" role="img" aria-label="${xmlEscape(name)}">
  <rect width="800" height="1000" fill="${style.background}"/>
  <rect x="36" y="36" width="728" height="928" fill="none" stroke="${style.accent}" stroke-width="8"/>
  <circle cx="400" cy="340" r="168" fill="none" stroke="${style.accent}" stroke-width="16"/>
  <text x="400" y="372" text-anchor="middle" font-size="${style.mark.length > 1 ? 92 : 140}" fill="${style.accent}" font-family="Georgia, serif">${xmlEscape(style.mark)}</text>
  ${lines
    .map(
      (line, index) =>
        `<text x="400" y="${620 + index * 58}" text-anchor="middle" font-size="48" fill="${style.ink}" font-family="Georgia, serif">${xmlEscape(line)}</text>`,
    )
    .join("")}
  <text x="400" y="900" text-anchor="middle" font-size="22" fill="${style.accent}" font-family="sans-serif" letter-spacing="6">${xmlEscape(publisher)}</text>
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
