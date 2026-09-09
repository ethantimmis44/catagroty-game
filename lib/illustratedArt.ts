import { slugify, type CatalogImage } from "@/data/catalog/types";
import { xmlEscape } from "@/lib/originalArt";

type Palette = {
  bg: string;
  suit: string;
  accent: string;
  skin?: string;
  cape?: string;
};

function svgWrap(name: string, inner: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" role="img" aria-label="${xmlEscape(name)}">${inner}</svg>`;
}

function caption(name: string, fill = "#f4efe4") {
  const short = name.length > 28 ? `${name.slice(0, 26)}…` : name;
  return `<text x="400" y="970" text-anchor="middle" font-size="22" fill="${fill}" font-family="Georgia, serif">${xmlEscape(short)}</text>`;
}

function torso(suit: string, skin: string, cape?: string) {
  return `${cape ? `<path d="M200 360 Q400 1020 600 360" fill="${cape}"/>` : ""}
    <ellipse cx="400" cy="820" rx="175" ry="270" fill="${suit}"/>
    <ellipse cx="400" cy="392" rx="132" ry="152" fill="${skin}"/>`;
}

const LOOK: Record<string, (p: Palette) => string> = {
  spider: (p) => `${torso(p.suit, p.suit, p.cape)}
    <path d="M400 520 L400 980 M270 640 L530 640 M290 560 L510 820 M510 560 L290 820" stroke="${p.bg}" stroke-width="5" fill="none"/>
    <ellipse cx="338" cy="368" rx="42" ry="52" fill="#f4efe4"/>
    <ellipse cx="462" cy="368" rx="42" ry="52" fill="#f4efe4"/>
    <ellipse cx="338" cy="368" rx="18" ry="28" fill="${p.bg}"/>
    <ellipse cx="462" cy="368" rx="18" ry="28" fill="${p.bg}"/>`,
  iron: (p) => `
    <ellipse cx="400" cy="820" rx="175" ry="270" fill="${p.suit}"/>
    <path d="M310 700 L490 700 L470 920 L330 920 Z" fill="${p.accent}"/>
    <path d="M268 250 Q400 140 532 250 L520 500 Q400 580 280 500 Z" fill="${p.accent}"/>
    <rect x="328" y="355" width="144" height="28" rx="10" fill="#7ec8e3"/>
    <circle cx="400" cy="720" r="36" fill="#7ec8e3"/>`,
  cap: (p) => `${torso(p.suit, "#f1d0b0", p.cape)}
    <path d="M270 300 Q400 210 530 300 L510 360 Q400 320 290 360 Z" fill="${p.suit}"/>
    <circle cx="400" cy="300" r="48" fill="#f4efe4"/>
    <circle cx="400" cy="300" r="18" fill="${p.accent}"/>
    <path d="M320 720 H480 L460 900 H340 Z" fill="#f4efe4"/>
    <path d="M400 720 V900" stroke="${p.accent}" stroke-width="14"/>`,
  thor: (p) => `${torso(p.suit, "#f1d0b0", p.cape)}
    <path d="M250 300 Q400 180 550 300 L530 360 H270 Z" fill="${p.accent}"/>
    <rect x="250" y="720" width="28" height="180" rx="6" fill="#c9a227"/>
    <rect x="210" y="700" width="108" height="48" rx="8" fill="#9e9e9e"/>
    <path d="M220 250 Q260 210 300 250" fill="none" stroke="#f4efe4" stroke-width="10"/>
    <path d="M500 250 Q540 210 580 250" fill="none" stroke="#f4efe4" stroke-width="10"/>`,
  hulk: (p) => `
    <ellipse cx="400" cy="830" rx="210" ry="250" fill="${p.suit}"/>
    <ellipse cx="400" cy="380" rx="160" ry="170" fill="${p.suit}"/>
    <ellipse cx="340" cy="350" rx="18" ry="12" fill="${p.bg}"/>
    <ellipse cx="460" cy="350" rx="18" ry="12" fill="${p.bg}"/>
    <path d="M340 470 Q400 520 460 470" fill="none" stroke="${p.bg}" stroke-width="10"/>
    <ellipse cx="220" cy="720" rx="70" ry="90" fill="${p.suit}"/>
    <ellipse cx="580" cy="720" rx="70" ry="90" fill="${p.suit}"/>`,
  widow: (p) => `${torso(p.suit, "#c48a6a")}
    <path d="M300 250 H500 L470 360 H330 Z" fill="${p.suit}"/>
    <path d="M310 250 Q400 180 490 250" fill="${p.suit}"/>
    <rect x="250" y="760" width="22" height="140" fill="${p.accent}"/>
    <circle cx="400" cy="640" r="10" fill="${p.accent}"/>`,
  strange: (p) => `${torso(p.suit, "#e2c09a", p.cape)}
    <circle cx="400" cy="640" r="54" fill="none" stroke="${p.accent}" stroke-width="10"/>
    <circle cx="400" cy="640" r="22" fill="${p.accent}"/>
    <path d="M280 300 Q400 240 520 300" fill="none" stroke="${p.accent}" stroke-width="14"/>
    <rect x="330" y="340" width="140" height="18" rx="4" fill="#1a1030"/>`,
  witch: (p) => `${torso(p.suit, "#e2c09a", p.cape)}
    <path d="M250 280 Q400 160 550 280 L520 360 Q400 300 280 360 Z" fill="${p.suit}"/>
    <circle cx="330" cy="360" r="16" fill="${p.accent}"/>
    <circle cx="470" cy="360" r="16" fill="${p.accent}"/>
    <path d="M280 560 Q400 500 520 560" fill="none" stroke="${p.accent}" stroke-width="8"/>`,
  marvel: (p) => `${torso(p.suit, "#f1d0b0", p.cape)}
    <path d="M260 240 L540 240 L500 360 L300 360 Z" fill="${p.suit}"/>
    <polygon points="400,250 430,330 370,330" fill="${p.accent}"/>
    <circle cx="400" cy="640" r="28" fill="${p.accent}"/>`,
  wolverine: (p) => `${torso(p.suit, "#f1d0b0")}
    <path d="M250 220 L320 360 L280 360 L220 250 Z" fill="${p.accent}"/>
    <path d="M550 220 L480 360 L520 360 L580 250 Z" fill="${p.accent}"/>
    <rect x="240" y="700" width="14" height="200" fill="#cfd8dc"/>
    <rect x="262" y="710" width="14" height="190" fill="#cfd8dc"/>
    <rect x="546" y="700" width="14" height="200" fill="#cfd8dc"/>
    <path d="M300 300 H500 L470 380 H330 Z" fill="${p.suit}"/>
    <rect x="300" y="340" width="200" height="22" fill="${p.accent}"/>`,
  storm: (p) => `${torso(p.suit, "#5d4037", p.cape)}
    <path d="M260 240 Q400 140 540 240 L500 340 Q400 280 300 340 Z" fill="#eceff1"/>
    <path d="M180 180 Q400 80 620 180" fill="none" stroke="#90caf9" stroke-width="10"/>
    <path d="M400 560 L370 700 L430 700 Z" fill="#ffe082"/>`,
  deadpool: (p) => `${torso(p.suit, p.suit)}
    <ellipse cx="338" cy="368" rx="40" ry="50" fill="#111"/>
    <ellipse cx="462" cy="368" rx="40" ry="50" fill="#111"/>
    <path d="M400 300 V480" stroke="#111" stroke-width="16"/>
    <circle cx="250" cy="760" r="28" fill="#9e9e9e"/>
    <circle cx="550" cy="760" r="28" fill="#9e9e9e"/>`,
  ant: (p) => `${torso(p.suit, "#f1d0b0")}
    <circle cx="400" cy="300" r="70" fill="${p.suit}"/>
    <circle cx="400" cy="300" r="28" fill="${p.accent}"/>
    <rect x="388" y="200" width="24" height="70" fill="${p.suit}"/>
    <circle cx="400" cy="680" r="36" fill="${p.accent}"/>`,
  wasp: (p) => `${torso(p.suit, "#f1d0b0")}
    <path d="M220 560 Q320 420 400 560 Q480 420 580 560 Q500 700 400 640 Q300 700 220 560" fill="${p.accent}" opacity="0.85"/>
    <circle cx="400" cy="300" r="64" fill="${p.suit}"/>
    <rect x="300" y="720" width="200" height="28" fill="${p.accent}"/>`,
  hawk: (p) => `${torso(p.suit, "#f1d0b0")}
    <path d="M220 360 L120 520 L260 500" fill="${p.accent}"/>
    <path d="M580 360 L680 520 L540 500" fill="${p.accent}"/>
    <line x1="560" y1="640" x2="720" y2="520" stroke="${p.accent}" stroke-width="10"/>
    <polygon points="720,520 680,500 700,560" fill="${p.accent}"/>`,
  falcon: (p) => `${torso(p.suit, "#c48a6a")}
    <path d="M180 500 Q400 200 620 500 Q400 420 180 500" fill="${p.accent}"/>
    <circle cx="400" cy="300" r="70" fill="${p.suit}"/>
    <path d="M300 300 L400 220 L500 300" fill="${p.accent}"/>`,
  fury: (p) => `${torso(p.suit, "#5d4037")}
    <rect x="250" y="300" width="220" height="28" fill="#111"/>
    <rect x="250" y="700" width="300" height="160" fill="#263238"/>
    <circle cx="560" cy="360" r="10" fill="${p.accent}"/>`,
  loki: (p) => `${torso(p.suit, "#f1d0b0", p.cape)}
    <path d="M250 220 L320 360 H280 L210 240 Z" fill="${p.accent}"/>
    <path d="M550 220 L480 360 H520 L590 240 Z" fill="${p.accent}"/>
    <rect x="360" y="620" width="80" height="240" fill="${p.accent}"/>
    <path d="M300 280 H500 L470 360 H330 Z" fill="${p.suit}"/>`,
  groot: (p) => `
    <rect x="330" y="260" width="140" height="620" rx="40" fill="${p.suit}"/>
    <ellipse cx="400" cy="240" rx="90" ry="100" fill="${p.suit}"/>
    <path d="M280 400 Q200 320 240 260" fill="none" stroke="${p.suit}" stroke-width="28"/>
    <path d="M520 400 Q600 320 560 260" fill="none" stroke="${p.suit}" stroke-width="28"/>
    <ellipse cx="370" cy="230" rx="10" ry="14" fill="${p.bg}"/>
    <ellipse cx="430" cy="230" rx="10" ry="14" fill="${p.bg}"/>`,
  starlord: (p) => `${torso(p.suit, "#f1d0b0")}
    <rect x="270" y="300" width="260" height="90" rx="20" fill="#212121"/>
    <circle cx="340" cy="345" r="22" fill="#90caf9"/>
    <circle cx="460" cy="345" r="22" fill="#90caf9"/>
    <rect x="300" y="700" width="200" height="40" fill="${p.accent}"/>`,
  gamora: (p) => `${torso(p.suit, "#2e7d32")}
    <path d="M280 240 Q400 180 520 240 L490 340 H310 Z" fill="#1b5e20"/>
    <rect x="520" y="620" width="18" height="200" fill="#9e9e9e"/>
    <path d="M500 620 L600 580 L530 640" fill="#9e9e9e"/>`,
  msmarvel: (p) => `${torso(p.suit, "#e2c09a")}
    <path d="M240 500 Q400 360 560 500 Q400 640 240 500" fill="${p.accent}" opacity="0.8"/>
    <circle cx="400" cy="300" r="70" fill="${p.suit}"/>
    <path d="M300 720 H500" stroke="${p.accent}" stroke-width="16"/>`,
  shang: (p) => `${torso(p.suit, "#e2c09a")}
    <circle cx="250" cy="640" r="70" fill="none" stroke="${p.accent}" stroke-width="10"/>
    <circle cx="550" cy="640" r="70" fill="none" stroke="${p.accent}" stroke-width="10"/>
    <rect x="330" y="300" width="140" height="20" fill="${p.accent}"/>`,
  daredevil: (p) => `${torso(p.suit, p.suit)}
    <path d="M300 240 L400 180 L500 240 L470 360 H330 Z" fill="${p.suit}"/>
    <path d="M250 220 L330 300" stroke="${p.accent}" stroke-width="10"/>
    <path d="M550 220 L470 300" stroke="${p.accent}" stroke-width="10"/>
    <path d="M220 700 Q400 620 580 700" fill="none" stroke="${p.accent}" stroke-width="8"/>`,
  moon: (p) => `${torso(p.suit, "#eceff1")}
    <path d="M300 240 Q400 180 500 240 L470 360 H330 Z" fill="#eceff1"/>
    <circle cx="520" cy="220" r="40" fill="#fffde7"/>
    <path d="M300 360 H500" stroke="#111" stroke-width="8"/>`,
  vision: (p) => `${torso(p.suit, p.suit, p.cape)}
    <polygon points="400,220 520,360 280,360" fill="${p.suit}"/>
    <circle cx="400" cy="300" r="22" fill="#ffeb3b"/>
    <rect x="300" y="700" width="200" height="24" fill="#ffeb3b"/>`,
  winter: (p) => `${torso(p.suit, "#e2c09a")}
    <path d="M480 420 L620 360 L600 860 L500 820 Z" fill="#b0bec5"/>
    <circle cx="540" cy="640" r="20" fill="#90caf9"/>
    <rect x="300" y="300" width="160" height="24" fill="#111"/>`,
  warmachine: (p) => `
    <ellipse cx="400" cy="820" rx="175" ry="270" fill="${p.suit}"/>
    <path d="M268 250 Q400 140 532 250 L520 500 Q400 580 280 500 Z" fill="${p.accent}"/>
    <rect x="328" y="355" width="144" height="28" rx="10" fill="#ef5350"/>
    <rect x="240" y="700" width="80" height="40" fill="#ef5350"/>`,
  rocket: (p) => `
    <ellipse cx="400" cy="640" rx="160" ry="220" fill="${p.suit}"/>
    <ellipse cx="400" cy="360" rx="110" ry="120" fill="${p.suit}"/>
    <ellipse cx="360" cy="340" rx="16" ry="20" fill="${p.bg}"/>
    <ellipse cx="440" cy="340" rx="16" ry="20" fill="${p.bg}"/>
    <rect x="520" y="560" width="90" height="28" fill="${p.accent}"/>
    <path d="M300 280 Q400 200 500 280" fill="#5d4037"/>`,
  drax: (p) => `${torso(p.suit, "#4db6ac")}
    <path d="M280 420 L520 420 M300 500 L500 500 M320 580 L480 580" stroke="#b2dfdb" stroke-width="8"/>
    <rect x="240" y="700" width="28" height="160" fill="#cfd8dc"/>`,
  nebula: (p) => `${torso(p.suit, "#29b6f6")}
    <rect x="300" y="300" width="200" height="20" fill="#90caf9"/>
    <path d="M520 360 L600 300 L580 500 L500 480" fill="#90a4ae"/>
    <circle cx="400" cy="360" r="12" fill="#fff"/>`,
  mantis: (p) => `${torso(p.suit, "#aed581")}
    <path d="M340 240 L400 160 L460 240" fill="${p.accent}"/>
    <path d="M300 500 Q400 560 500 500" fill="none" stroke="${p.accent}" stroke-width="8"/>`,
  xavier: (p) => `
    <ellipse cx="400" cy="860" rx="200" ry="160" fill="${p.suit}"/>
    <ellipse cx="400" cy="420" rx="140" ry="150" fill="#f1d0b0"/>
    <rect x="300" y="720" width="200" height="28" fill="#5c6bc0"/>
    <circle cx="400" cy="780" r="90" fill="#37474f"/>
    <path d="M280 320 H520" stroke="#eceff1" stroke-width="18"/>`,
  magneto: (p) => `${torso(p.suit, "#e2c09a", p.cape)}
    <path d="M250 200 L400 120 L550 200 L500 360 H300 Z" fill="${p.accent}"/>
    <path d="M240 560 Q400 480 560 560" fill="none" stroke="#ce93d8" stroke-width="8"/>
    <circle cx="400" cy="200" r="16" fill="#f4efe4"/>`,
  jean: (p) => `${torso(p.suit, "#e2c09a", p.cape)}
    <path d="M260 250 Q400 180 540 250 L500 360 H300 Z" fill="#b71c1c"/>
    <circle cx="400" cy="300" r="20" fill="#ff6f00"/>
    <path d="M260 520 Q400 440 540 520" fill="none" stroke="#ff6f00" stroke-width="10"/>`,
  cyclops: (p) => `${torso(p.suit, "#f1d0b0")}
    <rect x="280" y="330" width="240" height="36" rx="8" fill="${p.accent}"/>
    <rect x="300" y="338" width="200" height="20" fill="#ff1744"/>
    <path d="M300 720 H500" stroke="${p.accent}" stroke-width="16"/>`,
  blade: (p) => `${torso(p.suit, "#5d4037")}
    <path d="M280 240 Q400 180 520 240 L490 340 H310 Z" fill="#111"/>
    <rect x="560" y="520" width="22" height="280" fill="#cfd8dc"/>
    <path d="M540 520 L620 480 L570 540" fill="#cfd8dc"/>`,
  ghost: (p) => `${torso("#212121", "#ff6f00")}
    <path d="M300 220 Q400 140 500 220 L480 360 H320 Z" fill="#ff6f00"/>
    <ellipse cx="360" cy="300" rx="16" ry="24" fill="#111"/>
    <ellipse cx="440" cy="300" rx="16" ry="24" fill="#111"/>
    <path d="M280 200 Q400 80 520 200" fill="none" stroke="#ff8f00" stroke-width="8"/>`,
  surfer: (p) => `${torso("#b0bec5", "#eceff1")}
    <ellipse cx="400" cy="860" rx="240" ry="40" fill="#90a4ae"/>
    <path d="M160 860 L640 800 L620 880 Z" fill="#cfd8dc"/>
    <circle cx="400" cy="300" r="16" fill="#fff"/>`,
  punisher: (p) => `${torso(p.suit, "#e2c09a")}
    <path d="M300 620 H500 V780 H300 Z" fill="#fafafa"/>
    <path d="M340 640 H460 V700 H400 V760 H360 V700 H340 Z" fill="#111"/>
    <rect x="300" y="300" width="200" height="20" fill="#111"/>`,
  super: (p) => `${torso(p.suit, "#f1d0b0", p.cape)}
    <polygon points="400,560 460,700 340,700" fill="${p.accent}"/>
    <path d="M300 250 Q400 200 500 250 L470 340 H330 Z" fill="#1565c0"/>
    <path d="M250 280 Q400 160 550 280" fill="none" stroke="#f4efe4" stroke-width="8"/>`,
  bat: (p) => `${torso(p.suit, "#f1d0b0")}
    <path d="M250 220 L320 340 L280 340 L200 240 Z" fill="${p.suit}"/>
    <path d="M550 220 L480 340 L520 340 L600 240 Z" fill="${p.suit}"/>
    <path d="M280 250 Q400 180 520 250 L500 380 H300 Z" fill="${p.suit}"/>
    <path d="M240 560 Q400 700 560 560 Q400 620 240 560" fill="${p.accent}"/>`,
  ww: (p) => `${torso(p.suit, "#e2c09a", p.cape)}
    <path d="M250 240 L400 180 L550 240 L500 340 H300 Z" fill="${p.accent}"/>
    <circle cx="400" cy="250" r="28" fill="${p.suit}"/>
    <path d="M280 720 H520" stroke="${p.accent}" stroke-width="14"/>
    <circle cx="250" cy="700" r="36" fill="${p.accent}"/>
    <circle cx="550" cy="700" r="36" fill="${p.accent}"/>`,
  flash: (p) => `${torso(p.suit, "#f1d0b0")}
    <ellipse cx="400" cy="300" rx="110" ry="70" fill="${p.suit}"/>
    <polygon points="400,250 430,330 370,330" fill="${p.accent}"/>
    <path d="M180 640 L320 600 L200 700" fill="${p.accent}"/>
    <path d="M620 640 L480 600 L600 700" fill="${p.accent}"/>`,
  aqua: (p) => `${torso(p.suit, "#e2c09a", p.cape)}
    <path d="M300 240 Q400 180 500 240 L470 340 H330 Z" fill="${p.accent}"/>
    <rect x="360" y="560" width="24" height="280" fill="${p.accent}"/>
    <path d="M300 560 L480 540 L390 600" fill="${p.accent}"/>
    <path d="M160 860 Q400 780 640 860" fill="none" stroke="#4fc3f7" stroke-width="10"/>`,
  lantern: (p) => `${torso(p.suit, "#f1d0b0")}
    <circle cx="400" cy="640" r="70" fill="none" stroke="${p.accent}" stroke-width="14"/>
    <circle cx="400" cy="640" r="28" fill="${p.accent}"/>
    <path d="M300 250 H500 L470 340 H330 Z" fill="${p.suit}"/>`,
  cyborg: (p) => `${torso("#455a64", "#e2c09a")}
    <path d="M400 240 L560 360 L400 420 L400 240" fill="#90a4ae"/>
    <rect x="420" y="300" width="80" height="36" fill="#29b6f6"/>
    <rect x="480" y="700" width="90" height="40" fill="#90a4ae"/>`,
  mm: (p) => `${torso(p.suit, "#2e7d32", p.cape)}
    <ellipse cx="400" cy="300" rx="90" ry="70" fill="#1b5e20"/>
    <circle cx="400" cy="260" r="16" fill="#c62828"/>
    <path d="M300 240 L400 160 L500 240" fill="#1b5e20"/>`,
  harley: (p) => `${torso("#f4efe4", "#f1d0b0")}
    <path d="M280 240 H390 L370 360 H300 Z" fill="#e91e63"/>
    <path d="M410 240 H520 L500 360 H430 Z" fill="#29b6f6"/>
    <circle cx="250" cy="720" r="30" fill="#e91e63"/>
    <circle cx="550" cy="720" r="30" fill="#29b6f6"/>
    <path d="M330 470 Q400 520 470 470" fill="none" stroke="#111" stroke-width="6"/>`,
  cat: (p) => `${torso(p.suit, "#f1d0b0")}
    <path d="M280 220 L340 330 L300 330 Z" fill="${p.suit}"/>
    <path d="M520 220 L460 330 L500 330 Z" fill="${p.suit}"/>
    <path d="M300 250 Q400 190 500 250 L470 360 H330 Z" fill="${p.suit}"/>
    <ellipse cx="360" cy="340" rx="16" ry="10" fill="#ce93d8"/>
    <ellipse cx="440" cy="340" rx="16" ry="10" fill="#ce93d8"/>`,
  joker: (p) => `${torso(p.suit, "#81c784")}
    <path d="M260 220 Q400 140 540 220 L500 360 H300 Z" fill="#7e57c2"/>
    <path d="M320 470 Q400 560 480 470" fill="none" stroke="#c62828" stroke-width="10"/>
    <ellipse cx="360" cy="360" rx="14" ry="10" fill="#111"/>
    <ellipse cx="440" cy="360" rx="14" ry="10" fill="#111"/>`,
  lex: (p) => `${torso(p.suit, "#f1d0b0")}
    <ellipse cx="400" cy="300" rx="120" ry="110" fill="#f1d0b0"/>
    <rect x="280" y="700" width="240" height="40" fill="${p.accent}"/>
    <rect x="300" y="380" width="200" height="12" fill="#bdbdbd"/>`,
  arrow: (p) => `${torso(p.suit, "#e2c09a")}
    <path d="M240 300 Q400 220 400 500" fill="none" stroke="#5d4037" stroke-width="12"/>
    <line x1="520" y1="620" x2="700" y2="500" stroke="${p.accent}" stroke-width="8"/>
    <polygon points="700,500 660,490 680,540" fill="${p.accent}"/>
    <path d="M300 250 H500 L470 340 H330 Z" fill="${p.suit}"/>`,
  shazam: (p) => `${torso(p.suit, "#f1d0b0", p.cape)}
    <polygon points="400,560 430,700 370,700" fill="${p.accent}"/>
    <path d="M300 250 Q400 190 500 250 L470 340 H330 Z" fill="${p.suit}"/>
    <path d="M200 200 L240 280 L160 260" fill="${p.accent}"/>`,
  canary: (p) => `${torso(p.suit, "#f1d0b0")}
    <path d="M280 230 Q400 170 520 230 L490 340 H310 Z" fill="${p.accent}"/>
    <path d="M300 500 Q400 560 500 500" fill="none" stroke="${p.accent}" stroke-width="10"/>
    <circle cx="400" cy="640" r="20" fill="${p.accent}"/>`,
  zatanna: (p) => `${torso(p.suit, "#f1d0b0")}
    <path d="M260 180 L540 180 L400 340 Z" fill="#111"/>
    <rect x="300" y="700" width="200" height="28" fill="#f4efe4"/>
    <circle cx="560" cy="620" r="24" fill="${p.accent}"/>`,
  hawkman: (p) => `${torso(p.suit, "#e2c09a")}
    <path d="M160 500 Q400 240 640 500 Q400 420 160 500" fill="${p.accent}"/>
    <path d="M300 240 L400 180 L500 240 L470 340 H330 Z" fill="${p.suit}"/>
    <rect x="360" y="560" width="20" height="220" fill="#c9a227"/>`,
  raven: (p) => `${torso(p.suit, "#ce93d8", p.cape)}
    <path d="M280 230 Q400 160 520 230 L490 340 H310 Z" fill="#4a148c"/>
    <polygon points="400,560 430,680 370,680" fill="#7b1fa2"/>
    <circle cx="400" cy="300" r="16" fill="#111"/>`,
  starfire: (p) => `${torso(p.suit, "#ffcc80", p.cape)}
    <path d="M280 230 Q400 170 520 230 L490 340 H310 Z" fill="#ff7043"/>
    <circle cx="400" cy="640" r="36" fill="#ffe082"/>
    <path d="M200 200 Q400 80 600 200" fill="none" stroke="#ffe082" stroke-width="8"/>`,
  beastboy: (p) => `${torso(p.suit, "#66bb6a")}
    <path d="M300 220 L340 300 L300 300 Z" fill="#66bb6a"/>
    <path d="M500 220 L460 300 L500 300 Z" fill="#66bb6a"/>
    <ellipse cx="360" cy="340" rx="14" ry="18" fill="#111"/>
    <ellipse cx="440" cy="340" rx="14" ry="18" fill="#111"/>`,
  ivy: (p) => `${torso(p.suit, "#c48a6a")}
    <path d="M280 230 Q400 160 520 230 L490 360 H310 Z" fill="#2e7d32"/>
    <path d="M240 500 Q320 420 400 520 Q480 420 560 500" fill="none" stroke="#81c784" stroke-width="10"/>
    <circle cx="260" cy="480" r="16" fill="#c62828"/>
    <circle cx="540" cy="480" r="16" fill="#c62828"/>`,
  beetle: (p) => `${torso(p.suit, "#f1d0b0")}
    <path d="M220 500 Q400 280 580 500 Q400 640 220 500" fill="#0288d1"/>
    <circle cx="400" cy="300" r="64" fill="${p.suit}"/>
    <circle cx="400" cy="640" r="28" fill="#29b6f6"/>`,
  constantine: (p) => `${torso(p.suit, "#f1d0b0")}
    <path d="M250 220 H550 L500 340 H300 Z" fill="#212121"/>
    <rect x="320" y="680" width="160" height="90" fill="#f4efe4"/>
    <path d="M360 700 H440" stroke="#c0a062" stroke-width="6"/>`,
  swamp: (p) => `${torso(p.suit, "#33691e")}
    <path d="M240 240 Q400 140 560 240 L500 360 H300 Z" fill="#1b5e20"/>
    <path d="M220 500 Q300 400 400 520" fill="none" stroke="#8bc34a" stroke-width="16"/>
    <ellipse cx="360" cy="340" rx="12" ry="16" fill="#c62828"/>
    <ellipse cx="440" cy="340" rx="12" ry="16" fill="#c62828"/>`,
  adam: (p) => `${torso(p.suit, "#5d4037", p.cape)}
    <path d="M250 220 L400 140 L550 220 L500 340 H300 Z" fill="${p.accent}"/>
    <polygon points="400,560 430,700 370,700" fill="${p.accent}"/>
    <path d="M300 250 H500" stroke="#111" stroke-width="10"/>`,
  deathstroke: (p) => `${torso(p.suit, "#f1d0b0")}
    <path d="M280 240 H520 L490 360 H310 Z" fill="${p.suit}"/>
    <path d="M400 240 L520 240 L490 360 L400 360 Z" fill="#f4efe4"/>
    <rect x="540" y="600" width="22" height="220" fill="#cfd8dc"/>`,
  redhood: (p) => `${torso(p.suit, p.suit)}
    <ellipse cx="400" cy="340" rx="120" ry="130" fill="${p.accent}"/>
    <ellipse cx="360" cy="330" rx="16" ry="12" fill="#111"/>
    <ellipse cx="440" cy="330" rx="16" ry="12" fill="#111"/>
    <rect x="250" y="720" width="28" height="120" fill="#9e9e9e"/>`,
  static: (p) => `${torso(p.suit, "#5d4037")}
    <path d="M300 240 Q400 180 500 240 L470 340 H330 Z" fill="${p.suit}"/>
    <path d="M400 560 L360 700 L420 660 L400 820" fill="none" stroke="${p.accent}" stroke-width="10"/>
    <circle cx="400" cy="300" r="14" fill="${p.accent}"/>`,
  plastic: (p) => `${torso(p.suit, "#f1d0b0")}
    <path d="M180 640 Q400 500 620 640" fill="none" stroke="${p.accent}" stroke-width="28"/>
    <circle cx="180" cy="640" r="28" fill="${p.suit}"/>
    <circle cx="620" cy="640" r="28" fill="${p.suit}"/>
    <ellipse cx="400" cy="300" rx="90" ry="80" fill="#f1d0b0"/>`,
  nightwing: (p) => `${torso(p.suit, "#f1d0b0")}
    <path d="M250 220 L320 340 L280 340 L200 240 Z" fill="${p.suit}"/>
    <path d="M550 220 L480 340 L520 340 L600 240 Z" fill="${p.suit}"/>
    <path d="M240 560 Q400 500 560 560" fill="none" stroke="${p.accent}" stroke-width="16"/>
    <path d="M280 250 Q400 190 520 250 L500 360 H300 Z" fill="${p.suit}"/>`,
  robin: (p) => `${torso(p.suit, "#f1d0b0", p.cape)}
    <path d="M300 240 Q400 190 500 240 L470 340 H330 Z" fill="#1565c0"/>
    <path d="M250 220 L320 320" fill="none" stroke="#1565c0" stroke-width="14"/>
    <path d="M550 220 L480 320" fill="none" stroke="#1565c0" stroke-width="14"/>
    <rect x="300" y="700" width="200" height="28" fill="${p.accent}"/>`,
};

