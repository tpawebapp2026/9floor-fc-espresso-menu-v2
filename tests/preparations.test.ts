import { it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { CatalogSchema, scaleQuantity } from "../src/model";
import {
  preparationGroups,
  isPreparation,
  densityFromSample,
  convertMetric,
} from "../src/preparations";
const seed = JSON.parse(readFileSync("public/recipes.json", "utf8"));
const canonical = (v: unknown): unknown =>
  Array.isArray(v)
    ? v.map(canonical)
    : v && typeof v === "object"
      ? Object.fromEntries(
          Object.entries(v)
            .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
            .map(([k, x]) => [k, canonical(x)]),
        )
      : v;
it("preserves every field of all 260 previous recipes, including numbers, photos, ingredients, and steps", () => {
  const hashes = JSON.parse(
    readFileSync("tests/fixtures/original-260-sha256.json", "utf8"),
  );
  expect(Object.keys(hashes)).toHaveLength(260);
  for (const [id, hash] of Object.entries(hashes)) {
    const record = seed.recipes.find((r: any) => r.id === id);
    expect(record, id).toBeDefined();
    expect(
      createHash("sha256")
        .update(JSON.stringify(canonical(record)))
        .digest("hex"),
      id,
    ).toBe(hash);
  }
});
it("adds exactly three unique metric trial recipes per requested group without changing drink counts", () => {
  const parsed = CatalogSchema.parse(seed);
  for (const g of preparationGroups)
    expect(parsed.recipes.filter((r) => r.categoryId === g.id)).toHaveLength(3);
  for (const r of parsed.recipes.filter(isPreparation)) {
    expect(r.menuNumber).toMatch(/^(SYR|SAU|CON|PUR)-0[123]$/);
    expect(r.steps.length).toBeGreaterThanOrEqual(10);
    expect(r.ingredients.some((i) => /g ≈ .* ml/.test(i.quantity))).toBe(true);
    expect(r.verification).toBe("source-unverified");
  }
  expect(
    parsed.recipes.filter((r) => !isPreparation(r) && r.line === "barista"),
  ).toHaveLength(161);
  expect(
    parsed.recipes.filter((r) => !isPreparation(r) && r.line === "cold"),
  ).toHaveLength(110);
  expect(CatalogSchema.parse(JSON.parse(JSON.stringify(parsed)))).toEqual(
    parsed,
  );
});
it("converts measured batch density in both directions and rejects missing or invalid measurements", () => {
  expect(densityFromSample(123, 100)).toBe(1.23);
  expect(convertMetric(30, 1.23, "ml-to-g")).toBeCloseTo(36.9);
  expect(convertMetric(36.9, 1.23, "g-to-ml")).toBeCloseTo(30);
  expect(densityFromSample(1e308, 1e-308)).toBeNull();
  expect(convertMetric(1e308, 1e-308, "g-to-ml")).toBeNull();
  expect(densityFromSample(0, 100)).toBeNull();
  expect(densityFromSample(100, 0)).toBeNull();
  expect(densityFromSample(NaN, 100)).toBeNull();
  expect(convertMetric(30, null, "g-to-ml")).toBeNull();
  expect(convertMetric(-1, 1.23, "ml-to-g")).toBeNull();
  expect(scaleQuantity("300 g ≈ 300.5 ml", 2)).toBe("600 g ≈ 601 ml");
});
