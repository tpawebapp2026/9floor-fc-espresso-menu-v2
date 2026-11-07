import { it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { CatalogSchema } from "../src/model";
import { getClearProcedure, shortSteps } from "../src/clearProcedure";
const catalog = CatalogSchema.parse(
  JSON.parse(readFileSync("public/recipes.json", "utf8")),
);
const recipe = (name: string) =>
  catalog.recipes.find((r) => r.englishName === name)!;
it("keeps a nonempty beginner path for all 307 recipes without changing source records", () => {
  const before = JSON.stringify(catalog);
  for (const r of catalog.recipes) {
    const steps = getClearProcedure(r);
    expect(steps.length, r.id).toBeGreaterThan(0);
    expect(
      steps.every((s) => s.trim().length > 0),
      r.id,
    ).toBe(true);
  }
  expect(catalog.recipes).toHaveLength(307);
  expect(JSON.stringify(catalog)).toBe(before);
});
it("states each of the new 24 recipes' own ingredients and quantities", () => {
  for (const r of catalog.recipes.filter((r) => r.id.startsWith("upgrade-"))) {
    const text = getClearProcedure(r).join(" ");
    for (const i of r.ingredients)
      expect(text, r.englishName).toContain(`${i.name} ${i.quantity}`);
  }
});
it("soda uses only its own ingredients and splits its 160 g soda into 20 + 140 g", () => {
  for (const r of catalog.recipes.filter(
    (r) => r.categoryId === "upgrade-soda",
  )) {
    const text = getClearProcedure(r).join(" ");
    expect(text).toContain("20 g");
    expect(text).toContain("140 g");
    expect(text).not.toMatch(/နို့|cream|Espresso|Taro|75–80/);
    expect(text).toContain("အဖုံးပိတ်ပြီး မလှုပ်");
  }
});
it("separates the two hot-water portions in Taro Matcha", () => {
  const text = getClearProcedure(recipe("Taro Matcha Latte")).join(" ");
  expect(text).toContain("ရေနွေး (Taro အတွက်) 30 g");
  expect(text).toContain("ရေနွေး 75–80°C (Matcha အတွက်) 40 g");
});
it("keeps Oreo coffee free of unrelated ingredients and makes grounds separate", () => {
  const text = getClearProcedure(recipe("Iced Oreo Latte")).join(" ");
  expect(text).not.toMatch(/Taro|Matcha|purée|Syrup|Sauce|ပါလျှင်/);
  expect(text).toContain("ကော်ဖီမှုန့်ကို သောက်ခွက်ထဲ မထည့်");
});
it("distinguishes cold foam ingredient batch from a 40 g topping", () => {
  const text = getClearProcedure(recipe("Vanilla Cold Foam Base")).join(" ");
  expect(text).toContain("100 g");
  expect(text).toContain("40 g");
  expect(text).toContain("အပူမပေး");
  expect(text).not.toContain("ရေခဲ scoop");
});
it("preserves decimal quantities when breaking long paragraphs into short instructions", () => {
  expect(shortSteps(["1. ဆား 0.5 g ထည့်ပါ။ 15–20 s မွှေပါ။"])).toEqual([
    "ဆား 0.5 g ထည့်ပါ။",
    "15–20 s မွှေပါ။",
  ]);
});
it("does not bury real mixing steps under takeaway packing instructions", () => {
  const text = getClearProcedure(recipe("Iced Latte")).join(" ");
  expect(text).toContain("နို့အေး 150 ml");
  expect(text).toContain("ရေခဲ 150–180 g");
  expect(text).not.toMatch(/Tissue|Cup Carrier|အော်ဒါအမည်/);
});
it("explains hot latte steaming with the source milk quantity and stops steam before removing jug", () => {
  const text = getClearProcedure(recipe("Hot Latte")).join(" ");
  expect(text).toContain("180 ml");
  expect(text).toContain("steam အရင်ပိတ်ပြီးမှ");
  expect(text).toContain("အပူချိန်တိုင်းကိရိယာ");
  expect(text).toContain("55–65°C");
});