function heroCard(name: string, look: string, palette: Palette) {
  const draw = LOOK[look] ?? LOOK.super;
  return svgWrap(
    name,
    `<rect width="800" height="1000" fill="${palette.bg}"/>${draw(palette)}${caption(name)}`,
  );
}

const MARVEL: Record<string, { look: string; p: Palette }> = {
  "spider-man": { look: "spider", p: { bg: "#3b0a0d", suit: "#e31c23", accent: "#1565c0", cape: undefined } },
  "iron man": { look: "iron", p: { bg: "#2a1408", suit: "#c4122f", accent: "#d4a017" } },
  "captain america": { look: "cap", p: { bg: "#0c1c3d", suit: "#1565c0", accent: "#c4122f", cape: "#c4122f" } },
  "black panther": { look: "cat", p: { bg: "#0b0b12", suit: "#212121", accent: "#7b5ea7" } },
  thor: { look: "thor", p: { bg: "#1a2433", suit: "#37474f", accent: "#c9a227", cape: "#c4122f" } },
  hulk: { look: "hulk", p: { bg: "#10240f", suit: "#43a047", accent: "#2e7d32" } },
  "black widow": { look: "widow", p: { bg: "#1a0a0a", suit: "#212121", accent: "#b71c1c" } },
  "doctor strange": { look: "strange", p: { bg: "#1a1030", suit: "#1565c0", accent: "#e0b34a", cape: "#c4122f" } },
  "scarlet witch": { look: "witch", p: { bg: "#2a0a14", suit: "#8e0000", accent: "#c62828", cape: "#4a0000" } },
  "captain marvel": { look: "marvel", p: { bg: "#1a2040", suit: "#1565c0", accent: "#f0c040", cape: "#c4122f" } },
  wolverine: { look: "wolverine", p: { bg: "#1c1408", suit: "#1565c0", accent: "#f9a825" } },
  storm: { look: "storm", p: { bg: "#0e1a28", suit: "#212121", accent: "#90caf9", cape: "#eceff1" } },
  deadpool: { look: "deadpool", p: { bg: "#3b0a0a", suit: "#c62828", accent: "#212121" } },
  "ant-man": { look: "ant", p: { bg: "#3b1010", suit: "#c62828", accent: "#212121" } },
  wasp: { look: "wasp", p: { bg: "#1a1428", suit: "#212121", accent: "#fdd835" } },
  hawkeye: { look: "hawk", p: { bg: "#1c2430", suit: "#37474f", accent: "#8d6e63" } },
  falcon: { look: "falcon", p: { bg: "#1a2038", suit: "#c62828", accent: "#ef6c00" } },
  "nick fury": { look: "fury", p: { bg: "#121212", suit: "#212121", accent: "#546e7a" } },
  loki: { look: "loki", p: { bg: "#0d2818", suit: "#1b5e20", accent: "#c9a227", cape: "#2e7d32" } },
  groot: { look: "groot", p: { bg: "#1a140c", suit: "#6d4c41", accent: "#8d6e63" } },
  "star-lord": { look: "starlord", p: { bg: "#1c1010", suit: "#d84315", accent: "#ffcc80" } },
  gamora: { look: "gamora", p: { bg: "#0e2418", suit: "#1b5e20", accent: "#2e7d32" } },
  "ms. marvel": { look: "msmarvel", p: { bg: "#1a1030", suit: "#1565c0", accent: "#e040fb" } },
  "shang-chi": { look: "shang", p: { bg: "#2a1008", suit: "#c62828", accent: "#e65100" } },
  daredevil: { look: "daredevil", p: { bg: "#3b0a0a", suit: "#c62828", accent: "#ff8a80" } },
  "moon knight": { look: "moon", p: { bg: "#12141c", suit: "#eceff1", accent: "#fffde7" } },
  "she-hulk": { look: "hulk", p: { bg: "#143018", suit: "#66bb6a", accent: "#2e7d32" } },
  vision: { look: "vision", p: { bg: "#2a0c14", suit: "#e53935", accent: "#ffeb3b", cape: "#8e24aa" } },
  "winter soldier": { look: "winter", p: { bg: "#121820", suit: "#37474f", accent: "#90a4ae" } },
  "war machine": { look: "warmachine", p: { bg: "#121212", suit: "#424242", accent: "#b0bec5" } },
  rocket: { look: "rocket", p: { bg: "#1a120c", suit: "#8d6e63", accent: "#ff7043" } },
  drax: { look: "drax", p: { bg: "#102018", suit: "#00897b", accent: "#26a69a" } },
  nebula: { look: "nebula", p: { bg: "#0c1c28", suit: "#1565c0", accent: "#29b6f6" } },
  mantis: { look: "mantis", p: { bg: "#142014", suit: "#7cb342", accent: "#aed581" } },
  "miles morales": { look: "spider", p: { bg: "#0d0d14", suit: "#212121", accent: "#e040fb" } },
  "spider-gwen": { look: "spider", p: { bg: "#eceff1", suit: "#f4efe4", accent: "#ec407a" } },
  "professor x": { look: "xavier", p: { bg: "#101828", suit: "#1565c0", accent: "#5c6bc0" } },
  magneto: { look: "magneto", p: { bg: "#1a0a14", suit: "#4a148c", accent: "#c9a227", cape: "#6a1b9a" } },
  "jean grey": { look: "jean", p: { bg: "#2a0c0c", suit: "#c62828", accent: "#ef6c00", cape: "#b71c1c" } },
  cyclops: { look: "cyclops", p: { bg: "#1a1020", suit: "#1565c0", accent: "#c62828" } },
  blade: { look: "blade", p: { bg: "#0a0a0a", suit: "#212121", accent: "#b71c1c" } },
  "ghost rider": { look: "ghost", p: { bg: "#1a0a00", suit: "#212121", accent: "#ff6f00" } },
  "silver surfer": { look: "surfer", p: { bg: "#263238", suit: "#b0bec5", accent: "#eceff1" } },
  punisher: { look: "punisher", p: { bg: "#0a0a0a", suit: "#212121", accent: "#fafafa" } },
};

