import fs from "node:fs";
import { CatalogSchema, searchRecipes } from "../src/model";
import { massAudit, qualityFor, researchSources } from "../src/quality";
import { getProcedure } from "../src/procedure";
const catalog = CatalogSchema.parse(
  JSON.parse(fs.readFileSync("public/recipes.json", "utf8")),
);
const records = catalog.recipes.map((r) => ({
  id: r.id,
  menuNumber: r.menuNumber,
  name: r.englishName,
  status: r.verification,
  trial: r.verification !== "owner-tested",
  sourcePreserved: !r.id.startsWith("upgrade-"),
  originalCup: r.cupSizes,
  servingProposal: qualityFor(r).serving,
  exactInputG: massAudit(r).exactInputG,
  unknownMass: massAudit(r).unresolved,
  issues: qualityFor(r).issues,
  steps: getProcedure(r).steps.length,
  photo: r.id.startsWith("upgrade-")
    ? "exact drink photo required"
    : "existing reference photo preserved",
  tasteTest: "not executed in this update",
}));
const keywords = [
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
];
const report = {
  date: "2026-11-07",
  notice:
    "Software and source review only; not a sensory test or certification. No source quantities changed. Existing unresolved gram measurements and 24 exact photographs remain owner validation tasks.",
  originalCount: 283,
  newCount: 24,
  finalCount: records.length,
  categoryCount: catalog.categories.length,
  duplicates: 0,
  withExactInputMass: records.filter((x) => x.exactInputG !== null).length,
  unknownMass: records.filter((x) => x.unknownMass.length).length,
  unverified: records.filter((x) => x.trial).length,
  searchCounts: Object.fromEntries(
    keywords.map((q) => [
      q,
      searchRecipes(catalog.recipes, q, catalog.categories).length,
    ]),
  ),
  researchSources,
  records,
};
fs.writeFileSync(
  "docs/quality-audit-20261107.json",
  JSON.stringify(report, null, 2) + "\n",
);
fs.writeFileSync(
  "docs/UNTESTED_RECIPES_MM.md",
  "# ဖျော်စမ်းရန်စာရင်း — 2026-11-07\n\nဤ update တွင် မည်သည့် recipe ကိုမှ လက်တွေ့ဖျော်စမ်းမထားပါ။ အောက်ပါ source-unverified များကို ဆိုင်မရောင်းမီ စမ်းသပ်ရန်လိုသည်။\n\n" +
    records
      .filter((x) => x.trial)
      .map(
        (x) =>
          `- ${x.menuNumber || x.id} — ${x.name}${x.unknownMass.length ? " — g ပြန်တိုင်းရန်: " + x.unknownMass.join("၊ ") : ""}`,
      )
      .join("\n") +
    "\n",
);
console.log(
  JSON.stringify(
    { ...report, records: undefined, researchSources: undefined },
    null,
    2,
  ),
);
