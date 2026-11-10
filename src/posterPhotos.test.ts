import { describe, expect, it } from "vitest";
import { posterImageForName, posterAlbumNames } from "./posterPhotos";

describe("9 FLOOR COFFEE poster album", () => {
  it("has distinct poster images for named drinks", () => {
    expect(posterAlbumNames.length).toBeGreaterThanOrEqual(60);
    for (const name of [
      "Iced Sea Salt Latte",
      "Dalgona Honey Latte",
      "Vanilla Oreo Milk",
      "Strawberry Cream Milk",
      "Mixed Berry Cream Milk",
      "Chocolate Oreo Cream",
      "Taro Oreo Milk",
    ]) {
      expect(posterImageForName(name), name).toMatch(
        /^data:image\/jpeg;base64,/,
      );
    }
  });
  it("does not assign an unrelated photo to an unknown drink", () => {
    expect(posterImageForName("Nonexistent Unrelated Beverage")).toBeNull();
  });
});

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import sharp from "sharp";
import posterCatalog from "./posterCatalog.json";
import { posterPage1 } from "./posterPage1";
import { posterPage2 } from "./posterPage2";
import { posterPage3 } from "./posterPage3";
import { posterPage4 } from "./posterPage4";
import { CatalogSchema } from "./model";
import { posterGroupForName } from "./posterPhotos";
const seed = CatalogSchema.parse(
  JSON.parse(readFileSync("public/recipes.json", "utf8")),
);
it("all 87 embedded crops match the supplied album bytes and decode as JPEG", async () => {
  const pages: Record<string, string> = {
    ...posterPage1,
    ...posterPage2,
    ...posterPage3,
    ...posterPage4,
  };
  expect(posterCatalog).toHaveLength(87);
  for (const row of posterCatalog) {
    const bytes = Buffer.from(
      pages[row.imagePath.split("/").pop()!].split(",")[1],
      "base64",
    );
    expect(
      createHash("sha256").update(bytes).digest("hex"),
      row.imagePath,
    ).toBe(row.sha256);
    expect((await sharp(bytes).metadata()).format).toBe("jpeg");
  }
  for (const r of seed.recipes.filter((r) => r.id.startsWith("9f-poster-"))) {
    expect(posterImageForName(r.englishName), r.englishName).not.toBeNull();
    expect(posterGroupForName(r.englishName), r.englishName).not.toBeNull();
  }
  const album = seed.recipes.filter((r) => posterImageForName(r.englishName));
  expect(album).toHaveLength(59);
  const normalize = (name: string) =>
    name.toLowerCase().replace(/^(iced |hot )/, "");
  for (const row of posterCatalog.filter((r) => r.category !== "Toppings")) {
    expect(
      album.some((r) => normalize(r.englishName) === normalize(row.name)),
      row.name,
    ).toBe(true);
  }
  expect(posterGroupForName("Iced Vanilla Latte")).toBe("album-signature");
  expect(posterImageForName("Hot Espresso")).toBe(
    posterImageForName("Espresso"),
  );
  for (const name of [
    "Vanilla Oreo Milk",
    "Strawberry Cream Milk",
    "Mixed Berry Cream Milk",
    "Chocolate Oreo Cream",
    "Taro Oreo Milk",
  ])
    expect(posterGroupForName(name), name).toBe("album-cream");
});
const stable = (value: any): string =>
  Array.isArray(value)
    ? "[" + value.map(stable).join(",") + "]"
    : value && typeof value === "object"
      ? "{" +
        Object.keys(value)
          .sort()
          .map((k) => JSON.stringify(k) + ":" + stable(value[k]))
          .join(",") +
        "}"
      : JSON.stringify(value);
it("preserves all 283 recipes from before the album expansion byte for byte as records", () => {
  const hashes = JSON.parse(
    readFileSync("tests/fixtures/before-poster-283-sha256.json", "utf8"),
  );
  expect(Object.keys(hashes)).toHaveLength(283);
  for (const [id, hash] of Object.entries(hashes)) {
    const recipe = seed.recipes.find((r) => r.id === id);
    expect(recipe, id).toBeDefined();
    expect(createHash("sha256").update(stable(recipe)).digest("hex"), id).toBe(
      hash,
    );
  }
});
