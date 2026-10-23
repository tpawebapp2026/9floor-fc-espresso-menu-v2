import { it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { CatalogSchema } from "../src/model";
import { getProcedure, relatedStyles } from "../src/procedure";
import { isMatcha, matchaStyle } from "../src/matcha";
const catalog = CatalogSchema.parse(
  JSON.parse(readFileSync("public/recipes.json", "utf8")),
);
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
it("preserves every original 272 recipe record and adds eleven distinct unverified style trials", () => {
  const original = JSON.parse(
    readFileSync("tests/fixtures/before-matcha-272-sha256.json", "utf8"),
  );
  for (const [id, hash] of Object.entries(original)) {
    const r = catalog.recipes.find((r) => r.id === id);
    expect(r).toBeTruthy();
    expect(createHash("sha256").update(stable(r)).digest("hex")).toBe(hash);
  }
  const added = catalog.recipes.filter((r) => !(r.id in original));
  expect(added).toHaveLength(11);
  expect(
    added.every(
      (r) => r.verification === "source-unverified" && r.steps.length >= 10,
    ),
  ).toBe(true);
});
it("offers ten Matcha menus across six country styles", () => {
  const matcha = catalog.recipes.filter(isMatcha);
  expect(matcha).toHaveLength(10);
  expect(new Set(matcha.map((r) => matchaStyle(r)?.id)).size).toBe(6);
});
it("provides substantive steps and valid unique related links for every recipe", () => {
  for (const r of catalog.recipes) {
    const p = getProcedure(r);
    expect(p.steps.length, r.id).toBeGreaterThanOrEqual(10);
    expect(
      p.steps.every((s) => s.trim().length > 0),
      r.id,
    ).toBe(true);
    expect(p.steps.join(" ").length, r.id).toBeGreaterThan(500);
    const related = relatedStyles(r, catalog.recipes);
    expect(
      related.every(
        (x) => x.id !== r.id && catalog.recipes.some((y) => y.id === x.id),
      ),
    ).toBe(true);
    expect(new Set(related.map((x) => x.id)).size).toBe(related.length);
  }
});
it("flags source uncertainty and restricts steaming to liquid milk", () => {
  const egg = catalog.recipes.find(
    (r) => r.englishName === "Vietnamese Egg Coffee",
  )!;
  expect(getProcedure(egg).warnings.join(" ")).toContain("Pasteurized");
  const panna = catalog.recipes.find(
    (r) => r.englishName === "Espresso Con Panna",
  )!;
  expect(getProcedure(panna).steps.some((s) => s.includes("Steam wand"))).toBe(
    false,
  );
  for (const r of catalog.recipes.filter(
    (r) => !r.cupSizes.length && !r.categoryId.startsWith("prep-"),
  ))
    expect(getProcedure(r).warnings.length).toBeGreaterThan(0);
});
