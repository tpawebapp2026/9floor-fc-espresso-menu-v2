import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import {
  CatalogSchema,
  searchRecipes,
  scaleQuantity,
  newer,
} from "../src/model";
const original = JSON.parse(readFileSync("public/recipes.json", "utf8"));
describe("V8 migration and import", () => {
  it("validates 260 unique, navigable recipes and 28 categories", () => {
    const data = CatalogSchema.parse(original);
    expect(data.recipes).toHaveLength(260);
    expect(data.categories).toHaveLength(28);
    expect(new Set(data.recipes.map((r) => r.id)).size).toBe(260);
    expect(
      data.recipes.every((r) => r.steps.length && r.ingredients.length),
    ).toBe(true);
  });
  it("preserves numbered names and supports menu number search", () => {
    expect(searchRecipes(original.recipes, "21-02")[0].englishName).toBe(
      "Vietnamese Egg Coffee",
    );
    expect(searchRecipes(original.recipes, "jasmine").length).toBeGreaterThan(
      0,
    );
  });
  it("does not manufacture missing numbers or images", () => {
    expect(
      original.recipes.filter((r: any) => r.menuNumber === null),
    ).toHaveLength(160);
    expect(original.recipes.every((r: any) => r.image === null)).toBe(true);
  });
  it("rejects duplicate IDs, numbers, names, broken categories and unsafe URLs", () => {
    for (const field of [
      "id",
      "menuNumber",
      "englishName",
      "categoryId",
      "image",
    ]) {
      const data = structuredClone(original);
      if (field === "menuNumber") {
        data.recipes[0].menuNumber = "21-02";
      } else if (field === "categoryId") {
        data.recipes[0].categoryId = "missing";
      } else if (field === "image") {
        data.recipes[0].image = "javascript:alert(1)";
      } else data.recipes[0][field] = data.recipes[1][field];
      expect(CatalogSchema.safeParse(data).success).toBe(false);
    }
  });
  it("JSON round trip preserves all recipes and original ingredient strings", () => {
    expect(CatalogSchema.parse(JSON.parse(JSON.stringify(original)))).toEqual(
      original,
    );
  });
});
describe("quantity and revision safety", () => {
  it("scales metric ranges without changing source", () => {
    expect(scaleQuantity("150–180 g", 2)).toBe("300–360 g");
    expect(scaleQuantity("32 g (double shot)", 3)).toBe("96 g (double shot)");
    expect(scaleQuantity("အနည်းငယ်", 2)).toBe("အနည်းငယ် × 2");
    expect(scaleQuantity("16 g", 1)).toBe("16 g");
  });
  it("rejects older, equal and bundled revisions after a newer publish", () => {
    expect(
      newer({ ...original, revision: 5 }, { ...original, revision: 4 }),
    ).toBe(false);
    expect(
      newer({ ...original, revision: 5 }, { ...original, revision: 0 }),
    ).toBe(false);
    expect(
      newer({ ...original, revision: 5 }, { ...original, revision: 5 }),
    ).toBe(false);
    expect(
      newer({ ...original, revision: 5 }, { ...original, revision: 6 }),
    ).toBe(true);
  });
});
it("updates a newer bundled seed without allowing it to overwrite a published catalog", () => {
  expect(
    newer(
      { ...original, revision: 0, seedVersion: 1 },
      { ...original, revision: 0, seedVersion: 2 },
    ),
  ).toBe(true);
  expect(
    newer(
      { ...original, revision: 0, seedVersion: 2 },
      { ...original, revision: 0, seedVersion: 1 },
    ),
  ).toBe(false);
  expect(
    newer(
      { ...original, revision: 7 },
      { ...original, revision: 0, seedVersion: 999 },
    ),
  ).toBe(false);
});
