import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";

loadEnvConfig(process.cwd());

/**
 * Download freely licensed catalogue photos into the public item-images
 * bucket so the game does not depend on Wikimedia URLs staying live.
 * Original SVG artwork is already self-contained and is left as-is.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY) in the
 * environment. Does not write .env.local.
 */

const USER_AGENT = "CategoryGame/1.0 (catalogue image cache; local development)";
const BUCKET = "item-images";

type Row = {
  id: string;
  name: string;
  slug: string | null;
  image_url: string | null;
  image_path: string | null;
  image_kind: string | null;
  image_source: string | null;
};

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SECRET_KEY ??
    process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    throw new Error(
      "Set SUPABASE_SERVICE_ROLE_KEY to cache images into Storage. The publishable key cannot create objects.",
    );
  }
  return createClient(url, key);
}

function extensionFor(contentType: string, url: string) {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("gif")) return "gif";
  if (contentType.includes("svg")) return "svg";
  if (url.toLowerCase().includes(".png")) return "png";
  return "jpg";
}

async function main() {
  const supabase = adminClient();
  const { data, error } = await supabase
    .from("items")
    .select("id, name, slug, image_url, image_path, image_kind, image_source")
    .eq("is_active", true);

  if (error) {
    throw new Error(error.message);
  }

  const rows = ((data ?? []) as Row[]).filter((row) => {
    if (row.image_path) return false;
    const url = row.image_url ?? "";
    if (!url || url.startsWith("data:")) return false;
    return row.image_kind !== "original";
  });

  console.log(`Caching ${rows.length} external photos into ${BUCKET}...`);

  let stored = 0;
  const failed: string[] = [];

  for (const row of rows) {
    try {
      const response = await fetch(row.image_url as string, {
        headers: { "User-Agent": USER_AGENT },
      });
      if (!response.ok) {
        failed.push(`${row.name} (${response.status})`);
        continue;
      }
      const contentType = response.headers.get("content-type") ?? "image/jpeg";
      if (!contentType.startsWith("image/")) {
        failed.push(`${row.name} (not an image)`);
        continue;
      }
      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.length < 64) {
        failed.push(`${row.name} (empty file)`);
        continue;
      }
      const ext = extensionFor(contentType, row.image_url as string);
      const slug = (row.slug || row.name).replace(/[^a-z0-9-]+/gi, "-").toLowerCase();
      const path = `${slug}-${row.id.slice(0, 8)}.${ext}`;

      const uploaded = await supabase.storage.from(BUCKET).upload(path, bytes, {
        contentType: contentType.split(";")[0],
        upsert: true,
      });
      if (uploaded.error) {
        failed.push(`${row.name} (${uploaded.error.message})`);
        continue;
      }

      const { error: updateError } = await supabase
        .from("items")
        .update({ image_path: path })
        .eq("id", row.id);
      if (updateError) {
        failed.push(`${row.name} (${updateError.message})`);
        continue;
      }
      stored += 1;
    } catch (err) {
      failed.push(`${row.name} (${err instanceof Error ? err.message : "fetch failed"})`);
    }
  }

  console.log(`Stored ${stored} images in ${BUCKET}.`);
  if (failed.length > 0) {
    console.log(`${failed.length} could not be cached and keep their source URL:`);
    for (const entry of failed.slice(0, 40)) {
      console.log(`  ${entry}`);
    }
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
