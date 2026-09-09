import { loadEnvConfig } from "@next/env";
import { writeCatalogArtFiles } from "../lib/writeCatalogArt";

loadEnvConfig(process.cwd());

const written = writeCatalogArtFiles();
console.log(`Wrote ${written} original catalogue illustrations to public/catalog-art.`);
