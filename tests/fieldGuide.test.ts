import { it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { CatalogSchema } from "../src/model";
import { buildFieldGuide } from "../src/fieldGuide";
const catalog = CatalogSchema.parse(
  JSON.parse(readFileSync("public/recipes.json", "utf8")),
);
const find = (name: string) =>
  catalog.recipes.find((r) => r.englishName === name)!;
const guide = (name: string) => buildFieldGuide(find(name));
const actions = (name: string) =>
  guide(name)
    .steps.map((s) => s.action)
    .join(" ");
it("gives all 307 menus actions, completion checks, source distinctions and complete 1216-ingredient accounting", () => {
  const before = JSON.stringify(catalog);
  expect(catalog.recipes).toHaveLength(307);
  expect(catalog.recipes.reduce((a, r) => a + r.ingredients.length, 0)).toBe(
    1216,
  );
  for (const r of catalog.recipes) {
    const g = buildFieldGuide(r);
    expect(g.usedIngredientIndexes, r.id).toEqual(
      r.ingredients.map((_, i) => i),
    );
    expect(
      g.steps.every((s) => s.title && s.action && s.check),
      r.id,
    ).toBe(true);
    for (const i of r.ingredients)
      if (i.quantity)
        expect(g.steps.map((s) => s.action).join(" "), r.id).toContain(
          `${i.name} ${i.quantity}`,
        );
    expect(g.standard).toContain("SCA");
    expect(g.status).not.toContain("အောင်မြင်");
  }
  expect(JSON.stringify(catalog)).toBe(before);
});
it("makes missing or conflicting formulas visible instead of inventing quantities", () => {
  for (const name of [
    "Moka Pot Coffee",
    "Thai Oliang Coffee",
    "Doppio Ristretto",
    "Iced Ristretto Black",
    "Iced Lemon Tea",
  ])
    expect(
      guide(name).issues.some((i) => i.level === "blocker"),
      name,
    ).toBe(true);
  expect(actions("Moka Pot Coffee")).not.toMatch(/16 g|32 g/);
});
it("retains V60 original bloom allocations and exact total water", () => {
  expect(actions("V60 Pour Over")).toContain("30 g");
  expect(actions("V60 Pour Over")).toContain("ကျန် 210 g");
  expect(actions("Iced V60 Japanese Style")).toContain("35 g");
  expect(actions("Iced V60 Japanese Style")).toContain("ကျန် 115 g");
});
it("keeps dirty coffee cold and un-stirred, affogato ice-cream based, and freddo a two-shot yield", () => {
  expect(actions("Dirty Coffee")).not.toContain("steam mode");
  expect(
    guide("Dirty Coffee")
      .steps.map((s) => s.check)
      .join(" "),
  ).toContain("မမွှေ");
  expect(guide("Affogato").steps.some((s) => s.title === "ရေခဲထည့်ပါ")).toBe(
    false,
  );
  expect(actions("Freddo Espresso")).toContain(
    "16 g တစ်ကြိမ်တည်းဖြင့် 64 g အရှည်မထုတ်",
  );
  expect(actions("Freddo Cappuccino")).toContain("အပူမပေး");
});
it("keeps matcha and chocolate powder separate from garnish cocoa", () => {
  expect(actions("Tiramisu Latte")).toContain("Cocoa powder 2 g — ဇကာစိတ်");
  expect(actions("Marocchino")).toContain("Cocoa powder 3 g — ဇကာစိတ်");
  expect(actions("Iced Cocoa")).not.toContain("Matcha");
});
it("adds espresso to the blender after cooling; keeps milk out of the shaken espresso stage", () => {
  expect(actions("Coffee Frappe")).toContain("blender ထဲ ပြောင်းထည့်");
  const g = guide("Oat Brown Sugar Shaken Espresso");
  const shake = g.steps.findIndex((s) => s.title === "အေးမှ shaker ပိတ်ပါ");
  const milk = g.steps.findIndex((s) => s.title === "လှုပ်ပြီးမှ နို့ထည့်ပါ");
  expect(shake).toBeGreaterThan(-1);
  expect(milk).toBeGreaterThan(shake);
});
it("puts espresso in the cup before hot milk and never steams cream toppings", () => {
  const g = guide("Hot Latte");
  expect(
    g.steps.findIndex((s) => s.title === "ကော်ဖီကို ခွက်ထဲပြောင်းပါ"),
  ).toBeLessThan(g.steps.findIndex((s) => s.title === "နို့လောင်းပါ"));
  expect(actions("Espresso Con Panna")).not.toContain("steam mode");
});
it("separates the 120 ml base milk and 40 ml cold foam milk in Iced Cappuccino", () => {
  const g = guide("Iced Cappuccino");
  expect(
    g.steps.find((s) => s.title === "အောက်ခံနို့ ထည့်ပါ")?.action,
  ).toContain("120 ml");
  expect(
    g.steps.find((s) => s.title === "အမြှုပ်အတွက် နို့ခတ်ပါ")?.action,
  ).toContain("40 ml");
});
it("keeps egg pasteurization visible, soda unshaken, and original single-cup totals", () => {
  expect(
    guide("Vietnamese Egg Coffee").issues.some((i) =>
      /Pasteurized/.test(i.message),
    ),
  ).toBe(true);
  for (const r of catalog.recipes.filter((r) =>
    r.ingredients.some((i) => /Soda Water|ဆိုဒါရေ/i.test(i.name)),
  )) {
    const g = buildFieldGuide(r);
    expect(
      g.steps.map((s) => s.action + " " + s.check).join(" "),
      r.id,
    ).toMatch(/မလှုပ်/);
  }
});
it("fails visibly rather than crashing when an imported expansion formula no longer matches its method", () => {
  const r = structuredClone(find("Iced Oreo Latte"));
  r.ingredients = r.ingredients.filter((i) => i.name !== "ရေခဲ");
  const g = buildFieldGuide(r);
  expect(g.issues.some((i) => /မကိုက်တော့/.test(i.message))).toBe(true);
  expect(g.usedIngredientIndexes).toEqual(r.ingredients.map((_, i) => i));
});
