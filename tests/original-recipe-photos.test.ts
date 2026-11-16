import { it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import sharp from "sharp";
import photos from "../src/recipePhotos.json";
import review from "../docs/original-picture-review.json";
import { generatedPhotoFor } from "../src/RecipePhoto";
import { CatalogSchema } from "../src/model";

const catalog = CatalogSchema.parse(JSON.parse(readFileSync("public/recipes.json", "utf8")));
it("binds each reviewed original recipe to its own verified image and preserves owner uploads", async () => {
  const rows = Object.values(photos);
  expect(new Set(rows.map(p => p.file)).size).toBe(rows.length);
  expect(new Set(rows.map(p => p.sha256)).size).toBe(rows.length);
  expect(review.rows.map(r => r.key).sort()).toEqual(Object.keys(photos).sort());
  for (const p of rows) {
    const recipe = catalog.recipes.find(r => r.id === p.key)!;
    expect(recipe).toBeTruthy();
    const record = review.rows.find(r => r.key === p.key)!;
    expect(record.recipeName).toBe(recipe.englishName);
    expect(record.ingredientsSha256).toBe(p.ingredientsSha256);
    const bytes = readFileSync("public/" + p.file);
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(p.sha256);
    const decoded = await sharp(bytes).metadata();
    expect(decoded.format).toBe("webp");
    expect(decoded.width).toBe(p.width);
    expect(decoded.height).toBe(p.height);
    expect(generatedPhotoFor(recipe)?.file).toBe(p.file);
    expect(generatedPhotoFor({ ...recipe, image: "https://example.com/owner.webp" })).toBeNull();
  }
});
