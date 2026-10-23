import { it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import sharp from "sharp";
import photos from "../src/photos/catalog.json";
import { referencePhoto } from "../src/RecipePhoto";
import { CatalogSchema } from "../src/model";
const seed = CatalogSchema.parse(
  JSON.parse(readFileSync("public/recipes.json", "utf8")),
);
it("every existing recipe has a reviewed photo mapping and owner-uploaded images take precedence", () => {
  expect(Object.keys(photos.recipes).sort()).toEqual(
    seed.recipes.map((r) => r.id).sort(),
  );
  for (const r of seed.recipes) expect(referencePhoto(r), r.id).not.toBeNull();
  for (const r of seed.recipes.filter((r) => /Matcha/.test(r.englishName))) {
    const mapping = photos.recipes[r.id as keyof typeof photos.recipes];
    expect(mapping.photo, r.id).toBe(/^Hot/.test(r.englishName) ? "hot-matcha" : "iced-matcha");
  }
  expect(
    referencePhoto({
      ...seed.recipes[0],
      image: "https://example.com/owner-photo.webp",
    }),
  ).toBeNull();
  for (const p of Object.values(photos.photos)) {
    expect(p.author).toBeTruthy();
    expect(new URL(p.sourceUrl).hostname).toBe("commons.wikimedia.org");
    expect(p.license).toMatch(
      /^(CC BY(?:-SA)? [234]\.\d|CC0 1\.0|Public domain)$/,
    );
    expect(p.licenseUrl).toMatch(/^https:\/\//);
  }
});
it("all photo variants are genuine decodable WebP assets with matching integrity and bounded sizes", async () => {
  for (const p of Object.values(photos.photos))
    for (const variant of [p.small, p.large]) {
      const bytes = readFileSync("public/" + variant.file);
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(
        variant.sha256,
      );
      expect(variant.file).toContain(variant.sha256.slice(0, 12));
      const decoded = await sharp(bytes).metadata();
      expect(decoded.format).toBe("webp");
      expect(decoded.width).toBe(variant.width);
      expect(decoded.height).toBe(variant.height);
      expect(Math.max(decoded.width!, decoded.height!)).toBeLessThanOrEqual(
        800,
      );
      expect(bytes.length).toBeLessThan(220_000);
    }
});
