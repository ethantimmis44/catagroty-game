import type { CatalogImage } from "@/data/catalog/types";

function filenameFromImage(image: CatalogImage) {
  const fromSource = image.image_source.match(/File:([^?#]+)/i);
  if (fromSource?.[1]) {
    return decodeURIComponent(fromSource[1]).replace(/ /g, "_");
  }
  const fromUrl = image.image_url.match(/FilePath\/([^?#]+)/i);
  if (fromUrl?.[1]) {
    return decodeURIComponent(fromUrl[1]).replace(/ /g, "_");
  }
  return null;
}

export async function missingCommonsFiles(images: CatalogImage[]) {
  const missing = new Set<string>();
  const files = [
    ...new Set(
      images
        .map(filenameFromImage)
        .filter((file): file is string => Boolean(file)),
    ),
  ];

  for (let index = 0; index < files.length; index += 40) {
    const chunk = files.slice(index, index + 40);
    const titles = chunk.map((file) => `File:${file.replace(/_/g, " ")}`).join("|");
    const params = new URLSearchParams({
      action: "query",
      titles,
      prop: "imageinfo",
      format: "json",
      formatversion: "2",
    });
    const api = `https://commons.wikimedia.org/w/api.php?${params.toString()}`;

    try {
      const response = await fetch(api, {
        headers: { "User-Agent": "CategoryGame/1.0 (catalog seed; local development)" },
      });
      if (!response.ok) {
        continue;
      }
      const payload = (await response.json()) as {
        query?: { pages?: { missing?: boolean; title?: string; imageinfo?: unknown[] }[] };
      };
      for (const page of payload.query?.pages ?? []) {
        const title = (page.title ?? "").replace(/^File:/i, "").replace(/ /g, "_");
        if (page.missing || !page.imageinfo?.length) {
          missing.add(title);
        }
      }
    } catch {
      // Network failure: do not treat existing URLs as missing.
    }
  }

  return missing;
}

export function isMissingCommonsImage(
  image: CatalogImage | null | undefined,
  missingFiles: Set<string>,
) {
  if (!image) {
    return false;
  }
  const filename = filenameFromImage(image);
  return Boolean(filename && missingFiles.has(filename));
}
