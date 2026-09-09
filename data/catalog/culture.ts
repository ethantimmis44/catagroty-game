import { hasLicensedPhoto, licensedPhotoFor } from "@/data/catalog/licensedPhotos";
import { type CatalogItem } from "@/data/catalog/types";

function hero(name: string, category: "marvel-heroes" | "dc-heroes"): CatalogItem {
  return {
    name,
    categories: [category],
    image: licensedPhotoFor(name),
    metadata: { publisher: category === "dc-heroes" ? "DC" : "Marvel" },
  };
}

function withLicensedPhoto(item: CatalogItem): CatalogItem | null {
  if (!hasLicensedPhoto(item.name)) {
    return null;
  }
  return { ...item, image: licensedPhotoFor(item.name) };
}

const MARVEL_NAMES = [
  "Spider-Man",
  "Iron Man",
  "Captain America",
  "Black Panther",
  "Thor",
  "Hulk",
  "Black Widow",
  "Doctor Strange",
  "Scarlet Witch",
  "Captain Marvel",
  "Wolverine",
  "Storm",
  "Deadpool",
  "Ant-Man",
  "Wasp",
  "Hawkeye",
  "Falcon",
  "Nick Fury",
  "Loki",
  "Groot",
  "Star-Lord",
  "Gamora",
  "Ms. Marvel",
  "Shang-Chi",
  "Daredevil",
  "Moon Knight",
  "She-Hulk",
  "Vision",
  "Winter Soldier",
  "War Machine",
  "Rocket",
  "Drax",
  "Nebula",
  "Mantis",
  "Miles Morales",
  "Spider-Gwen",
  "Professor X",
  "Magneto",
  "Jean Grey",
  "Cyclops",
  "Blade",
  "Ghost Rider",
  "Silver Surfer",
  "Punisher",
];

export const MARVEL_ITEMS: CatalogItem[] = MARVEL_NAMES.map((name) =>
  hero(name, "marvel-heroes"),
).flatMap((item) => {
  const next = withLicensedPhoto(item);
  return next ? [next] : [];
});

const DC_NAMES = [
  "Superman",
  "Batman",
  "Wonder Woman",
  "The Flash",
  "Aquaman",
  "Green Lantern",
  "Cyborg",
  "Martian Manhunter",
  "Supergirl",
  "Batgirl",
  "Nightwing",
  "Robin",
  "Harley Quinn",
  "Catwoman",
  "Joker",
  "Lex Luthor",
  "Green Arrow",
  "Shazam",
  "Black Canary",
  "Zatanna",
  "Hawkman",
  "Hawkgirl",
  "Raven",
  "Starfire",
  "Beast Boy",
  "Poison Ivy",
  "Blue Beetle",
  "Constantine",
  "Swamp Thing",
  "Black Adam",
  "Deathstroke",
  "Red Hood",
  "Batwoman",
  "Static Shock",
  "Plastic Man",
];

export const DC_ITEMS: CatalogItem[] = DC_NAMES.map((name) => hero(name, "dc-heroes")).flatMap(
  (item) => {
    const next = withLicensedPhoto(item);
    return next ? [next] : [];
  },
);

function movie(name: string, year: number): CatalogItem {
  return {
    name,
    categories: ["movies"],
    image: licensedPhotoFor(name),
    metadata: { year },
  };
}

const MOVIE_ENTRIES: { name: string; year: number }[] = [
  { name: "Metropolis", year: 1927 },
  { name: "Nosferatu", year: 1922 },
  { name: "The Kid", year: 1921 },
  { name: "Steamboat Bill Jr.", year: 1928 },
  { name: "The General", year: 1926 },
  { name: "The Gold Rush", year: 1925 },
  { name: "The Cabinet of Dr. Caligari", year: 1920 },
  { name: "Battleship Potemkin", year: 1925 },
  { name: "Safety Last!", year: 1923 },
];

export const MOVIE_ITEMS: CatalogItem[] = MOVIE_ENTRIES.map((entry) =>
  movie(entry.name, entry.year),
).flatMap((item) => {
  const next = withLicensedPhoto(item);
  return next ? [next] : [];
});

function game(name: string, year: number): CatalogItem {
  return {
    name,
    categories: ["video-games"],
    image: licensedPhotoFor(name),
    metadata: { year },
  };
}

const VIDEO_GAME_ENTRIES: { name: string; year: number }[] = [
  { name: "Super Mario Bros.", year: 1985 },
  { name: "The Legend of Zelda", year: 1986 },
  { name: "Tetris", year: 1984 },
  { name: "Pac-Man", year: 1980 },
  { name: "Sonic the Hedgehog", year: 1991 },
  { name: "Street Fighter II", year: 1991 },
  { name: "Donkey Kong", year: 1981 },
  { name: "Minecraft", year: 2011 },
  { name: "The Sims", year: 2000 },
  { name: "Grand Theft Auto III", year: 2001 },
  { name: "Halo: Combat Evolved", year: 2001 },
  { name: "The Elder Scrolls V: Skyrim", year: 2011 },
  { name: "Portal", year: 2007 },
  { name: "Half-Life 2", year: 2004 },
  { name: "Final Fantasy VII", year: 1997 },
  { name: "Pokémon Red and Blue", year: 1996 },
  { name: "Animal Crossing", year: 2001 },
  { name: "The Last of Us", year: 2013 },
  { name: "God of War", year: 2018 },
  { name: "Red Dead Redemption 2", year: 2018 },
  { name: "Fortnite", year: 2017 },
  { name: "Among Us", year: 2018 },
  { name: "Stardew Valley", year: 2016 },
  { name: "Celeste", year: 2018 },
  { name: "Super Mario 64", year: 1996 },
  { name: "The Legend of Zelda: Breath of the Wild", year: 2017 },
  { name: "Grand Theft Auto V", year: 2013 },
  { name: "Call of Duty 4: Modern Warfare", year: 2007 },
  { name: "World of Warcraft", year: 2004 },
  { name: "League of Legends", year: 2009 },
  { name: "Counter-Strike", year: 2000 },
  { name: "FIFA 98", year: 1997 },
  { name: "Wii Sports", year: 2006 },
  { name: "Candy Crush Saga", year: 2012 },
  { name: "Roblox", year: 2006 },
  { name: "Overwatch", year: 2016 },
  { name: "Elden Ring", year: 2022 },
  { name: "Baldur's Gate 3", year: 2023 },
  { name: "The Witcher 3: Wild Hunt", year: 2015 },
  { name: "Super Smash Bros. Melee", year: 2001 },
  { name: "Mario Kart", year: 1992 },
  { name: "Rocket League", year: 2015 },
  { name: "Call of Duty", year: 2003 },
  { name: "EA Sports FC", year: 2023 },
  { name: "Pokémon", year: 1996 },
];

export const VIDEO_GAME_ITEMS: CatalogItem[] = VIDEO_GAME_ENTRIES.map((entry) =>
  game(entry.name, entry.year),
).flatMap((item) => {
  const next = withLicensedPhoto(item);
  return next ? [next] : [];
});
