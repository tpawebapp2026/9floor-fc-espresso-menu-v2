import { it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { CatalogSchema, searchRecipes } from "../src/model";
import { assemblyFor } from "../src/assembly";
import { videoPhotoFor } from "../src/RecipePhoto";
import images from "../src/videoSeriesPhotos.json";
const catalog = CatalogSchema.parse(
  JSON.parse(readFileSync("public/recipes.json", "utf8")),
);
const added = catalog.recipes.filter((r) => r.id.startsWith("video-series-"));
const stable = (v: any): string =>
  Array.isArray(v)
    ? "[" + v.map(stable).join(",") + "]"
    : v && typeof v === "object"
      ? "{" +
        Object.keys(v)
          .sort()
          .map((k) => JSON.stringify(k) + ":" + stable(v[k]))
          .join(",") +
        "}"
      : JSON.stringify(v);
it("preserves every one of the previous 346 records and covers every uploaded series part", () => {
  const before = JSON.parse(
    readFileSync("tests/fixtures/before-video-series-346-sha256.json", "utf8"),
  );
  expect(Object.keys(before)).toHaveLength(346);
  for (const [id, hash] of Object.entries(before)) {
    const r = catalog.recipes.find((r) => r.id === id);
    expect(r, id).toBeTruthy();
    expect(createHash("sha256").update(stable(r)).digest("hex"), id).toBe(hash);
  }
  expect(added).toHaveLength(75);
  for (const [group, parts, count] of [
    ["coffee", 21, 22],
    ["berry", 16, 17],
    ["twotone", 14, 16],
    ["matcha", 18, 20],
  ] as const) {
    const rows = added.filter((r) => r.categoryId === "video-series-" + group);
    expect(rows).toHaveLength(count);
    expect(
      [
        ...new Set(rows.map((r) => images[r.id as keyof typeof images].part)),
      ].sort((a, b) => a - b),
    ).toEqual(Array.from({ length: parts }, (_, i) => i + 1));
    expect(new Set(rows.map((r) => r.source?.sha256)).size).toBe(1);
    for (const r of rows) {
      expect(assemblyFor(r)).not.toBeNull();
      expect(r.steps).toEqual(assemblyFor(r)!.steps.map((s) => s.text));
      expect(searchRecipes(catalog.recipes, r.menuNumber!)).toContainEqual(r);
      expect(r.verification).toBe("source-unverified");
    }
  }
});
it("keeps source uncertainties, cup variants, extraction water and concentrate types explicit", () => {
  const r = (id: string) => added.find((r) => r.id === "video-series-" + id)!;
  expect(r("coffee-02").ingredients).toContainEqual({
    name: "လိမ္မော်အနှစ်",
    quantity: "40 ml",
  });
  expect(r("coffee-19").ingredients).toContainEqual({
    name: "လိမ္မော်ဖျော်ရည်",
    quantity: "160 ml",
  });
  expect(r("berry-09").cupSizes).toEqual([16]);
  expect(r("berry-9b").cupSizes).toEqual([20]);
  expect(r("twotone-5b").cupSizes).toEqual([]);
  expect(r("twotone-5b").ingredients.some((i) => i.name === "ရေခဲ")).toBe(
    false,
  );
  expect(r("berry-08").notes.join(" ")).toContain("ကိုးကား");
  expect(
    r("berry-08").ingredients.find((i) => i.name === "နို့စိမ်း (Fresh milk)")!
      .quantity,
  ).toContain("မဖော်ပြ");
  expect(r("matcha-06").ingredients).toContainEqual({
    name: "နို့စိမ်းဘူး (Evaporated milk)",
    quantity: "30 ml",
  });
  expect(r("coffee-05").ingredients).toContainEqual({
    name: "ကော်ဖီရည်",
    quantity: "90 ml",
  });
  expect(r("matcha-16").ingredients).toContainEqual({
    name: "နို့ဆီ",
    quantity: "15 ml",
  });
  expect(r("matcha-16b").ingredients).toContainEqual({
    name: "နို့ဆီ",
    quantity: "30 ml",
  });
});
it("delivers a decodable actual-video crop for every addition and lets owner photos override it", async () => {
  expect(Object.keys(images).sort()).toEqual(added.map((r) => r.id).sort());
  for (const r of added) {
    const p = images[r.id as keyof typeof images];
    expect(videoPhotoFor(r)).toEqual(p);
    expect(
      videoPhotoFor({ ...r, image: "https://example.com/owner.webp" }),
    ).toBeNull();
    expect(p.sourceSha256).toBe(r.source!.sha256);
    const bytes = readFileSync("public/" + p.file);
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(p.sha256);
    const decoded = await sharp(bytes).metadata();
    expect(decoded.format).toBe("webp");
    expect(decoded.width).toBe(Number(p.crop.split(":")[0]));
    expect(decoded.height).toBe(Number(p.crop.split(":")[1]));
  }
});
