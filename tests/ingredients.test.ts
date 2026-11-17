import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import catalog from "../public/recipes.json";
import {
  ingredients,
  ingredientForName,
  ingredientUses,
  findIngredients,
} from "../src/ingredients";
import type { Recipe } from "../src/model";
const recipes = catalog.recipes as Recipe[];
describe("ingredient directory", () => {
  it("covers every ingredient in the current catalog and links exact recipe forms", () => {
    expect(new Set(ingredients.map((p) => p.id)).size).toBe(ingredients.length);
    for (const r of recipes)
      for (const i of r.ingredients) {
        const profiles = ingredientForName(i.name);
        expect(profiles.length, `${r.id}: ${i.name}`).toBeGreaterThan(0);
        for (const p of profiles)
          expect(
            ingredientUses(p, recipes).some(
              (u) =>
                u.recipe.id === r.id &&
                u.items.some(
                  (item) =>
                    item.name === i.name && item.quantity === i.quantity,
                ),
            ),
          ).toBe(true);
      }
  });
  it("distinguishes fresh, evaporated and condensed milk and keeps foam ingredients accurate", () => {
    expect(
      ingredientForName("နို့စိမ်း (Fresh milk)").map((p) => p.id),
    ).toEqual(["milk"]);
    expect(
      ingredientForName("နို့စိမ်းဘူး (Evaporated milk)").map((p) => p.id),
    ).toEqual(["evaporated-milk"]);
    expect(ingredientForName("နို့ဆီ").map((p) => p.id)).toEqual([
      "condensed-milk",
    ]);
    expect(
      ingredientForName("Dutch Cocoa Powder (Foam)").map((p) => p.id),
    ).toEqual(["cocoa"]);
    expect(
      ingredientForName("ဆိုဒါရည် — ရေခဲပေါ်ဖြည့်ရန်").map((p) => p.id),
    ).toEqual(["soda"]);
    expect(ingredientForName("Rosemary").map((p) => p.id)).toEqual([
      "rosemary",
    ]);
    expect(
      ingredientForName("နို့အေး / ရေအေး")
        .map((p) => p.id)
        .sort(),
    ).toEqual(["milk", "water"]);
  });
  it("finds brand aliases, linked drink names and exact purée variants", () => {
    expect(
      findIngredients(recipes, "Nature Taste", "").some(
        (p) => p.id === "strawberry",
      ),
    ).toBe(true);
    const p = ingredients.find((p) => p.id === "strawberry")!;
    const uses = ingredientUses(p, recipes, "Strawberry Purée");
    expect(uses.length).toBeGreaterThan(0);
    expect(
      uses.every((u) => u.items.every((i) => i.name === "Strawberry Purée")),
    ).toBe(true);
    expect(
      findIngredients(recipes, uses[0].recipe.englishName, "fruit").some(
        (p) => p.id === "strawberry",
      ),
    ).toBe(true);
  });
  it("ships a local real photo with source, license and clear caption for every profile", () => {
    const photos = JSON.parse(
      readFileSync("src/ingredientPhotos.json", "utf8"),
    );
    for (const p of ingredients) {
      const photo = photos[p.id];
      expect(photo, p.id).toBeDefined();
      expect(existsSync("public/" + photo.file), p.id).toBe(true);
      expect([
        "commons.wikimedia.org",
        "home.halesblueboy.co.th",
        "monin1912.com",
        "www.cha-thai.com",
      ]).toContain(new URL(photo.sourceUrl).hostname);
      expect(photo.license).toMatch(/CC BY|CC0|Public domain|©/);
      expect(photo.caption.length).toBeGreaterThan(12);
      expect(photo.changes).toContain("WebP");
    }
  });
});
