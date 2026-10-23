import { it, expect } from "vitest";
import { readFileSync } from "node:fs";
import {
  coldStyles,
  countryRecipes,
  internationalRecipes,
} from "../src/international";
import { CatalogSchema } from "../src/model";
const seed = CatalogSchema.parse(
  JSON.parse(readFileSync("public/recipes.json", "utf8")),
);
it("international discovery includes every existing cold menu once without preparations or new recipe records", () => {
  const cold = internationalRecipes(seed.recipes, "cold");
  expect(cold).toHaveLength(110);
  expect(cold.map((r) => r.id).sort()).toEqual(
    seed.recipes
      .filter((r) => r.line === "cold")
      .map((r) => r.id)
      .sort(),
  );
  expect(
    new Set(internationalRecipes(seed.recipes).map((r) => r.id)).size,
  ).toBe(internationalRecipes(seed.recipes).length);
  const grouped = coldStyles.flatMap((g) =>
    internationalRecipes(seed.recipes, "cold", "", g.id),
  );
  expect(grouped.map((r) => r.id).sort()).toEqual(cold.map((r) => r.id).sort());
});
it("country styles expose appropriate existing noncoffee recipes and retain original Vietnamese coffee links", () => {
  expect(countryRecipes(seed.recipes, "ဗီယက်နမ်")).toHaveLength(4);
  expect(internationalRecipes(seed.recipes, "cold", "အီတလီ")).toHaveLength(9);
  expect(
    internationalRecipes(seed.recipes, "cold", "ကျူးဘား").map(
      (r) => r.englishName,
    ),
  ).toContain("Virgin Mojito");
  expect(
    internationalRecipes(seed.recipes, "cold", "ဂျပန်").map(
      (r) => r.englishName,
    ),
  ).toContain("Iced Matcha Latte");
  expect(
    internationalRecipes(seed.recipes, "cold", "ပွာတိုရီကို").map(
      (r) => r.englishName,
    ),
  ).toEqual(["Virgin Piña Colada"]);
});