const DC: Record<string, { look: string; p: Palette }> = {
  superman: { look: "super", p: { bg: "#0c1c3d", suit: "#1565c0", accent: "#c4122f", cape: "#c4122f" } },
  batman: { look: "bat", p: { bg: "#0b0d14", suit: "#212121", accent: "#f4c430" } },
  "wonder woman": { look: "ww", p: { bg: "#1a0a10", suit: "#c4122f", accent: "#d4a017", cape: "#c4122f" } },
  "the flash": { look: "flash", p: { bg: "#3b0a0a", suit: "#c62828", accent: "#f9a825" } },
  aquaman: { look: "aqua", p: { bg: "#0a2430", suit: "#00695c", accent: "#f9a825", cape: "#f9a825" } },
  "green lantern": { look: "lantern", p: { bg: "#0a2010", suit: "#212121", accent: "#43a047" } },
  cyborg: { look: "cyborg", p: { bg: "#121418", suit: "#455a64", accent: "#78909c" } },
  "martian manhunter": { look: "mm", p: { bg: "#0c1c14", suit: "#2e7d32", accent: "#c62828", cape: "#1565c0" } },
  supergirl: { look: "super", p: { bg: "#0c1c3d", suit: "#1565c0", accent: "#c4122f", cape: "#c4122f" } },
  batgirl: { look: "bat", p: { bg: "#0b0d14", suit: "#37474f", accent: "#f4c430" } },
  nightwing: { look: "nightwing", p: { bg: "#0a1224", suit: "#212121", accent: "#29b6f6" } },
  robin: { look: "robin", p: { bg: "#0d1a0d", suit: "#c62828", accent: "#f9a825", cape: "#f9a825" } },
  "harley quinn": { look: "harley", p: { bg: "#1a0a14", suit: "#f4efe4", accent: "#ec407a" } },
  catwoman: { look: "cat", p: { bg: "#121212", suit: "#212121", accent: "#9c27b0" } },
  joker: { look: "joker", p: { bg: "#0d1a12", suit: "#7b1fa2", accent: "#81c784" } },
  "lex luthor": { look: "lex", p: { bg: "#1a1a14", suit: "#37474f", accent: "#9e9d24" } },
  "green arrow": { look: "arrow", p: { bg: "#0a2010", suit: "#1b5e20", accent: "#43a047" } },
  shazam: { look: "shazam", p: { bg: "#3b1408", suit: "#c4122f", accent: "#f9a825", cape: "#f9a825" } },
  "black canary": { look: "canary", p: { bg: "#121018", suit: "#212121", accent: "#fdd835" } },
  zatanna: { look: "zatanna", p: { bg: "#120a1a", suit: "#212121", accent: "#7e57c2" } },
  hawkman: { look: "hawkman", p: { bg: "#1a1208", suit: "#c62828", accent: "#ef6c00" } },
  hawkgirl: { look: "hawkman", p: { bg: "#1a1008", suit: "#c62828", accent: "#ef6c00" } },
  raven: { look: "raven", p: { bg: "#12081c", suit: "#4a148c", accent: "#7b1fa2", cape: "#311b92" } },
  starfire: { look: "starfire", p: { bg: "#2a1408", suit: "#e64a19", accent: "#ff7043", cape: "#ff8a65" } },
  "beast boy": { look: "beastboy", p: { bg: "#0e2410", suit: "#43a047", accent: "#66bb6a" } },
  "poison ivy": { look: "ivy", p: { bg: "#0a1c10", suit: "#1b5e20", accent: "#2e7d32" } },
  "blue beetle": { look: "beetle", p: { bg: "#0a1a2a", suit: "#01579b", accent: "#0288d1" } },
  constantine: { look: "constantine", p: { bg: "#14120c", suit: "#5d4037", accent: "#c0a062" } },
  "swamp thing": { look: "swamp", p: { bg: "#0a1a0c", suit: "#33691e", accent: "#8bc34a" } },
  "black adam": { look: "adam", p: { bg: "#101018", suit: "#212121", accent: "#f9a825", cape: "#f9a825" } },
  deathstroke: { look: "deathstroke", p: { bg: "#1a0c08", suit: "#ef6c00", accent: "#f4efe4" } },
  "red hood": { look: "redhood", p: { bg: "#1a0808", suit: "#212121", accent: "#c62828" } },
  batwoman: { look: "bat", p: { bg: "#0b0d14", suit: "#212121", accent: "#c62828" } },
  "static shock": { look: "static", p: { bg: "#0c1020", suit: "#212121", accent: "#7c4dff" } },
  "plastic man": { look: "plastic", p: { bg: "#3b0a0a", suit: "#c62828", accent: "#e53935" } },
};

function cover(name: string, bg: string, art: string) {
  return svgWrap(
    name,
    `<rect width="800" height="1000" fill="${bg}"/>${art}${caption(name)}`,
  );
}

