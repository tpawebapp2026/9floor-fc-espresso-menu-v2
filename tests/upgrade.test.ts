import { it, expect } from "vitest";
import fs from "node:fs";
import { CatalogSchema, searchRecipes } from "../src/model";
import { ingredientMetric, massAudit, qualityFor } from "../src/quality";
import { referencePhoto } from "../src/RecipePhoto";
const data = CatalogSchema.parse(
  JSON.parse(fs.readFileSync("public/recipes.json", "utf8")),
);
const before = JSON.parse(
  fs.readFileSync("tests/fixtures/before-upgrade-283.json", "utf8"),
);
const added = data.recipes.filter((r) => r.id.startsWith("upgrade-"));
it("keeps all 283 original records exactly, categories, numbers and images included", () => {
  expect(before.recipes).toHaveLength(283);
  expect(data.recipes).toHaveLength(307);
  expect(added).toHaveLength(24);
  for (const r of before.recipes)
    expect(data.recipes.find((x) => x.id === r.id)).toEqual(r);
  for (const c of before.categories)
    expect(data.categories.find((x) => x.id === c.id)).toEqual(c);
  expect(data.seedVersion).toBeGreaterThan(before.seedVersion);
  for (const key of ["id", "englishName", "menuNumber"] as const) {
    const values = data.recipes
      .map((x) => x[key]?.toLowerCase())
      .filter(Boolean);
    expect(new Set(values).size).toBe(values.length);
  }
});
it("gives every original and new recipe a discoverable detail ID, name, number and ingredient search", () => {
  for (const r of data.recipes) {
    for (const query of [
      r.id,
      r.englishName,
      r.menuNumber,
      r.burmeseName,
      ...r.ingredients.map((i) => i.name),
    ].filter(Boolean) as string[])
      expect(
        searchRecipes(data.recipes, query, data.categories).map((x) => x.id),
        `${r.id}: ${query}`,
      ).toContain(r.id);
  }
}, 30000);
it("finds every ingredient/name keyword across the complete catalog with correct independent expected sets", () => {
  for (const term of [
    "oreo",
    "taro",
    "matcha",
    "vanilla",
    "caramel",
    "chocolate",
    "passion",
    "lychee",
    "strawberry",
    "blue",
    "mixed berry",
  ]) {
    const matches = searchRecipes(data.recipes, term, data.categories);
    const expected = data.recipes.filter((r) => {
      const text = (
        r.englishName +
        " " +
        r.ingredients.map((i) => i.name).join(" ") +
        " " +
        data.categories.find((c) => c.id === r.categoryId)?.name
      ).toLowerCase();
      return (
        text.includes(term) ||
        (term === "chocolate" && /cocoa|ချောကလက်/.test(text))
      );
    });
    // All requested keywords refer to named ingredients; irrelevant recipes must not inflate these counts.
    expect(matches.map((x) => x.id).sort(), term).toEqual(
      expected.map((x) => x.id).sort(),
    );
  }
  expect(
    searchRecipes(data.recipes, "  OREO  ", data.categories).map((x) => x.id),
  ).toEqual(
    searchRecipes(data.recipes, "အိုရီယို", data.categories).map((x) => x.id),
  );
  expect(
    searchRecipes(data.recipes, "MixedBerry", data.categories).some(
      (r) => r.englishName === "Mixed Berry Matcha Latte",
    ),
  ).toBe(true);
  expect(searchRecipes(data.recipes, "matcHa", data.categories)).toEqual(
    searchRecipes(data.recipes, "matcha", data.categories),
  );
  expect(
    searchRecipes(data.recipes, "vanila", data.categories).some((r) =>
      /Vanilla/.test(r.englishName),
    ),
  ).toBe(true);
  expect(
    searchRecipes(data.recipes, "NEW-၀၁", data.categories)[0].englishName,
  ).toBe("Iced Oreo Latte");
  expect(
    searchRecipes(data.recipes, "zzzxqnoresult", data.categories),
  ).toHaveLength(0);
});
it("searches category, country/style and flavor as well as names", () => {
  for (const r of added)
    expect(
      searchRecipes(
        data.recipes,
        data.categories.find((c) => c.id === r.categoryId)!.name,
        data.categories,
      ),
    ).toContain(r);
  expect(
    searchRecipes(data.recipes, "ထိုင်း", data.categories).some(
      (r) => r.englishName === "Thai Es Yen",
    ),
  ).toBe(true);
  expect(
    searchRecipes(data.recipes, "creamy", data.categories).length,
  ).toBeGreaterThan(0);
});
it("keeps missing and ambiguous weights unknown and never equates syrup ml with g", () => {
  expect(
    ingredientMetric({ name: "Vanilla Syrup", quantity: "20 ml" }).g,
  ).toBeNull();
  expect(
    ingredientMetric({ name: "Vanilla Syrup", quantity: "20 ml" }).approximateG,
  ).toBeNull();
  expect(
    ingredientMetric({ name: "နို့အေး", quantity: "150 ml" }).approximateG,
  ).toBe(154.5);
  expect(
    ingredientMetric({ name: "ရေခဲ", quantity: "150–180 g" }).g,
  ).toBeNull();
  expect(ingredientMetric({ name: "Oreo", quantity: "3 ချပ်" }).g).toBeNull();
  const r = data.recipes.find((r) => r.englishName === "Iced Oreo Latte")!;
  expect(massAudit(r).exactInputG).toBe(382);
  expect(
    massAudit({
      ...r,
      ingredients: [
        { name: "Espresso အတွက် ကော်ဖီမှုန့်", quantity: "16 g" },
        ...r.ingredients,
      ],
    }).exactInputG,
  ).toBe(382);
  expect(
    massAudit(
      data.recipes.find((r) => r.englishName === "Vanilla Cold Foam Base")!,
    ).exactInputG,
  ).toBe(100);
  for (const r of added) {
    expect(massAudit(r).unresolved, r.id).toEqual([]);
    expect(r.verification).toBe("source-unverified");
    expect(referencePhoto(r)).toBeNull();
  }
});
it("supplies complete provisional quality sections and audit findings for every recipe without approving taste", () => {
  for (const r of data.recipes) {
    const q = qualityFor(r);
    expect(q.flavor).toHaveLength(6);
    expect(q.adjustments).toHaveLength(6);
    expect(q.expected).toBeTruthy();
    expect(q.origin).toContain("အတည်မပြု");
    expect(q.status).not.toContain("Research-based Recipe");
  }
});
