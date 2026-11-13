import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { assemblyPlans, assemblyFor, type AssemblyPlan } from "../src/assembly";
import { CatalogSchema } from "../src/model";
import { getProcedure } from "../src/procedure";
const seed = CatalogSchema.parse(
  JSON.parse(readFileSync("public/recipes.json", "utf8")),
);
const plan = (id: string) => assemblyPlans[id];
const cups = (id: string) => plan(id).steps.filter((s) => s.cupNumber);
describe("complete cup-by-cup assembly", () => {
  it("covers exactly 324 current recipes with every ingredient allocated once and every prepared mixture transferred once", () => {
    expect(Object.keys(assemblyPlans).sort()).toEqual(
      seed.recipes.map((r) => r.id).sort(),
    );
    for (const r of seed.recipes) {
      const p = assemblyFor(r)!;
      expect(p, r.id).toBeTruthy();
      const allocated = p.ingredients.map(() => 0);
      const held = new Set<string>();
      let cupNumber = 0;
      for (const s of p.steps) {
        expect(s.vessel.length, r.id).toBeGreaterThan(0);
        for (const u of s.uses) {
          expect(u.index, r.id).toBeLessThan(allocated.length);
          expect(u.part, r.id).toBeGreaterThan(0);
          allocated[u.index] += u.part;
        }
        if (s.into) expect(held.has(s.into), r.id + ": " + s.into).toBe(true);
        for (const key of s.take) {
          expect(held.has(key), r.id + ": " + key).toBe(true);
          held.delete(key);
        }
        if (s.produce) {
          expect(held.has(s.produce), r.id).toBe(false);
          held.add(s.produce);
        }
        if (s.cupNumber) expect(s.cupNumber, r.id).toBe(++cupNumber);
      }
      for (const amount of allocated) expect(amount, r.id).toBeCloseTo(1, 8);
      expect(held.size, r.id).toBe(0);
      if (p.kind === "drink") expect(cupNumber, r.id).toBeGreaterThan(0);
      else expect(cupNumber, r.id).toBe(0);
      expect(getProcedure(r).steps, r.id).toEqual(p.steps.map((s) => s.text));
    }
  });
  it("distinguishes first additions for iced latte, Americano, Long Black and layered matcha", () => {
    expect(plan("v8-01-09").cupOrder).toEqual(
      expect.arrayContaining([
        expect.stringContaining("150 ml"),
        expect.stringContaining("180 g"),
        expect.stringContaining("32 g"),
      ]),
    );
    expect(
      cups("v8-01-09").map((s) => [s.uses.map((u) => u.index), s.take]),
    ).toEqual([
      [[2], []],
      [[3], []],
      [[], ["espresso"]],
    ]);
    expect(cups("v8-02-03")[0].take).toEqual(["espresso"]);
    expect(cups("v8-02-04")[0].uses[0].index).toBe(2);
    expect(cups("v8-17-01").map((s) => s.uses.map((u) => u.index))).toEqual([
      [1],
      [2],
      [],
    ]);
    expect(
      cups("matcha-korean-strawberry").map((s) => [
        s.uses.map((u) => u.index),
        s.take,
      ]),
    ).toEqual([
      [[2], []],
      [[4], []],
      [[3], []],
      [[], ["matcha"]],
    ]);
  });
  it("accounts for blender and shaker ice without asking for another full serving of ice", () => {
    const blend = plan("v8-06-04");
    expect(
      blend.steps
        .filter((s) => s.uses.some((u) => u.index === 2))
        .map((s) => s.vessel),
    ).toEqual(["Blender"]);
    expect(cups("v8-06-04")).toHaveLength(1);
    expect(cups("v8-06-04")[0].take).toEqual(["blended"]);
    const freddo = plan("v8-24-02").steps.flatMap((s) =>
      s.uses
        .filter((u) => u.index === 1)
        .map((u) => ({ vessel: s.vessel, part: u.part })),
    );
    expect(freddo).toEqual([
      { vessel: "Shaker", part: 1 / 3 },
      { vessel: "သောက်ခွက်", part: 1 - 1 / 3 },
    ]);
    expect(cups("v8-24-02")[0].text).toContain("120 g");
    expect(cups("v8-24-01")).toHaveLength(1);
  });
  it("keeps foam ingredients out of the base and splits the same Oreo allocation instead of doubling it", () => {
    const p = plan("9f-poster-015");
    for (const index of [5, 6, 7, 8])
      expect(
        p.steps.find((s) => s.uses.some((u) => u.index === index))?.vessel,
      ).toBe("ခရင်မ်ခွက်");
    expect(p.steps.find((s) => s.uses.some((u) => u.index === 2))?.vessel).toBe(
      "သောက်ခွက်",
    );
    const oreo = plan("9f-poster-032").steps.flatMap((s) =>
      s.uses.filter((u) => u.index === 4).map((u) => u.part),
    );
    expect(oreo).toEqual([0.5, 0.5]);
    expect(plan("9f-poster-032").cupOrder[0]).toContain("1 ချပ်");
    expect(cups("v8-02-06").at(-1)?.take).toEqual(["reserved-foam"]);
  });
  it("never sends carbonation to a sealed shaker or blender and never puts espresso grounds in the drink", () => {
    for (const r of seed.recipes) {
      const p = plan(r.id);
      for (const s of p.steps)
        for (const u of s.uses) {
          const name = p.ingredients[u.index].name;
          if (/soda|tonic|sparkling|ginger ale|ginger beer|ဆိုဒါ/i.test(name))
            expect(s.vessel, r.id).not.toMatch(/Blender|Shaker/);
          if (/Espresso အတွက် ကော်ဖီမှုန့်|Espresso ကော်ဖီစေ့/.test(name))
            expect(s.phase, r.id).toBe("prepare");
        }
    }
  });
  it("does not silently apply a stale plan to an owner-edited recipe", () => {
    const r = structuredClone(seed.recipes[0]);
    r.ingredients[0].quantity = "19 g";
    expect(assemblyFor(r)).toBeNull();
    expect(assemblyFor({ ...r, id: "custom-new-recipe" })).toBeNull();
  });
});