const COVERS: Record<string, string> = {
  minecraft: `<rect x="80" y="120" width="640" height="760" fill="#5d8a3a"/>
    <g fill="#3d5c24">${[0,1,2,3,4].flatMap((y) => [0,1,2,3,4].map((x) => `<rect x="${120+x*120}" y="${180+y*120}" width="100" height="100"/>`)).join("")}</g>
    <rect x="250" y="320" width="80" height="40" fill="#111"/>
    <rect x="470" y="320" width="80" height="40" fill="#111"/>
    <rect x="280" y="480" width="240" height="40" fill="#111"/>
    <rect x="200" y="80" width="400" height="80" fill="#8d6e63"/>`,
  "grand theft auto v": `<rect width="800" height="1000" fill="#1a237e"/>
    <rect y="520" width="800" height="480" fill="#ff8a65"/>
    <circle cx="620" cy="180" r="90" fill="#ffeb3b"/>
    <rect x="80" y="560" width="80" height="320" fill="#263238"/>
    <rect x="180" y="500" width="110" height="380" fill="#37474f"/>
    <rect x="320" y="430" width="90" height="450" fill="#455a64"/>
    <rect x="430" y="480" width="140" height="400" fill="#263238"/>
    <rect x="590" y="540" width="100" height="340" fill="#37474f"/>
    <rect x="120" y="820" width="220" height="70" fill="#c62828"/>`,
  fortnite: `<rect width="800" height="520" fill="#29b6f6"/>
    <rect y="520" width="800" height="480" fill="#66bb6a"/>
    <polygon points="400,120 520,420 280,420" fill="#eceff1"/>
    <rect x="300" y="420" width="200" height="280" fill="#7e57c2"/>
    <circle cx="400" cy="300" r="40" fill="#fdd835"/>
    <path d="M80 200 Q400 80 720 200" fill="none" stroke="#7e57c2" stroke-width="18"/>`,
  "super mario bros.": `<rect width="800" height="700" fill="#4fc3f7"/>
    <rect y="700" width="800" height="300" fill="#8d6e63"/>
    <rect x="0" y="700" width="800" height="40" fill="#43a047"/>
    <rect x="560" y="420" width="160" height="280" fill="#c62828"/>
    <rect x="600" y="360" width="80" height="60" fill="#f4efe4"/>
    <circle cx="280" cy="560" r="90" fill="#c62828"/>
    <ellipse cx="280" cy="520" rx="70" ry="36" fill="#f1d0b0"/>
    <rect x="80" y="620" width="90" height="80" fill="#6d4c41"/>`,
  "the legend of zelda": `<rect width="800" height="1000" fill="#0d2818"/>
    <polygon points="400,180 480,360 320,360" fill="#c9a227"/>
    <polygon points="400,300 520,560 280,560" fill="#c9a227"/>
    <rect x="60" y="620" width="680" height="260" fill="#1b5e20"/>
    <path d="M120 740 Q400 640 680 740" fill="none" stroke="#81c784" stroke-width="12"/>
    <circle cx="160" cy="240" r="40" fill="#fffde7"/>`,
  tetris: `${[0,1,2,3].map((i) => `<rect x="${120+i*140}" y="${200+i*40}" width="120" height="120" fill="${["#29b6f6","#fdd835","#e91e63","#43a047"][i]}"/>`).join("")}
    <rect x="260" y="560" width="120" height="120" fill="#7e57c2"/>
    <rect x="380" y="560" width="120" height="120" fill="#7e57c2"/>
    <rect x="260" y="680" width="120" height="120" fill="#7e57c2"/>
    <rect x="380" y="680" width="120" height="120" fill="#7e57c2"/>`,
  "pac-man": `<rect width="800" height="1000" fill="#0d0d14"/>
    <path d="M400 280 A220 220 0 1 1 400 720 L400 500 Z" fill="#fdd835"/>
    <circle cx="620" cy="500" r="36" fill="#e91e63"/>
    <circle cx="700" cy="500" r="36" fill="#29b6f6"/>
    <circle cx="400" cy="820" r="16" fill="#f4efe4"/>
    <circle cx="460" cy="820" r="16" fill="#f4efe4"/>`,
  "sonic the hedgehog": `<rect width="800" height="1000" fill="#1565c0"/>
    <ellipse cx="400" cy="560" rx="160" ry="220" fill="#29b6f6"/>
    <ellipse cx="400" cy="360" rx="120" ry="130" fill="#29b6f6"/>
    <ellipse cx="360" cy="340" rx="18" ry="22" fill="#111"/>
    <path d="M240 240 Q400 80 400 300" fill="#1565c0"/>
    <path d="M400 80 Q560 240 400 300" fill="#0d47a1"/>
    <ellipse cx="400" cy="820" rx="90" ry="40" fill="#f4efe4"/>`,
  "street fighter ii": `<rect width="800" height="1000" fill="#b71c1c"/>
    <ellipse cx="300" cy="640" rx="140" ry="260" fill="#1565c0"/>
    <ellipse cx="520" cy="640" rx="140" ry="260" fill="#c62828"/>
    <circle cx="300" cy="340" r="90" fill="#f1d0b0"/>
    <circle cx="520" cy="340" r="90" fill="#e2c09a"/>
    <rect x="80" y="860" width="280" height="40" fill="#fdd835"/>
    <rect x="440" y="860" width="280" height="40" fill="#fdd835"/>`,
  "donkey kong": `<rect width="800" height="1000" fill="#1a237e"/>
    <rect x="80" y="200" width="640" height="40" fill="#c62828"/>
    <rect x="80" y="400" width="640" height="40" fill="#c62828"/>
    <rect x="80" y="600" width="640" height="40" fill="#c62828"/>
    <ellipse cx="400" cy="320" rx="110" ry="90" fill="#6d4c41"/>
    <circle cx="240" cy="720" r="50" fill="#c62828"/>`,
  "the sims": `<rect width="800" height="1000" fill="#1565c0"/>
    <polygon points="400,160 460,420 340,420" fill="#7e57c2"/>
    <rect x="220" y="500" width="360" height="320" fill="#ffe082"/>
    <polygon points="200,500 400,360 600,500" fill="#c62828"/>
    <rect x="360" y="640" width="80" height="180" fill="#5d4037"/>`,
  "halo: combat evolved": `<rect width="800" height="1000" fill="#0a1a12"/>
    <ellipse cx="400" cy="420" rx="160" ry="180" fill="#cfd8dc"/>
    <rect x="300" y="380" width="200" height="40" fill="#111"/>
    <circle cx="400" cy="400" r="18" fill="#69f0ae"/>
    <ellipse cx="400" cy="720" rx="200" ry="40" fill="none" stroke="#69f0ae" stroke-width="18"/>
    <ellipse cx="400" cy="720" rx="140" ry="24" fill="none" stroke="#cfd8dc" stroke-width="10"/>`,
  "the elder scrolls v: skyrim": `<rect width="800" height="1000" fill="#1a237e"/>
    <polygon points="80,820 280,300 400,820" fill="#90a4ae"/>
    <polygon points="360,820 520,220 720,820" fill="#eceff1"/>
    <path d="M200 500 Q400 360 600 500" fill="none" stroke="#c9a227" stroke-width="12"/>
    <polygon points="400,360 430,460 370,460" fill="#c9a227"/>`,
  portal: `<rect width="800" height="1000" fill="#eceff1"/>
    <ellipse cx="220" cy="500" rx="70" ry="140" fill="none" stroke="#ff7043" stroke-width="24"/>
    <ellipse cx="580" cy="500" rx="70" ry="140" fill="none" stroke="#29b6f6" stroke-width="24"/>
    <rect x="360" y="420" width="80" height="220" rx="20" fill="#f4efe4" stroke="#90a4ae" stroke-width="8"/>
    <circle cx="400" cy="360" r="36" fill="#f4efe4" stroke="#90a4ae" stroke-width="8"/>`,
  "half-life 2": `<rect width="800" height="1000" fill="#3e2723"/>
    <rect x="200" y="200" width="400" height="560" fill="#6d4c41"/>
    <polygon points="400,240 560,700 240,700" fill="#ff6f00"/>
    <circle cx="400" cy="420" r="70" fill="#212121"/>`,
  "final fantasy vii": `<rect width="800" height="1000" fill="#0d1b2a"/>
    <polygon points="400,180 520,700 280,700" fill="#90caf9"/>
    <rect x="360" y="240" width="80" height="520" fill="#eceff1"/>
    <circle cx="400" cy="220" r="50" fill="#4fc3f7"/>
    <path d="M120 820 Q400 700 680 820" fill="none" stroke="#4fc3f7" stroke-width="10"/>`,
  "pokémon red and blue": `<rect width="800" height="500" fill="#c62828"/>
    <rect y="500" width="800" height="500" fill="#f4efe4"/>
    <circle cx="400" cy="500" r="120" fill="#f4efe4" stroke="#212121" stroke-width="16"/>
    <circle cx="400" cy="500" r="48" fill="#212121"/>
    <circle cx="280" cy="300" r="70" fill="#fdd835"/>
    <ellipse cx="520" cy="720" rx="90" ry="70" fill="#29b6f6"/>`,
  pokémon: `<rect width="800" height="500" fill="#c62828"/>
    <rect y="500" width="800" height="500" fill="#f4efe4"/>
    <circle cx="400" cy="500" r="140" fill="#f4efe4" stroke="#212121" stroke-width="18"/>
    <circle cx="400" cy="500" r="54" fill="#212121"/>`,
  "animal crossing": `<rect width="800" height="1000" fill="#81d4fa"/>
    <rect y="640" width="800" height="360" fill="#66bb6a"/>
    <polygon points="180,640 400,280 620,640" fill="#8d6e63"/>
    <rect x="300" y="520" width="200" height="200" fill="#ffe0b2"/>
    <circle cx="400" cy="420" r="50" fill="#ffcc80"/>
    <circle cx="160" cy="220" r="40" fill="#fff"/>`,
  "the last of us": `<rect width="800" height="1000" fill="#3e2723"/>
    <rect x="80" y="200" width="640" height="620" fill="#5d4037"/>
    <path d="M200 300 Q400 180 600 300 L560 760 H240 Z" fill="#33691e" opacity="0.85"/>
    <rect x="340" y="500" width="40" height="280" fill="#6d4c41"/>
    <circle cx="400" cy="360" r="36" fill="#9e9d24"/>`,
  "god of war": `<rect width="800" height="1000" fill="#1a0a0a"/>
    <ellipse cx="400" cy="640" rx="180" ry="260" fill="#5d4037"/>
    <circle cx="400" cy="320" r="110" fill="#e2c09a"/>
    <path d="M220 240 Q400 80 400 300" fill="#b71c1c"/>
    <rect x="520" y="480" width="28" height="320" fill="#90a4ae"/>
    <path d="M500 480 L640 400 L540 520" fill="#c4122f"/>`,
  "red dead redemption 2": `<rect width="800" height="1000" fill="#4e342e"/>
    <rect y="560" width="800" height="440" fill="#6d4c41"/>
    <circle cx="600" cy="200" r="80" fill="#ff8a65"/>
    <path d="M120 720 Q300 600 500 720 Q620 640 760 700" fill="none" stroke="#3e2723" stroke-width="18"/>
    <ellipse cx="300" cy="760" rx="90" ry="50" fill="#3e2723"/>
    <rect x="250" y="700" width="100" height="70" fill="#5d4037"/>`,
  "among us": `<rect width="800" height="1000" fill="#0d0d14"/>
    <ellipse cx="400" cy="560" rx="170" ry="230" fill="#c62828"/>
    <ellipse cx="430" cy="420" rx="90" ry="70" fill="#90caf9"/>
    <rect x="230" y="560" width="50" height="180" rx="16" fill="#c62828"/>
    <ellipse cx="400" cy="820" rx="80" ry="30" fill="#8e0000"/>`,
  "stardew valley": `<rect width="800" height="1000" fill="#81d4fa"/>
    <rect y="600" width="800" height="400" fill="#8d6e63"/>
    <rect x="80" y="640" width="140" height="200" fill="#43a047"/>
    <rect x="240" y="640" width="140" height="200" fill="#fdd835"/>
    <rect x="400" y="640" width="140" height="200" fill="#43a047"/>
    <polygon points="560,600 700,420 740,600" fill="#6d4c41"/>
    <circle cx="160" cy="200" r="50" fill="#fffde7"/>`,
  celeste: `<rect width="800" height="1000" fill="#4a148c"/>
    <polygon points="80,860 300,300 520,860" fill="#eceff1"/>
    <polygon points="360,860 560,180 760,860" fill="#f4efe4"/>
    <rect x="360" y="700" width="80" height="80" fill="#ec407a"/>
    <circle cx="400" cy="680" r="24" fill="#f8bbd0"/>`,
  "super mario 64": `<rect width="800" height="1000" fill="#29b6f6"/>
    <polygon points="120,860 400,240 680,860" fill="#66bb6a"/>
    <circle cx="400" cy="420" r="80" fill="#c62828"/>
    <rect x="340" y="500" width="120" height="140" fill="#1565c0"/>
    <circle cx="600" cy="180" r="50" fill="#fffde7"/>`,
  "the legend of zelda: breath of the wild": `<rect width="800" height="1000" fill="#4fc3f7"/>
    <polygon points="80,860 260,360 420,860" fill="#8d6e63"/>
    <rect y="700" width="800" height="300" fill="#66bb6a"/>
    <polygon points="400,200 430,280 370,280" fill="#c9a227"/>
    <circle cx="620" cy="180" r="60" fill="#fffde7"/>
    <path d="M500 500 Q620 420 700 520" fill="none" stroke="#43a047" stroke-width="12"/>`,
  "grand theft auto iii": `<rect width="800" height="1000" fill="#1a237e"/>
    <rect y="600" width="800" height="400" fill="#37474f"/>
    <rect x="80" y="420" width="90" height="480" fill="#263238"/>
    <rect x="200" y="360" width="120" height="540" fill="#455a64"/>
    <rect x="360" y="300" width="100" height="600" fill="#263238"/>
    <rect x="500" y="400" width="160" height="500" fill="#37474f"/>
    <rect x="140" y="820" width="200" height="50" fill="#fdd835"/>`,
  "call of duty 4: modern warfare": `<rect width="800" height="1000" fill="#263238"/>
    <rect x="300" y="280" width="200" height="420" fill="#546e7a"/>
    <circle cx="400" cy="240" r="70" fill="#90a4ae"/>
    <rect x="360" y="200" width="80" height="40" fill="#212121"/>
    <rect x="180" y="700" width="440" height="28" fill="#8d6e63"/>
    <circle cx="400" cy="640" r="18" fill="#c62828"/>`,
  "call of duty": `<rect width="800" height="1000" fill="#212121"/>
    <rect x="280" y="260" width="240" height="460" fill="#455a64"/>
    <circle cx="400" cy="220" r="80" fill="#78909c"/>
    <rect x="200" y="720" width="400" height="24" fill="#c62828"/>
    <polygon points="400,140 440,220 360,220" fill="#c62828"/>`,
  "world of warcraft": `<rect width="800" height="1000" fill="#1a237e"/>
    <polygon points="400,160 560,500 240,500" fill="#c9a227"/>
    <circle cx="400" cy="360" r="70" fill="#5d4037"/>
    <path d="M120 780 Q400 640 680 780" fill="#3e2723"/>
    <rect x="360" y="500" width="80" height="260" fill="#8d6e63"/>`,
  "league of legends": `<rect width="800" height="1000" fill="#0d1b2a"/>
    <polygon points="400,180 470,360 330,360" fill="#c9a227"/>
    <circle cx="400" cy="560" r="140" fill="none" stroke="#c9a227" stroke-width="16"/>
    <path d="M200 800 L400 620 L600 800" fill="none" stroke="#90caf9" stroke-width="10"/>`,
  "counter-strike": `<rect width="800" height="1000" fill="#1b5e20"/>
    <rect x="220" y="360" width="360" height="80" rx="12" fill="#cfd8dc"/>
    <rect x="520" y="340" width="160" height="40" fill="#90a4ae"/>
    <circle cx="400" cy="640" r="90" fill="#37474f"/>
    <rect x="160" y="800" width="480" height="24" fill="#c62828"/>`,
  "fifa 98": `<rect width="800" height="1000" fill="#1b5e20"/>
    <ellipse cx="400" cy="560" rx="260" ry="160" fill="#43a047"/>
    <ellipse cx="400" cy="560" rx="260" ry="160" fill="none" stroke="#f4efe4" stroke-width="8"/>
    <circle cx="400" cy="560" r="40" fill="none" stroke="#f4efe4" stroke-width="8"/>
    <circle cx="400" cy="400" r="50" fill="#f4efe4"/>`,
  "ea sports fc": `<rect width="800" height="1000" fill="#0d47a1"/>
    <ellipse cx="400" cy="560" rx="260" ry="160" fill="#1565c0"/>
    <ellipse cx="400" cy="560" rx="260" ry="160" fill="none" stroke="#f4efe4" stroke-width="8"/>
    <rect x="200" y="240" width="400" height="80" fill="#c62828"/>
    <circle cx="400" cy="400" r="50" fill="#f4efe4"/>`,
  "wii sports": `<rect width="800" height="1000" fill="#e3f2fd"/>
    <circle cx="280" cy="420" r="90" fill="#f1d0b0"/>
    <circle cx="520" cy="420" r="90" fill="#e2c09a"/>
    <rect x="200" y="520" width="160" height="260" fill="#1565c0"/>
    <rect x="440" y="520" width="160" height="260" fill="#c62828"/>
    <circle cx="400" cy="200" r="40" fill="#fdd835"/>`,
  "candy crush saga": `<rect width="800" height="1000" fill="#f8bbd0"/>
    <circle cx="250" cy="320" r="80" fill="#e91e63"/>
    <rect x="430" y="250" width="140" height="140" rx="24" fill="#7e57c2"/>
    <polygon points="400,500 480,660 320,660" fill="#43a047"/>
    <circle cx="560" cy="720" r="70" fill="#29b6f6"/>
    <rect x="180" y="680" width="140" height="140" rx="20" fill="#fdd835"/>`,
  roblox: `<rect width="800" height="1000" fill="#e3f2fd"/>
    <rect x="260" y="240" width="280" height="280" fill="#c62828" transform="rotate(20 400 380)"/>
    <rect x="300" y="560" width="200" height="260" fill="#1565c0"/>
    <rect x="240" y="820" width="120" height="80" fill="#212121"/>
    <rect x="440" y="820" width="120" height="80" fill="#212121"/>`,
  overwatch: `<rect width="800" height="1000" fill="#fff8e1"/>
    <circle cx="400" cy="480" r="200" fill="none" stroke="#f9a825" stroke-width="28"/>
    <circle cx="400" cy="480" r="70" fill="#f9a825"/>
    <rect x="360" y="200" width="80" height="80" fill="#f9a825"/>`,
  "elden ring": `<rect width="800" height="1000" fill="#0d1b2a"/>
    <circle cx="400" cy="420" r="160" fill="none" stroke="#c9a227" stroke-width="18"/>
    <circle cx="400" cy="420" r="70" fill="#c9a227"/>
    <polygon points="80,860 400,560 720,860" fill="#1b263b"/>
    <path d="M200 700 L400 520 L600 700" fill="none" stroke="#90caf9" stroke-width="8"/>`,
  "baldur's gate 3": `<rect width="800" height="1000" fill="#3e2723"/>
    <polygon points="400,160 560,420 240,420" fill="#c9a227"/>
    <rect x="260" y="420" width="280" height="360" fill="#5d4037"/>
    <circle cx="400" cy="300" r="36" fill="#b71c1c"/>
    <path d="M160 860 Q400 720 640 860" fill="#212121"/>`,
  "the witcher 3: wild hunt": `<rect width="800" height="1000" fill="#0d1b2a"/>
    <polygon points="400,180 520,420 280,420" fill="#f4efe4"/>
    <circle cx="400" cy="300" r="28" fill="#111"/>
    <rect x="360" y="420" width="80" height="320" fill="#c9a227"/>
    <path d="M120 820 Q400 640 680 820" fill="none" stroke="#90caf9" stroke-width="10"/>`,
  "super smash bros. melee": `<rect width="800" height="1000" fill="#1565c0"/>
    <circle cx="280" cy="400" r="90" fill="#c62828"/>
    <circle cx="520" cy="400" r="90" fill="#fdd835"/>
    <circle cx="280" cy="680" r="90" fill="#43a047"/>
    <circle cx="520" cy="680" r="90" fill="#7e57c2"/>
    <rect x="200" y="860" width="400" height="28" fill="#f4efe4"/>`,
  "mario kart": `<rect width="800" height="1000" fill="#29b6f6"/>
    <ellipse cx="400" cy="720" rx="220" ry="70" fill="#424242"/>
    <rect x="260" y="480" width="280" height="200" rx="40" fill="#c62828"/>
    <circle cx="280" cy="720" r="70" fill="#212121"/>
    <circle cx="520" cy="720" r="70" fill="#212121"/>
    <circle cx="400" cy="400" r="70" fill="#f1d0b0"/>
    <rect x="340" y="360" width="120" height="30" fill="#c62828"/>
    <path d="M80 280 Q400 180 720 280" fill="none" stroke="#fdd835" stroke-width="16"/>`,
  "rocket league": `<rect width="800" height="1000" fill="#0d47a1"/>
    <ellipse cx="400" cy="780" rx="240" ry="50" fill="#1565c0"/>
    <rect x="240" y="480" width="320" height="160" rx="30" fill="#c62828"/>
    <circle cx="280" cy="680" r="50" fill="#212121"/>
    <circle cx="520" cy="680" r="50" fill="#212121"/>
    <circle cx="400" cy="360" r="80" fill="#f4efe4"/>
    <circle cx="400" cy="360" r="50" fill="#212121"/>`,
  halo: `<rect width="800" height="1000" fill="#0a1a12"/>
    <ellipse cx="400" cy="400" rx="150" ry="170" fill="#cfd8dc"/>
    <rect x="310" y="360" width="180" height="36" fill="#111"/>
    <ellipse cx="400" cy="700" rx="220" ry="36" fill="none" stroke="#69f0ae" stroke-width="16"/>`,
};

const MOVIE_COVERS: Record<string, string> = {
  metropolis: `<rect x="120" y="160" width="120" height="640" fill="#90a4ae"/>
    <rect x="280" y="220" width="160" height="580" fill="#78909c"/>
    <rect x="480" y="120" width="180" height="680" fill="#546e7a"/>
    <circle cx="400" cy="240" r="40" fill="#fdd835"/>`,
  nosferatu: `<rect width="800" height="1000" fill="#212121"/>
    <ellipse cx="400" cy="420" rx="140" ry="180" fill="#eceff1"/>
    <path d="M300 280 L340 360 L300 360" fill="#eceff1"/>
    <path d="M500 280 L460 360 L500 360" fill="#eceff1"/>
    <ellipse cx="360" cy="400" rx="16" ry="28" fill="#111"/>
    <ellipse cx="440" cy="400" rx="16" ry="28" fill="#111"/>`,
  "the kid": `<rect y="640" width="800" height="360" fill="#8d6e63"/>
    <circle cx="300" cy="420" r="80" fill="#f1d0b0"/>
    <circle cx="480" cy="500" r="50" fill="#f1d0b0"/>
    <rect x="240" y="500" width="120" height="200" fill="#37474f"/>
    <rect x="440" y="550" width="80" height="140" fill="#1565c0"/>`,
  "steamboat bill jr.": `<rect y="560" width="800" height="440" fill="#1565c0"/>
    <rect x="160" y="300" width="480" height="280" fill="#f4efe4"/>
    <rect x="200" y="240" width="80" height="80" fill="#c62828"/>
    <circle cx="560" cy="420" r="40" fill="#90caf9"/>`,
  "the general": `<rect y="640" width="800" height="360" fill="#5d4037"/>
    <rect x="120" y="420" width="560" height="220" fill="#212121"/>
    <circle cx="220" cy="660" r="60" fill="#424242"/>
    <circle cx="580" cy="660" r="60" fill="#424242"/>
    <rect x="400" y="300" width="40" height="140" fill="#c62828"/>`,
  casablanca: `<rect width="800" height="1000" fill="#1a237e"/>
    <rect x="80" y="200" width="640" height="24" fill="#f4efe4"/>
    <rect x="80" y="260" width="640" height="24" fill="#f4efe4"/>
    <rect x="80" y="320" width="640" height="24" fill="#f4efe4"/>
    <ellipse cx="400" cy="640" rx="140" ry="200" fill="#37474f"/>
    <circle cx="400" cy="400" r="80" fill="#e2c09a"/>`,
  "citizen kane": `<rect width="800" height="1000" fill="#212121"/>
    <rect x="200" y="180" width="400" height="560" fill="#5d4037"/>
    <circle cx="400" cy="360" r="70" fill="#f1d0b0"/>
    <rect x="260" y="720" width="280" height="40" fill="#c9a227"/>
    <path d="M80 860 L400 640 L720 860" fill="#111"/>`,
  "the wizard of oz": `<rect width="800" height="420" fill="#29b6f6"/>
    <rect y="420" width="800" height="580" fill="#66bb6a"/>
    <path d="M80 860 Q400 500 720 860" fill="none" stroke="#f9a825" stroke-width="28"/>
    <polygon points="560,200 620,360 500,360" fill="#eceff1"/>
    <circle cx="180" cy="180" r="50" fill="#fffde7"/>`,
  "it's a wonderful life": `<rect width="800" height="1000" fill="#0d1b2a"/>
    <rect x="200" y="360" width="400" height="420" fill="#eceff1"/>
    <polygon points="180,360 400,180 620,360" fill="#c62828"/>
    <rect x="360" y="560" width="80" height="220" fill="#5d4037"/>
    <circle cx="620" cy="200" r="40" fill="#fffde7"/>`,
  "singin' in the rain": `<rect width="800" height="1000" fill="#4a148c"/>
    <circle cx="400" cy="360" r="90" fill="#f1d0b0"/>
    <path d="M280 280 Q400 180 520 280" fill="#212121"/>
    <rect x="280" y="460" width="240" height="280" fill="#1565c0"/>
    <path d="M200 200 L220 320" stroke="#90caf9" stroke-width="8"/>
    <path d="M600 180 L580 320" stroke="#90caf9" stroke-width="8"/>`,
  "seven samurai": `<rect width="800" height="1000" fill="#3e2723"/>
    <rect x="140" y="500" width="28" height="320" fill="#cfd8dc"/>
    <rect x="280" y="460" width="28" height="360" fill="#cfd8dc"/>
    <rect x="420" y="480" width="28" height="340" fill="#cfd8dc"/>
    <rect x="560" y="440" width="28" height="380" fill="#cfd8dc"/>
    <circle cx="154" cy="460" r="36" fill="#e2c09a"/>
    <circle cx="294" cy="420" r="36" fill="#e2c09a"/>`,
  psycho: `<rect width="800" height="1000" fill="#212121"/>
    <polygon points="80,860 280,200 400,860" fill="#eceff1"/>
    <rect x="480" y="300" width="200" height="400" fill="#37474f"/>
    <path d="M200 240 L600 240" stroke="#c62828" stroke-width="12"/>
    <path d="M220 300 L580 300" stroke="#c62828" stroke-width="8"/>`,
  "lawrence of arabia": `<rect width="800" height="1000" fill="#ffe082"/>
    <circle cx="600" cy="180" r="80" fill="#ff8a65"/>
    <path d="M80 640 Q400 480 720 640 L720 900 L80 900 Z" fill="#ffcc80"/>
    <ellipse cx="400" cy="700" rx="50" ry="80" fill="#f4efe4"/>`,
  "the godfather": `<rect width="800" height="1000" fill="#1a1208"/>
    <rect x="80" y="160" width="640" height="20" fill="#f4efe4"/>
    <rect x="80" y="220" width="640" height="20" fill="#f4efe4"/>
    <rect x="80" y="280" width="640" height="20" fill="#f4efe4"/>
    <circle cx="400" cy="520" r="110" fill="#e2c09a"/>
    <path d="M280 430 H520" stroke="#111" stroke-width="16"/>
    <ellipse cx="400" cy="800" rx="40" ry="50" fill="#ef6c00"/>`,
  jaws: `<rect width="800" height="420" fill="#81d4fa"/>
    <rect y="420" width="800" height="580" fill="#0d47a1"/>
    <polygon points="280,420 400,220 520,420 400,860" fill="#546e7a"/>
    <path d="M80 420 H720" stroke="#f4efe4" stroke-width="8"/>
    <rect x="500" y="300" width="160" height="50" fill="#f4efe4"/>`,
  "star wars": `<rect width="800" height="1000" fill="#0d0d14"/>
    ${Array.from({ length: 18 }, (_, i) => `<circle cx="${80 + (i * 137) % 720}" cy="${80 + (i * 89) % 900}" r="3" fill="#f4efe4"/>`).join("")}
    <polygon points="400,180 560,860 240,860" fill="#eceff1"/>
    <rect x="120" y="500" width="220" height="16" fill="#c62828"/>
    <rect x="460" y="560" width="220" height="16" fill="#43a047"/>`,
  "raiders of the lost ark": `<rect width="800" height="1000" fill="#ffe082"/>
    <rect x="200" y="280" width="400" height="480" fill="#c9a227"/>
    <rect x="240" y="320" width="320" height="400" fill="#6d4c41"/>
    <circle cx="400" cy="200" r="50" fill="#ff8a65"/>
    <path d="M80 860 Q400 700 720 860" fill="#ffcc80"/>`,
  "e.t. the extra-terrestrial": `<rect width="800" height="1000" fill="#0d1b2a"/>
    <ellipse cx="400" cy="560" rx="140" ry="200" fill="#bcaaa4"/>
    <ellipse cx="400" cy="360" rx="90" ry="110" fill="#bcaaa4"/>
    <ellipse cx="360" cy="340" rx="16" ry="24" fill="#111"/>
    <ellipse cx="440" cy="340" rx="16" ry="24" fill="#111"/>
    <circle cx="600" cy="180" r="40" fill="#fffde7"/>
    <path d="M520 500 L640 360" stroke="#bcaaa4" stroke-width="18"/>`,
  "back to the future": `<rect width="800" height="1000" fill="#0d47a1"/>
    <rect x="160" y="420" width="480" height="200" rx="40" fill="#c62828"/>
    <circle cx="240" cy="640" r="60" fill="#212121"/>
    <circle cx="560" cy="640" r="60" fill="#212121"/>
    <path d="M200 400 L280 280 L360 400" fill="#00e5ff"/>
    <rect x="300" y="200" width="200" height="40" fill="#fdd835"/>`,
  "spirited away": `<rect width="800" height="1000" fill="#4fc3f7"/>
    <rect x="200" y="300" width="400" height="480" fill="#c62828"/>
    <polygon points="180,300 400,140 620,300" fill="#1565c0"/>
    <circle cx="400" cy="220" r="36" fill="#fdd835"/>
    <rect y="780" width="800" height="220" fill="#81c784"/>`,
  "the lord of the rings: the fellowship of the ring": `<rect width="800" height="1000" fill="#1a237e"/>
    <polygon points="80,860 260,240 420,860" fill="#90a4ae"/>
    <circle cx="400" cy="420" r="70" fill="#c9a227"/>
    <circle cx="400" cy="420" r="28" fill="#3e2723"/>
    <path d="M200 700 Q400 560 600 700" fill="none" stroke="#c9a227" stroke-width="10"/>`,
  "the dark knight": `<rect width="800" height="1000" fill="#0b0d14"/>
    <path d="M160 560 Q400 720 640 560 Q400 640 160 560" fill="#f4c430"/>
    <path d="M300 240 L400 160 L500 240 L470 400 H330 Z" fill="#212121"/>
    <path d="M250 200 L320 340" stroke="#212121" stroke-width="24"/>
    <path d="M550 200 L480 340" stroke="#212121" stroke-width="24"/>`,
  inception: `<rect width="800" height="1000" fill="#90caf9"/>
    <rect x="80" y="200" width="280" height="600" fill="#37474f"/>
    <rect x="440" y="80" width="280" height="600" fill="#546e7a" transform="rotate(18 580 380)"/>
    <circle cx="400" cy="860" r="30" fill="#fdd835"/>`,
  parasite: `<rect width="800" height="500" fill="#4fc3f7"/>
    <rect y="500" width="800" height="500" fill="#5d4037"/>
    <rect x="240" y="280" width="320" height="220" fill="#eceff1"/>
    <rect x="200" y="560" width="400" height="280" fill="#3e2723"/>
    <rect x="360" y="700" width="80" height="140" fill="#212121"/>`,
  titanic: `<rect width="800" height="1000" fill="#0d47a1"/>
    <rect x="160" y="240" width="480" height="160" fill="#eceff1"/>
    <polygon points="80,240 200,80 280,240" fill="#e3f2fd"/>
    <rect y="500" width="800" height="500" fill="#1565c0"/>
    <rect x="200" y="400" width="400" height="80" fill="#cfd8dc"/>`,
  "jurassic park": `<rect width="800" height="1000" fill="#1b5e20"/>
    <ellipse cx="400" cy="560" rx="200" ry="140" fill="#33691e"/>
    <path d="M240 500 Q400 280 400 500" fill="#2e7d32"/>
    <ellipse cx="400" cy="420" rx="70" ry="90" fill="#558b2f"/>
    <rect x="200" y="720" width="400" height="40" fill="#c9a227"/>
    <circle cx="360" cy="400" r="10" fill="#111"/>`,
  "the matrix": `<rect width="800" height="1000" fill="#0a0a0a"/>
    ${Array.from({ length: 12 }, (_, i) => `<text x="${60 + i * 60}" y="200" font-size="28" fill="#00e676" font-family="monospace">01</text><text x="${80 + i * 60}" y="400" font-size="28" fill="#00e676" font-family="monospace">10</text><text x="${40 + i * 60}" y="620" font-size="28" fill="#00c853" font-family="monospace">01</text>`).join("")}
    <ellipse cx="340" cy="400" rx="50" ry="28" fill="#111" stroke="#00e676" stroke-width="6"/>
    <ellipse cx="460" cy="400" rx="50" ry="28" fill="#111" stroke="#00e676" stroke-width="6"/>
    <path d="M390 400 H410" stroke="#00e676" stroke-width="6"/>
    <path d="M200 280 L280 360" stroke="#00e676" stroke-width="4"/>
    <path d="M600 280 L520 360" stroke="#00e676" stroke-width="4"/>`,
  "forrest gump": `<rect width="800" height="1000" fill="#81d4fa"/>
    <rect y="640" width="800" height="360" fill="#66bb6a"/>
    <path d="M80 640 Q400 560 720 640" fill="none" stroke="#eceff1" stroke-width="18"/>
    <ellipse cx="400" cy="720" rx="40" ry="70" fill="#1565c0"/>
    <circle cx="400" cy="620" r="40" fill="#f1d0b0"/>`,
  "pulp fiction": `<rect width="800" height="1000" fill="#fbe9e7"/>
    <rect x="80" y="160" width="640" height="680" fill="#212121"/>
    <circle cx="280" cy="420" r="70" fill="#e2c09a"/>
    <circle cx="520" cy="420" r="70" fill="#e2c09a"/>
    <rect x="220" y="520" width="120" height="200" fill="#f4efe4"/>
    <rect x="460" y="520" width="120" height="200" fill="#212121"/>`,
  "the shawshank redemption": `<rect width="800" height="1000" fill="#37474f"/>
    <rect x="120" y="160" width="560" height="680" fill="#546e7a"/>
    <rect x="200" y="240" width="80" height="120" fill="#90caf9"/>
    <rect x="360" y="240" width="80" height="120" fill="#90caf9"/>
    <rect x="520" y="240" width="80" height="120" fill="#90caf9"/>
    <rect x="340" y="640" width="120" height="200" fill="#3e2723"/>`,
  avatar: `<rect width="800" height="1000" fill="#0d47a1"/>
    <circle cx="600" cy="180" r="70" fill="#81d4fa"/>
    <path d="M80 860 Q400 500 720 860" fill="#00695c"/>
    <ellipse cx="400" cy="560" rx="80" ry="140" fill="#26c6da"/>
    <path d="M300 240 Q400 160 500 240" fill="#4fc3f7"/>`,
  frozen: `<rect width="800" height="1000" fill="#e3f2fd"/>
    <polygon points="400,160 460,500 340,500" fill="#90caf9"/>
    <polygon points="200,860 320,360 440,860" fill="#bbdefb"/>
    <polygon points="400,860 560,280 720,860" fill="#e3f2fd" stroke="#90caf9"/>
    <circle cx="160" cy="200" r="40" fill="#fff"/>`,
  "toy story": `<rect width="800" height="1000" fill="#fff8e1"/>
    <rect x="220" y="280" width="160" height="420" fill="#fdd835"/>
    <rect x="430" y="300" width="160" height="400" fill="#c62828"/>
    <circle cx="300" cy="240" r="50" fill="#f1d0b0"/>
    <rect x="450" y="240" width="120" height="80" fill="#eceff1"/>
    <rect y="780" width="800" height="220" fill="#66bb6a"/>`,
  "the lion king": `<rect width="800" height="1000" fill="#ff8a65"/>
    <circle cx="400" cy="220" r="90" fill="#fdd835"/>
    <ellipse cx="400" cy="640" rx="160" ry="180" fill="#f9a825"/>
    <ellipse cx="400" cy="420" rx="110" ry="100" fill="#f9a825"/>
    <path d="M300 360 Q400 280 500 360" fill="#ef6c00"/>
    <ellipse cx="360" cy="400" rx="12" ry="16" fill="#111"/>`,
  "harry potter and the philosopher's stone": `<rect width="800" height="1000" fill="#1a237e"/>
    <polygon points="180,860 400,160 620,860" fill="#c62828"/>
    <rect x="300" y="420" width="200" height="280" fill="#5d4037"/>
    <polygon points="360,360 400,280 440,360" fill="#c9a227"/>
    <rect x="380" y="500" width="16" height="220" fill="#c9a227"/>`,
  "avengers: endgame": `<rect width="800" height="1000" fill="#0c1c3d"/>
    <circle cx="400" cy="480" r="180" fill="none" stroke="#c9a227" stroke-width="16"/>
    <circle cx="400" cy="480" r="28" fill="#c9a227"/>
    <circle cx="400" cy="300" r="24" fill="#c4122f"/>
    <circle cx="250" cy="480" r="24" fill="#1565c0"/>
    <circle cx="550" cy="480" r="24" fill="#43a047"/>
    <circle cx="400" cy="660" r="24" fill="#7b5ea7"/>`,
  "black panther": `<rect width="800" height="1000" fill="#0b0b12"/>
    <ellipse cx="400" cy="560" rx="170" ry="250" fill="#212121"/>
    <path d="M280 230 L340 340 L300 340 Z" fill="#212121"/>
    <path d="M520 230 L460 340 L500 340 Z" fill="#212121"/>
    <path d="M240 560 Q400 700 560 560" fill="#7b5ea7"/>`,
  "spider-man: into the spider-verse": `<rect width="800" height="1000" fill="#0d0d14"/>
    <path d="M80 80 L720 920 M720 80 L80 920 M400 40 V960 M40 400 H760" stroke="#e040fb" stroke-width="6"/>
    <ellipse cx="400" cy="500" rx="140" ry="180" fill="#e31c23"/>
    <ellipse cx="350" cy="460" rx="36" ry="44" fill="#f4efe4"/>
    <ellipse cx="450" cy="460" rx="36" ry="44" fill="#f4efe4"/>`,
  "get out": `<rect width="800" height="1000" fill="#eceff1"/>
    <rect x="160" y="200" width="480" height="560" fill="#90caf9"/>
    <circle cx="400" cy="420" r="90" fill="#5d4037"/>
    <rect x="280" y="520" width="240" height="200" fill="#f4efe4"/>
    <circle cx="400" cy="400" r="70" fill="#fff" opacity="0.35"/>`,
  "mad max: fury road": `<rect width="800" height="1000" fill="#ff8a65"/>
    <rect y="560" width="800" height="440" fill="#ef6c00"/>
    <rect x="160" y="480" width="480" height="160" fill="#424242"/>
    <circle cx="240" cy="660" r="70" fill="#212121"/>
    <circle cx="560" cy="660" r="70" fill="#212121"/>
    <rect x="500" y="400" width="40" height="80" fill="#c62828"/>`,
};

function tvArt(bg: string, scene: string) {
  return `<rect width="800" height="1000" fill="${bg}"/>${scene}`;
}

const TV_COVERS: Record<string, string> = {
  friends: tvArt("#7e57c2", `<rect x="120" y="280" width="560" height="420" fill="#ffe0b2"/>
    <rect x="180" y="500" width="440" height="140" fill="#8d6e63"/>
    <circle cx="250" cy="420" r="36" fill="#f1d0b0"/>
    <circle cx="400" cy="400" r="36" fill="#e2c09a"/>
    <circle cx="550" cy="420" r="36" fill="#f1d0b0"/>
    <path d="M80 220 Q400 80 720 220" fill="none" stroke="#f4efe4" stroke-width="10"/>`),
  "breaking bad": tvArt("#ffe082", `<rect y="560" width="800" height="440" fill="#ffcc80"/>
    <rect x="220" y="420" width="360" height="180" fill="#eceff1"/>
    <circle cx="180" cy="500" r="50" fill="#212121"/>
    <circle cx="620" cy="500" r="50" fill="#212121"/>
    <rect x="300" y="240" width="200" height="80" fill="#1b5e20"/>`),
  "game of thrones": tvArt("#1a237e", `<path d="M200 760 L280 360 L360 760 L440 400 L520 760 L600 360 L680 760" fill="#90a4ae"/>
    <path d="M160 760 H720" stroke="#c9a227" stroke-width="12"/>
    <polygon points="400,160 430,260 370,260" fill="#c62828"/>`),
  "the simpsons": tvArt("#29b6f6", `<rect y="640" width="800" height="360" fill="#66bb6a"/>
    <rect x="200" y="360" width="400" height="280" fill="#fdd835"/>
    <polygon points="180,360 400,180 620,360" fill="#c62828"/>
    <rect x="360" y="500" width="80" height="140" fill="#5d4037"/>
    <circle cx="300" cy="300" r="40" fill="#fdd835"/>`),
  "the office": tvArt("#eceff1", `<rect x="80" y="200" width="640" height="560" fill="#f4efe4"/>
    <rect x="120" y="260" width="240" height="140" fill="#90caf9"/>
    <rect x="440" y="260" width="240" height="140" fill="#90caf9"/>
    <rect x="200" y="500" width="400" height="160" fill="#ffe0b2"/>
    <circle cx="400" cy="480" r="36" fill="#f1d0b0"/>`),
  "stranger things": tvArt("#0d0d14", `<rect x="80" y="200" width="640" height="24" fill="#c62828"/>
    <rect x="80" y="280" width="640" height="24" fill="#c62828"/>
    <polygon points="400,360 560,820 240,820" fill="#212121"/>
    <circle cx="400" cy="500" r="40" fill="#ef6c00"/>
    <path d="M200 160 H600" stroke="#c62828" stroke-width="10"/>`),
  "the sopranos": tvArt("#1a237e", `<rect x="160" y="300" width="480" height="420" fill="#5d4037"/>
    <circle cx="400" cy="360" r="80" fill="#e2c09a"/>
    <rect x="240" y="720" width="320" height="40" fill="#c9a227"/>
    <path d="M80 860 Q400 700 720 860" fill="#0d47a1"/>`),
  "the big bang theory": tvArt("#0d47a1", `<rect x="140" y="240" width="520" height="520" fill="#eceff1"/>
    <circle cx="280" cy="420" r="50" fill="#f1d0b0"/>
    <circle cx="520" cy="420" r="50" fill="#e2c09a"/>
    <rect x="220" y="500" width="120" height="180" fill="#c62828"/>
    <rect x="460" y="500" width="120" height="180" fill="#1565c0"/>
    <circle cx="400" cy="200" r="36" fill="#fdd835"/>`),
  sherlock: tvArt("#263238", `<rect x="200" y="180" width="400" height="560" fill="#37474f"/>
    <circle cx="400" cy="320" r="80" fill="#e2c09a"/>
    <path d="M280 240 Q400 160 520 240" fill="#212121"/>
    <rect x="300" y="720" width="200" height="28" fill="#c9a227"/>
    <circle cx="560" cy="500" r="40" fill="#90caf9" opacity="0.5"/>`),
  "peaky blinders": tvArt("#3e2723", `<ellipse cx="400" cy="560" rx="160" ry="240" fill="#5d4037"/>
    <circle cx="400" cy="320" r="90" fill="#e2c09a"/>
    <path d="M280 250 H520 L480 320 H320 Z" fill="#212121"/>
    <rect x="240" y="240" width="320" height="24" fill="#212121"/>`),
  "the walking dead": tvArt("#33691e", `<ellipse cx="400" cy="520" rx="150" ry="200" fill="#9e9e9e"/>
    <circle cx="400" cy="320" r="90" fill="#bcaaa4"/>
    <path d="M300 300 L360 360" stroke="#1b5e20" stroke-width="12"/>
    <rect x="160" y="760" width="480" height="40" fill="#3e2723"/>`),
  wednesday: tvArt("#0d0d14", `<rect x="200" y="220" width="400" height="560" fill="#212121"/>
    <circle cx="400" cy="360" r="80" fill="#f1d0b0"/>
    <path d="M280 260 Q400 180 520 260" fill="#111"/>
    <rect x="300" y="500" width="200" height="220" fill="#212121"/>
    <path d="M160 180 H640" stroke="#f4efe4" stroke-width="8"/>`),
  "the crown": tvArt("#1a237e", `<path d="M220 360 L280 240 L340 360 L400 200 L460 360 L520 240 L580 360" fill="#c9a227"/>
    <circle cx="400" cy="200" r="24" fill="#c62828"/>
    <ellipse cx="400" cy="640" rx="140" ry="180" fill="#4527a0"/>
    <circle cx="400" cy="480" r="70" fill="#e2c09a"/>`),
  "black mirror": tvArt("#111", `<rect x="160" y="180" width="480" height="640" rx="24" fill="#212121"/>
    <rect x="200" y="220" width="400" height="240" fill="#90caf9"/>
    <circle cx="400" cy="620" r="40" fill="#424242"/>
    <rect x="300" y="720" width="200" height="16" fill="#616161"/>`),
  seinfeld: tvArt("#fff8e1", `<rect x="120" y="240" width="560" height="500" fill="#ffe0b2"/>
    <rect x="180" y="500" width="440" height="160" fill="#8d6e63"/>
    <circle cx="280" cy="400" r="40" fill="#f1d0b0"/>
    <circle cx="400" cy="380" r="40" fill="#e2c09a"/>
    <circle cx="520" cy="400" r="40" fill="#f1d0b0"/>`),
  "the wire": tvArt("#263238", `<rect x="80" y="300" width="160" height="500" fill="#455a64"/>
    <rect x="280" y="220" width="180" height="580" fill="#37474f"/>
    <rect x="500" y="280" width="200" height="520" fill="#546e7a"/>
    <rect x="200" y="820" width="400" height="24" fill="#c62828"/>
    <circle cx="400" cy="160" r="30" fill="#90caf9"/>`),
  "mad men": tvArt("#3e2723", `<rect x="200" y="240" width="400" height="520" fill="#5d4037"/>
    <circle cx="400" cy="360" r="70" fill="#e2c09a"/>
    <rect x="280" y="280" width="240" height="24" fill="#212121"/>
    <rect x="240" y="700" width="320" height="40" fill="#c9a227"/>
    <path d="M560 300 Q620 240 640 320" fill="none" stroke="#bdbdbd" stroke-width="8"/>`),
  lost: tvArt("#29b6f6", `<rect y="560" width="800" height="440" fill="#1565c0"/>
    <ellipse cx="400" cy="640" rx="280" ry="80" fill="#66bb6a"/>
    <path d="M200 300 L400 500 L600 300" fill="#90a4ae"/>
    <circle cx="600" cy="180" r="50" fill="#fffde7"/>`),
  "grey's anatomy": tvArt("#eceff1", `<rect x="180" y="240" width="440" height="560" fill="#f4efe4"/>
    <circle cx="400" cy="360" r="70" fill="#e2c09a"/>
    <rect x="260" y="500" width="280" height="200" fill="#f8bbd0"/>
    <path d="M300 420 L400 520 L500 420" fill="#c62828"/>`),
  "law & order": tvArt("#1a237e", `<rect x="80" y="200" width="640" height="80" fill="#c9a227"/>
    <rect x="200" y="360" width="400" height="420" fill="#37474f"/>
    <circle cx="400" cy="480" r="60" fill="#e2c09a"/>
    <rect x="300" y="700" width="200" height="40" fill="#c9a227"/>`),
  "doctor who": tvArt("#0d47a1", `<rect x="260" y="200" width="280" height="620" fill="#1565c0"/>
    <rect x="280" y="240" width="240" height="80" fill="#0d47a1"/>
    <rect x="280" y="360" width="240" height="80" fill="#0d47a1"/>
    <rect x="280" y="480" width="240" height="80" fill="#0d47a1"/>
    <rect x="360" y="160" width="80" height="40" fill="#c62828"/>`),
  "star trek": tvArt("#0d0d14", `<ellipse cx="400" cy="560" rx="220" ry="80" fill="#90a4ae"/>
    <rect x="300" y="420" width="200" height="160" fill="#cfd8dc"/>
    <circle cx="400" cy="300" r="50" fill="#fdd835"/>
    ${Array.from({ length: 10 }, (_, i) => `<circle cx="${100 + i * 70}" cy="${120 + (i % 3) * 40}" r="3" fill="#fff"/>`).join("")}`),
  "the mandalorian": tvArt("#3e2723", `<ellipse cx="400" cy="560" rx="160" ry="240" fill="#8d6e63"/>
    <ellipse cx="400" cy="340" rx="120" ry="130" fill="#cfd8dc"/>
    <rect x="300" y="360" width="200" height="28" fill="#111"/>
    <rect x="240" y="700" width="320" height="40" fill="#c9a227"/>
    <circle cx="560" cy="720" r="50" fill="#81c784"/>`),
  succession: tvArt("#1a237e", `<rect x="160" y="200" width="480" height="560" fill="#eceff1"/>
    <rect x="200" y="260" width="400" height="200" fill="#90caf9"/>
    <circle cx="400" cy="560" r="60" fill="#e2c09a"/>
    <rect x="300" y="640" width="200" height="80" fill="#212121"/>`),
  "the bear": tvArt("#b71c1c", `<rect x="180" y="240" width="440" height="520" fill="#eceff1"/>
    <circle cx="400" cy="400" r="70" fill="#e2c09a"/>
    <rect x="260" y="500" width="280" height="180" fill="#f4efe4"/>
    <path d="M300 300 H500" stroke="#c62828" stroke-width="16"/>`),
  "squid game": tvArt("#f8bbd0", `<polygon points="400,200 520,420 280,420" fill="#00e5ff"/>
    <circle cx="400" cy="560" r="80" fill="#00e5ff"/>
    <rect x="320" y="680" width="160" height="160" fill="#00e5ff"/>
    <rect y="900" width="800" height="100" fill="#c62828"/>`),
  bridgerton: tvArt("#e1bee7", `<rect x="160" y="200" width="480" height="560" fill="#f3e5f5"/>
    <circle cx="400" cy="360" r="80" fill="#e2c09a"/>
    <path d="M280 280 Q400 180 520 280" fill="#6a1b9a"/>
    <rect x="260" y="500" width="280" height="200" fill="#ce93d8"/>`),
  "house of the dragon": tvArt("#1a0a0a", `<path d="M160 700 Q400 200 640 700" fill="#c62828"/>
    <circle cx="280" cy="420" r="30" fill="#fdd835"/>
    <circle cx="520" cy="420" r="30" fill="#fdd835"/>
    <path d="M200 240 L280 360 L200 340" fill="#c62828"/>
    <path d="M600 240 L520 360 L600 340" fill="#c62828"/>`),
  "better call saul": tvArt("#fdd835", `<rect x="160" y="240" width="480" height="520" fill="#eceff1"/>
    <circle cx="400" cy="400" r="70" fill="#e2c09a"/>
    <rect x="260" y="500" width="280" height="180" fill="#1565c0"/>
    <rect x="200" y="200" width="400" height="40" fill="#c62828"/>`),
  "true detective": tvArt("#3e2723", `<rect y="640" width="800" height="360" fill="#5d4037"/>
    <circle cx="560" cy="220" r="60" fill="#ffcc80"/>
    <rect x="280" y="500" width="240" height="200" fill="#37474f"/>
    <path d="M80 640 Q400 520 720 640" fill="none" stroke="#ff8a65" stroke-width="10"/>`),
  westworld: tvArt("#efebe9", `<rect x="160" y="240" width="480" height="520" fill="#d7ccc8"/>
    <circle cx="400" cy="400" r="70" fill="#e2c09a"/>
    <rect x="300" y="360" width="200" height="20" fill="#212121"/>
    <circle cx="400" cy="640" r="50" fill="#90a4ae"/>`),
  "the handmaid's tale": tvArt("#b71c1c", `<ellipse cx="400" cy="600" rx="170" ry="250" fill="#c62828"/>
    <circle cx="400" cy="360" r="90" fill="#e2c09a"/>
    <path d="M250 280 Q400 140 550 280 L500 380 H300 Z" fill="#f4efe4"/>`),
  fargo: tvArt("#e3f2fd", `<rect y="640" width="800" height="360" fill="#eceff1"/>
    <polygon points="200,640 400,280 600,640" fill="#90caf9"/>
    <rect x="300" y="560" width="200" height="160" fill="#c62828"/>
    <circle cx="160" cy="200" r="40" fill="#fff"/>`),
  chernobyl: tvArt("#37474f", `<rect x="160" y="300" width="480" height="420" fill="#546e7a"/>
    <rect x="300" y="180" width="200" height="160" fill="#90a4ae"/>
    <circle cx="400" cy="220" r="24" fill="#c62828"/>
    <path d="M80 860 Q400 700 720 860" fill="#212121"/>`),
  "band of brothers": tvArt("#3e2723", `<rect x="80" y="560" width="640" height="80" fill="#5d4037"/>
    <ellipse cx="280" cy="500" rx="70" ry="120" fill="#6d4c41"/>
    <ellipse cx="520" cy="500" rx="70" ry="120" fill="#6d4c41"/>
    <circle cx="280" cy="360" r="50" fill="#e2c09a"/>
    <circle cx="520" cy="360" r="50" fill="#e2c09a"/>
    <rect x="240" y="320" width="80" height="24" fill="#4e342e"/>`),
  "planet earth": tvArt("#0d47a1", `<circle cx="400" cy="480" r="220" fill="#1565c0"/>
    <ellipse cx="340" cy="420" rx="120" ry="70" fill="#66bb6a"/>
    <ellipse cx="480" cy="560" rx="90" ry="50" fill="#43a047"/>
    <circle cx="600" cy="180" r="40" fill="#fffde7"/>`),
  "only fools and horses": tvArt("#fdd835", `<rect x="160" y="360" width="480" height="280" fill="#c62828"/>
    <circle cx="240" cy="640" r="60" fill="#212121"/>
    <circle cx="560" cy="640" r="60" fill="#212121"/>
    <circle cx="300" cy="320" r="50" fill="#f1d0b0"/>
    <circle cx="500" cy="320" r="50" fill="#e2c09a"/>`),
  "downton abbey": tvArt("#3e2723", `<rect x="120" y="300" width="560" height="460" fill="#efebe9"/>
    <polygon points="100,300 400,140 700,300" fill="#5d4037"/>
    <rect x="200" y="360" width="80" height="100" fill="#90caf9"/>
    <rect x="360" y="360" width="80" height="100" fill="#90caf9"/>
    <rect x="520" y="360" width="80" height="100" fill="#90caf9"/>`),
  "i love lucy": tvArt("#b71c1c", `<rect x="160" y="240" width="480" height="520" fill="#fce4ec"/>
    <circle cx="400" cy="400" r="80" fill="#e2c09a"/>
    <path d="M280 320 Q400 220 520 320" fill="#c62828"/>
    <rect x="260" y="520" width="280" height="160" fill="#f8bbd0"/>`),
  "south park": tvArt("#29b6f6", `<rect y="700" width="800" height="300" fill="#66bb6a"/>
    <circle cx="280" cy="480" r="90" fill="#f1d0b0"/>
    <circle cx="520" cy="480" r="90" fill="#f1d0b0"/>
    <rect x="220" y="400" width="120" height="40" fill="#1565c0"/>
    <rect x="460" y="400" width="120" height="40" fill="#c62828"/>
    <circle cx="280" cy="360" r="40" fill="#fdd835"/>`),
  "family guy": tvArt("#81d4fa", `<circle cx="400" cy="420" r="120" fill="#f1d0b0"/>
    <ellipse cx="400" cy="520" rx="40" ry="50" fill="#f1d0b0"/>
    <rect x="280" y="560" width="240" height="220" fill="#c62828"/>
    <circle cx="360" cy="400" r="12" fill="#111"/>
    <circle cx="440" cy="400" r="12" fill="#111"/>`),
  "rick and morty": tvArt("#1a237e", `<circle cx="280" cy="400" r="90" fill="#eceff1"/>
    <circle cx="520" cy="520" r="70" fill="#f1d0b0"/>
    <rect x="200" y="480" width="160" height="200" fill="#f4efe4"/>
    <rect x="460" y="580" width="120" height="160" fill="#fdd835"/>
    <circle cx="400" cy="200" r="36" fill="#69f0ae"/>`),
  "the boys": tvArt("#1a0a0a", `<ellipse cx="400" cy="560" rx="160" ry="240" fill="#212121"/>
    <circle cx="400" cy="320" r="90" fill="#e2c09a"/>
    <path d="M260 240 Q400 160 540 240" fill="#c62828"/>
    <rect x="300" y="700" width="200" height="28" fill="#c62828"/>`),
  house: tvArt("#eceff1", `<rect x="160" y="200" width="480" height="600" fill="#f4efe4"/>
    <circle cx="400" cy="360" r="70" fill="#e2c09a"/>
    <rect x="260" y="480" width="280" height="220" fill="#c62828"/>
    <rect x="320" y="300" width="160" height="20" fill="#212121"/>
    <rect x="480" y="640" width="80" height="120" fill="#5d4037"/>`),
  er: tvArt("#b71c1c", `<rect x="120" y="240" width="560" height="520" fill="#eceff1"/>
    <rect x="200" y="320" width="400" height="80" fill="#c62828"/>
    <circle cx="400" cy="520" r="60" fill="#e2c09a"/>
    <rect x="280" y="600" width="240" height="80" fill="#90caf9"/>`),
  narcos: tvArt("#1b5e20", `<rect x="160" y="240" width="480" height="520" fill="#3e2723"/>
    <circle cx="400" cy="400" r="70" fill="#e2c09a"/>
    <rect x="260" y="520" width="280" height="160" fill="#f4efe4"/>
    <path d="M200 200 H600" stroke="#c9a227" stroke-width="12"/>`),
  "money heist": tvArt("#c62828", `<ellipse cx="400" cy="560" rx="160" ry="240" fill="#c62828"/>
    <ellipse cx="400" cy="340" rx="120" ry="130" fill="#c62828"/>
    <ellipse cx="360" cy="320" rx="16" ry="12" fill="#111"/>
    <ellipse cx="440" cy="320" rx="16" ry="12" fill="#111"/>
    <rect x="300" y="700" width="200" height="28" fill="#fdd835"/>`),
  "ted lasso": tvArt("#1b5e20", `<ellipse cx="400" cy="560" rx="220" ry="140" fill="#43a047"/>
    <circle cx="400" cy="360" r="70" fill="#f1d0b0"/>
    <rect x="280" y="280" width="240" height="24" fill="#fdd835"/>
    <circle cx="400" cy="560" r="36" fill="#f4efe4"/>`),
  "the last of us": tvArt("#3e2723", `<rect x="80" y="200" width="640" height="600" fill="#5d4037"/>
    <path d="M200 260 Q400 140 600 260 L560 760 H240 Z" fill="#33691e"/>
    <circle cx="320" cy="420" r="50" fill="#e2c09a"/>
    <circle cx="500" cy="460" r="40" fill="#f1d0b0"/>`),
  "brooklyn nine-nine": tvArt("#1565c0", `<rect x="160" y="200" width="480" height="600" fill="#eceff1"/>
    <circle cx="400" cy="400" r="70" fill="#e2c09a"/>
    <rect x="260" y="500" width="280" height="180" fill="#0d47a1"/>
    <rect x="300" y="240" width="200" height="40" fill="#c62828"/>`),
  "parks and recreation": tvArt("#66bb6a", `<rect x="160" y="240" width="480" height="520" fill="#e8f5e9"/>
    <circle cx="400" cy="400" r="70" fill="#e2c09a"/>
    <rect x="260" y="500" width="280" height="160" fill="#fdd835"/>
    <polygon points="400,180 430,250 370,250" fill="#2e7d32"/>`),
  "curb your enthusiasm": tvArt("#fff8e1", `<rect x="160" y="240" width="480" height="520" fill="#ffe0b2"/>
    <circle cx="400" cy="400" r="70" fill="#e2c09a"/>
    <path d="M280 320 H520" stroke="#111" stroke-width="8"/>
    <rect x="260" y="520" width="280" height="160" fill="#f4efe4"/>`),
};

const BRAND_COVERS: Record<string, string> = {
  nike: `<ellipse cx="400" cy="640" rx="260" ry="80" fill="#212121"/>
    <path d="M160 560 Q400 480 680 620 Q400 540 160 560" fill="#f4efe4"/>
    <rect x="200" y="700" width="400" height="40" fill="#212121"/>`,
  adidas: `<polygon points="400,200 520,700 280,700" fill="#f4efe4"/>
    <rect x="240" y="760" width="320" height="24" fill="#f4efe4"/>
    <rect x="260" y="800" width="280" height="18" fill="#f4efe4"/>
    <rect x="280" y="832" width="240" height="12" fill="#f4efe4"/>`,
  apple: `<rect x="260" y="280" width="280" height="480" rx="48" fill="#eceff1"/>
    <circle cx="400" cy="360" r="16" fill="#212121"/>
    <rect x="340" y="800" width="120" height="10" fill="#9e9e9e"/>`,
  google: `<circle cx="400" cy="480" r="160" fill="none" stroke="#4285f4" stroke-width="36"/>
    <path d="M400 480 H560" stroke="#4285f4" stroke-width="36"/>
    <circle cx="250" cy="480" r="28" fill="#ea4335"/>
    <circle cx="400" cy="320" r="28" fill="#fbbc05"/>
    <circle cx="550" cy="480" r="28" fill="#34a853"/>`,
  microsoft: `<rect x="180" y="220" width="200" height="200" fill="#f25022"/>
    <rect x="420" y="220" width="200" height="200" fill="#7fba00"/>
    <rect x="180" y="460" width="200" height="200" fill="#00a4ef"/>
    <rect x="420" y="460" width="200" height="200" fill="#ffb900"/>`,
  amazon: `<rect x="160" y="280" width="480" height="280" fill="#232f3e"/>
    <path d="M220 640 Q400 760 580 640" fill="none" stroke="#ff9900" stroke-width="18"/>
    <polygon points="580,640 540,620 560,680" fill="#ff9900"/>
    <rect x="240" y="360" width="320" height="40" fill="#f4efe4"/>`,
  "coca-cola": `<path d="M300 180 Q240 500 300 860 Q400 900 500 860 Q560 500 500 180 Q400 120 300 180" fill="#c4122f"/>
    <ellipse cx="400" cy="200" rx="70" ry="24" fill="#c4122f"/>
    <rect x="360" y="220" width="80" height="40" fill="#f4efe4"/>`,
  pepsi: `<circle cx="400" cy="460" r="200" fill="#f4efe4"/>
    <path d="M200 460 A200 200 0 0 1 600 460" fill="#c4122f"/>
    <path d="M200 460 A200 200 0 0 0 600 460" fill="#0c1c4a"/>
    <path d="M200 430 Q400 500 600 430" fill="#f4efe4"/>`,
  "mcdonald's": `<path d="M220 780 Q220 220 320 220 Q400 400 400 780" fill="none" stroke="#ffc107" stroke-width="70"/>
    <path d="M400 780 Q400 400 480 220 Q580 220 580 780" fill="none" stroke="#ffc107" stroke-width="70"/>`,
  starbucks: `<circle cx="400" cy="480" r="220" fill="#00704a"/>
    <ellipse cx="400" cy="500" rx="90" ry="120" fill="#d4e157"/>
    <path d="M310 420 Q400 360 490 420" fill="none" stroke="#00704a" stroke-width="12"/>
    <circle cx="400" cy="360" r="24" fill="#d4e157"/>`,
  toyota: `<ellipse cx="400" cy="480" rx="240" ry="140" fill="none" stroke="#eb0a1e" stroke-width="28"/>
    <ellipse cx="400" cy="480" rx="90" ry="140" fill="none" stroke="#eb0a1e" stroke-width="28"/>
    <line x1="160" y1="480" x2="640" y2="480" stroke="#eb0a1e" stroke-width="28"/>`,
  samsung: `<rect x="220" y="260" width="360" height="480" rx="40" fill="#1428a0"/>
    <rect x="250" y="300" width="300" height="360" fill="#90caf9"/>
    <circle cx="400" cy="700" r="16" fill="#eceff1"/>`,
  sony: `<rect x="140" y="360" width="520" height="220" rx="24" fill="#212121"/>
    <circle cx="280" cy="470" r="36" fill="#f4efe4"/>
    <rect x="360" y="440" width="240" height="60" fill="#f4efe4"/>`,
  nintendo: `<rect x="120" y="300" width="560" height="360" rx="80" fill="#e60012"/>
    <circle cx="240" cy="480" r="50" fill="#f4efe4"/>
    <rect x="420" y="430" width="180" height="100" rx="12" fill="#212121"/>`,
  lego: `<rect x="160" y="360" width="480" height="320" fill="#fdd835"/>
    <circle cx="280" cy="360" r="40" fill="#fdd835"/>
    <circle cx="400" cy="360" r="40" fill="#fdd835"/>
    <circle cx="520" cy="360" r="40" fill="#fdd835"/>
    <rect x="200" y="420" width="400" height="80" fill="#c62828"/>`,
  ikea: `<rect x="120" y="280" width="560" height="400" fill="#0c1c4a"/>
    <ellipse cx="400" cy="480" rx="200" ry="90" fill="#f9a825"/>
    <rect x="260" y="720" width="280" height="40" fill="#0c1c4a"/>`,
  netflix: `<rect x="280" y="160" width="90" height="680" fill="#e50914"/>
    <rect x="430" y="160" width="90" height="680" fill="#e50914"/>
    <polygon points="280,160 520,840 430,840 280,160" fill="#b20710"/>`,
  disney: `<path d="M160 560 Q400 180 640 560" fill="none" stroke="#f4efe4" stroke-width="28"/>
    <circle cx="280" cy="360" r="70" fill="none" stroke="#f4efe4" stroke-width="22"/>
    <circle cx="520" cy="360" r="70" fill="none" stroke="#f4efe4" stroke-width="22"/>
    <circle cx="400" cy="420" r="90" fill="none" stroke="#f4efe4" stroke-width="22"/>`,
  ferrari: `<path d="M140 640 Q280 420 400 560 Q520 420 660 640 L620 780 Q400 860 180 780 Z" fill="#ff2800"/>
    <circle cx="260" cy="760" r="50" fill="#212121"/>
    <circle cx="540" cy="760" r="50" fill="#212121"/>
    <polygon points="400,300 430,400 370,400" fill="#c9a227"/>`,
  rolex: `<circle cx="400" cy="460" r="200" fill="#0e2418" stroke="#c9a227" stroke-width="24"/>
    <circle cx="400" cy="460" r="12" fill="#c9a227"/>
    <line x1="400" y1="460" x2="400" y2="320" stroke="#c9a227" stroke-width="10"/>
    <line x1="400" y1="460" x2="500" y2="500" stroke="#c9a227" stroke-width="8"/>`,
  gucci: `<rect x="200" y="240" width="400" height="480" fill="#0e1a10"/>
    <circle cx="340" cy="480" r="70" fill="none" stroke="#c9a227" stroke-width="18"/>
    <circle cx="460" cy="480" r="70" fill="none" stroke="#c9a227" stroke-width="18"/>`,
  "louis vuitton": `<rect x="160" y="200" width="480" height="600" fill="#5d4037"/>
    <circle cx="300" cy="360" r="24" fill="#c9a227"/>
    <circle cx="500" cy="360" r="24" fill="#c9a227"/>
    <circle cx="400" cy="520" r="24" fill="#c9a227"/>
    <circle cx="300" cy="680" r="24" fill="#c9a227"/>
    <circle cx="500" cy="680" r="24" fill="#c9a227"/>`,
  tesla: `<rect x="160" y="480" width="480" height="160" rx="40" fill="#eceff1"/>
    <circle cx="260" cy="660" r="50" fill="#212121"/>
    <circle cx="540" cy="660" r="50" fill="#212121"/>
    <path d="M240 480 Q400 300 560 480" fill="#cc0000"/>
    <rect x="360" y="500" width="80" height="40" fill="#90caf9"/>`,
  bmw: `<circle cx="400" cy="460" r="200" fill="#f4efe4" stroke="#212121" stroke-width="18"/>
    <path d="M400 260 A200 200 0 0 1 400 660" fill="#1565c0"/>
    <path d="M400 260 A200 200 0 0 0 400 660" fill="#f4efe4"/>
    <path d="M200 460 A200 200 0 0 1 600 460" fill="#1565c0" opacity="0.9"/>`,
  "mercedes-benz": `<circle cx="400" cy="460" r="200" fill="#212121" stroke="#cfd8dc" stroke-width="16"/>
    <path d="M400 280 L470 620 L400 560 L330 620 Z" fill="#eceff1"/>
    <path d="M400 280 L240 500 L400 460 L560 500 Z" fill="#b0bec5"/>`,
  volkswagen: `<circle cx="400" cy="460" r="200" fill="#1565c0"/>
    <path d="M300 560 L400 280 L500 560" fill="none" stroke="#f4efe4" stroke-width="28"/>
    <path d="M280 480 H520" stroke="#f4efe4" stroke-width="28"/>
    <circle cx="400" cy="460" r="200" fill="none" stroke="#f4efe4" stroke-width="18"/>`,
  intel: `<rect x="160" y="320" width="480" height="280" fill="#0071c5"/>
    <circle cx="260" cy="460" r="50" fill="#f4efe4"/>
    <rect x="340" y="410" width="240" height="100" fill="#f4efe4"/>`,
  nvidia: `<polygon points="400,220 640,460 400,700 160,460" fill="#76b900"/>
    <polygon points="400,300 560,460 400,620 240,460" fill="#212121"/>`,
  spotify: `<circle cx="400" cy="460" r="220" fill="#1db954"/>
    <path d="M260 400 Q400 340 540 400" fill="none" stroke="#f4efe4" stroke-width="22"/>
    <path d="M280 480 Q400 430 520 480" fill="none" stroke="#f4efe4" stroke-width="18"/>
    <path d="M300 560 Q400 520 500 560" fill="none" stroke="#f4efe4" stroke-width="14"/>`,
  youtube: `<rect x="160" y="300" width="480" height="320" rx="80" fill="#ff0000"/>
    <polygon points="360,380 500,460 360,540" fill="#f4efe4"/>`,
  instagram: `<rect x="180" y="220" width="440" height="440" rx="100" fill="url(#ig)"/>
    <defs><linearGradient id="ig" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#f9ce34"/><stop offset="0.5" stop-color="#ee2a7b"/><stop offset="1" stop-color="#6228d7"/></linearGradient></defs>
    <circle cx="400" cy="440" r="110" fill="none" stroke="#f4efe4" stroke-width="28"/>
    <circle cx="520" cy="320" r="18" fill="#f4efe4"/>`,
  twitter: `<path d="M180 320 Q360 280 420 420 Q560 360 640 280 Q560 480 420 520 Q360 700 200 680 Q320 560 300 480 Q200 500 180 320 Z" fill="#1d9bf0"/>`,
  visa: `<rect x="120" y="300" width="560" height="360" rx="28" fill="#1a1f71"/>
    <rect x="160" y="360" width="200" height="80" fill="#f9a825"/>
    <rect x="400" y="520" width="220" height="40" fill="#f4efe4"/>`,
  mastercard: `<circle cx="330" cy="480" r="140" fill="#eb001b"/>
    <circle cx="470" cy="480" r="140" fill="#f79e1b"/>
    <path d="M400 360 A140 140 0 0 1 400 600 A140 140 0 0 1 400 360" fill="#ff5f00"/>`,
  paypal: `<ellipse cx="360" cy="480" rx="140" ry="180" fill="#003087"/>
    <ellipse cx="440" cy="440" rx="140" ry="180" fill="#009cde" opacity="0.9"/>
    <rect x="300" y="700" width="200" height="28" fill="#003087"/>`,
  uber: `<rect x="140" y="280" width="520" height="400" fill="#111"/>
    <rect x="220" y="420" width="360" height="80" fill="#f4efe4"/>
    <circle cx="400" cy="360" r="36" fill="#f4efe4"/>`,
  airbnb: `<path d="M400 240 C520 360 620 480 400 760 C180 480 280 360 400 240 Z" fill="#ff5a5f"/>
    <circle cx="400" cy="460" r="70" fill="#fff5f5"/>`,
  chanel: `<circle cx="340" cy="460" r="120" fill="none" stroke="#f4efe4" stroke-width="22"/>
    <circle cx="460" cy="460" r="120" fill="none" stroke="#f4efe4" stroke-width="22"/>
    <rect x="300" y="720" width="200" height="16" fill="#f4efe4"/>`,
  "hermès": `<rect x="160" y="240" width="480" height="480" fill="#e56020"/>
    <rect x="220" y="300" width="360" height="360" fill="none" stroke="#f4efe4" stroke-width="12"/>
    <rect x="300" y="720" width="200" height="40" fill="#4a1c00"/>`,
};

function keyOf(name: string) {
  return name.trim().toLowerCase();
}

function heroSvg(name: string, categorySlug: string) {
  const table = categorySlug.includes("dc") ? DC : MARVEL;
  const entry = table[keyOf(name)];
  if (entry) {
    return heroCard(name, entry.look, entry.p);
  }
  return heroCard(name, "super", {
    bg: "#1a1a24",
    suit: "#37474f",
    accent: "#90caf9",
    cape: "#546e7a",
  });
}

function coverSvg(name: string, table: Record<string, string>, bg: string) {
  const art = table[keyOf(name)];
  if (art) {
    return svgWrap(name, `${art.startsWith("<rect width=\"800\"") ? "" : `<rect width="800" height="1000" fill="${bg}"/>`}${art}${caption(name)}`);
  }
  return cover(
    name,
    bg,
    `<ellipse cx="400" cy="480" rx="220" ry="280" fill="#f4efe4" opacity="0.12"/>
     <circle cx="400" cy="420" r="90" fill="#f4efe4" opacity="0.2"/>`,
  );
}

export function illustratedSvg(name: string, categorySlug: string) {
  if (categorySlug === "marvel-heroes" || categorySlug === "dc-heroes") {
    return heroSvg(name, categorySlug);
  }
  if (categorySlug === "video-games") {
    const art = COVERS[keyOf(name)];
    if (art) {
      return svgWrap(name, `<rect width="800" height="1000" fill="#101018"/>${art}${caption(name)}`);
    }
    return coverSvg(name, COVERS, "#101018");
  }
  if (categorySlug === "movies") {
    const art = MOVIE_COVERS[keyOf(name)];
    if (art) {
      return svgWrap(name, `<rect width="800" height="1000" fill="#140c14"/>${art}${caption(name)}`);
    }
    return coverSvg(name, MOVIE_COVERS, "#140c14");
  }
  if (categorySlug === "top-tv-shows") {
    const art = TV_COVERS[keyOf(name)];
    if (art) {
      return svgWrap(name, `${art}${caption(name)}`);
    }
    return coverSvg(name, TV_COVERS, "#1a1030");
  }
  if (categorySlug === "brands") {
    const art = BRAND_COVERS[keyOf(name)];
    if (art) {
      return svgWrap(name, `<rect width="800" height="1000" fill="#111111"/>${art}${caption(name)}`);
    }
    return coverSvg(name, BRAND_COVERS, "#111111");
  }
  return cover(name, "#1a1a24", `<circle cx="400" cy="460" r="160" fill="#f4efe4" opacity="0.2"/>`);
}

export function illustratedArt(name: string, categorySlug: string): CatalogImage {
  const slug = slugify(name);
  return {
    image_url: `/catalog-art/${categorySlug}/${slug}.svg`,
    image_source: "Category Game original artwork",
    image_credit: "Category Game",
    image_license: "Original game asset created for this project",
    image_kind: "original",
    image_status: "needs_review",
    image_focus_x: 0.5,
    image_focus_y: 0.42,
  };
}

export function illustratedSvgIsDrawn(svg: string) {
  if (/<(path|circle|ellipse|polygon|line)[\s>]/i.test(svg)) {
    return true;
  }
  const rects = svg.match(/<rect[\s>]/gi) ?? [];
  return rects.length >= 4;
}
