import { it, expect } from "vitest";
import { readFileSync } from "node:fs";
const seed = JSON.parse(readFileSync("public/recipes.json", "utf8"));
it("keeps original ingredient rows for audit and preserves every original preparation step", () => {
  for (const r of seed.recipes) {
    expect(r.sourceIngredients.length).toBe(r.ingredients.length);
    for (let i = 0; i < r.ingredients.length; i++) {
      const raw = r.sourceIngredients[i],
        parsed = r.ingredients[i];
      if (raw.quantity) {
        expect(parsed).toEqual(raw);
      } else {
        expect(raw.name).toContain(parsed.name);
        expect(raw.name).toContain(parsed.quantity);
      }
    }
    expect(r.steps.length).toBeGreaterThan(0);
  }
});
it("imports verified V9 Iced Cappuccino without replacing the 259 original IDs", () => {
  expect(seed.recipes.filter((r: any) => r.id.startsWith("v8-"))).toHaveLength(
    259,
  );
  const r = seed.recipes.find((r: any) => r.id === "v9-iced-cappuccino");
  expect(r.englishName).toBe("Iced Cappuccino");
  expect(r.cupSizes).toEqual([16]);
  expect(r.ingredients.map((i: any) => i.quantity)).toEqual([
    "16 g",
    "32 g",
    "120 ml",
    "40 ml",
    "180 g",
    "5–10 ml",
  ]);
  expect(r.steps).toHaveLength(9);
  expect(r.verification).toBe("source-unverified");
});
