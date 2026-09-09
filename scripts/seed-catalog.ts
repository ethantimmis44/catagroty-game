import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  const { seedCatalog } = await import("../lib/catalogSeed");
  await seedCatalog();
  console.log("Catalogue seed complete. Existing items were left in place.");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
