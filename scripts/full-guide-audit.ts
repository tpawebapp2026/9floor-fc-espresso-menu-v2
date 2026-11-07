import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { CatalogSchema } from "../src/model";
import { buildFieldGuide } from "../src/fieldGuide";
const file = readFileSync("public/recipes.json");
const data = CatalogSchema.parse(JSON.parse(file.toString()));
const records = data.recipes.map((r) => {
  const g = buildFieldGuide(r);
  return {
    id: r.id,
    number: r.menuNumber,
    name: r.englishName,
    method: g.method,
    steps: g.steps.length,
    status: g.status,
    issues: g.issues,
    sources: g.sourceKeys,
    ingredients: r.ingredients.length,
    accounted: g.usedIngredientIndexes.length,
    unresolvedSteps: g.steps
      .filter((s) => s.title === "သီးခြားပစ္စည်းကို စစ်ပါ")
      .map((s) => s.action),
  };
});
const result = {
  sourceSHA256: createHash("sha256").update(file).digest("hex"),
  records: records.length,
  ingredientCount: records.reduce((a, r) => a + r.ingredients, 0),
  blockers: records.filter((r) => r.issues.some((i) => i.level === "blocker"))
    .length,
  tasteTested: 0,
  methods: Object.fromEntries(
    [...new Set(records.map((r) => r.method))].map((m) => [
      m,
      records.filter((r) => r.method === m).length,
    ]),
  ),
  menus: records,
};
writeFileSync(
  "docs/FULL_GUIDE_AUDIT_20261107.json",
  JSON.stringify(result, null, 2) + "\n",
);
console.log(JSON.stringify({ ...result, menus: undefined }));
console.log(
  "Unresolved:",
  records
    .filter((r) => r.unresolvedSteps.length)
    .map((r) => ({ name: r.name, unresolved: r.unresolvedSteps })),
);
