import type { CatalogCategory } from "@/data/catalog/types";

/**
 * Categories offered when a host creates a game. Seeded into public.categories
 * by `npm run seed:catalog` and read back from the database.
 */
export const GAME_CATEGORIES: CatalogCategory[] = [
  { name: "Animals", slug: "animals", emoji: "🦁", sort_order: 1 },

  { name: "Football Players - Male", slug: "football-players-male", emoji: "⚽", sort_order: 2 },
  { name: "Football Players - Female", slug: "football-players-female", emoji: "⚽", sort_order: 3 },

  { name: "Basketball Players - Male", slug: "basketball-players-male", emoji: "🏀", sort_order: 4 },
  { name: "Basketball Players - Female", slug: "basketball-players-female", emoji: "🏀", sort_order: 5 },

  { name: "American Football Players", slug: "american-football-players-male", emoji: "🏈", sort_order: 6 },

  { name: "General Athletes - Male", slug: "general-athletes-male", emoji: "🏅", sort_order: 7 },
  { name: "General Athletes - Female", slug: "general-athletes-female", emoji: "🏅", sort_order: 8 },

  { name: "Tennis Players - Male", slug: "tennis-players-male", emoji: "🎾", sort_order: 9 },
  { name: "Tennis Players - Female", slug: "tennis-players-female", emoji: "🎾", sort_order: 10 },

  { name: "Golfers - Male", slug: "golfers-male", emoji: "⛳", sort_order: 11 },
  { name: "Rugby Players - Male", slug: "rugby-players-male", emoji: "🏉", sort_order: 12 },
  { name: "Hockey Players - Male", slug: "hockey-players-male", emoji: "🏒", sort_order: 13 },

  { name: "Marvel Heroes", slug: "marvel-heroes", emoji: "🦸", sort_order: 14 },
  { name: "DC Heroes", slug: "dc-heroes", emoji: "🦇", sort_order: 15 },

  { name: "Celebrities", slug: "celebrities", emoji: "🌟", sort_order: 16 },
  { name: "Singers", slug: "singers", emoji: "🎵", sort_order: 17 },

  { name: "Actors - Male", slug: "actors-male", emoji: "🎭", sort_order: 18 },
  { name: "Actors - Female", slug: "actors-female", emoji: "🎭", sort_order: 19 },

  { name: "Cities", slug: "cities", emoji: "🏙️", sort_order: 20 },
  { name: "Countries", slug: "countries", emoji: "🌍", sort_order: 21 },
  { name: "Sports", slug: "sports", emoji: "🏆", sort_order: 22 },
  { name: "Movies", slug: "movies", emoji: "🎬", sort_order: 23 },
  { name: "Top TV Shows", slug: "top-tv-shows", emoji: "📺", sort_order: 24 },
  { name: "Cars", slug: "cars", emoji: "🚗", sort_order: 25 },
  { name: "Food", slug: "food", emoji: "🍕", sort_order: 26 },
  { name: "Brands", slug: "brands", emoji: "🏷️", sort_order: 27 },
  { name: "Video Games", slug: "video-games", emoji: "🎮", sort_order: 28 },
];
