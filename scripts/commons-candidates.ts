import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const USER_AGENT = "CategoryGame/1.0 (commons visual search; local development)";

const QUERIES = [
  "Cyclops X-Men cosplay",
  "Daredevil Marvel cosplay",
  "Drax Guardians cosplay",
  "Falcon Marvel cosplay",
  "Storm X-Men cosplay",
  "Loki Marvel cosplay",
  "Groot cosplay",
  "Superman statue",
  "Batman cosplay",
  "Wonder Woman cosplay",
  "Flash DC cosplay",
  "Joker cosplay",
  "Harley Quinn cosplay",
  "Aquaman cosplay",
  "Green Lantern cosplay",
  "Cyborg DC cosplay",
  "Catwoman cosplay",
  "Robin DC cosplay",
  "Among Us plush",
  "Minecraft creeper",
  "Animal Crossing",
  "Call of Duty game",
  "Candy Crush",
  "Grand Theft Auto V",
  "Fortnite",
  "Pac-Man arcade",
  "Super Mario",
  "Tetris Game Boy",
  "Halo game",
  "Pokémon",
  "The Legend of Zelda",
  "Nike sneaker",
  "Coca-Cola glass bottle",
  "Apple iPhone",
  "Starbucks cup",
  "McDonald's restaurant",
  "Friends TV fountain",
  "Star Wars",
  "The Godfather",
];

async function search(query: string) {
  const params = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrsearch: query,
    gsrnamespace: "6",
    gsrlimit: "4",
    prop: "imageinfo",
    iiprop: "url|mime",
    format: "json",
    formatversion: "2",
  });
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, {
      headers: { "User-Agent": USER_AGENT },
    });
    if (response.status === 429) {
      await new Promise((resolve) => setTimeout(resolve, 4000 * (attempt + 1)));
      continue;
    }
    if (!response.ok) {
      return [`HTTP ${response.status}`];
    }
    const payload = (await response.json()) as {
      query?: { pages?: { title?: string }[] };
    };
    return (payload.query?.pages ?? []).map((page) => page.title ?? "");
  }
  return ["HTTP 429"];
}

async function main() {
  for (const query of QUERIES) {
    const rows = await search(query);
    console.log(`\n## ${query}`);
    for (const row of rows) {
      console.log(`  ${row}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 1200));
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
