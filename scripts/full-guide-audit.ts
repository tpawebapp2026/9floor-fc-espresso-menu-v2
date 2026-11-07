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
    liquidChoiceRequired: g.liquidChoiceRequired,
    sourceResolutions: g.inputResolutions,
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
  sourceResolvedMenus: records.filter((r) => r.sourceResolutions.length).length,
  liquidChoiceMenus: records.filter((r) => r.liquidChoiceRequired).length,
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

const review = [
  "# 307 မီနူး လိုက်ဖျော်လမ်းညွှန် စစ်ဆေးချက်",
  "",
  "မူရင်း 307 မီနူးနှင့် ပစ္စည်းစာရင်း 1,216 တန်း မပြောင်းထားပါ။ လုပ်ဆောင်ရန်၊ စစ်ကြည့်ရန်၊ ခန့်မှန်းအရသာပစ်မှတ်နှင့် မူရင်းနည်းစနစ်ကို ပြထားသည်။",
  "",
  `အရင် audit 31 မျိုးကို မူရင်းအဆင့်အပြည့်ဖြင့် ပြန်စစ်ထားသည်။ မီနူး ${result.sourceResolvedMenus} မျိုး၏ နို့/ရေရွေးချယ်မှုကို မူရင်းစာသားအရ ရှင်းပြထားသည်။ Smoothie ${result.liquidChoiceMenus} မျိုးတွင် နို့ သို့မဟုတ် ရေ တစ်မျိုးရွေး၍ ဖျော်နိုင်သည်။ Mint ကို လက်ဖက်ခြောက်အဖြစ် မှားခွဲထားခြင်းကို ပြင်ထားသည်။`,
  "",
  "Thai Oliang ၏ ingredients ဇယားတွင် မပါသော ရေနွေး 220 ml ခန့်ကို မူရင်းအဆင့် 1 မှ ယူ၍ သီးခြားရှင်းပြထားသည်။ Input water နှင့် ထွက်ရည်ပမာဏ မတူကြောင်း ခွဲပြထားပြီး brand နှပ်နည်းကို စမ်းသပ်ရန် ကျန်သည်။ London Fog တွင် Twinings loose-leaf နှပ်ချိန်ကို brand ဥပမာအဖြစ်သာ ထည့်ထားသည်။",
  "",
  `အရင်အတည်ပြုရန် လိုသော မီနူး ${result.blockers} မျိုး ကျန်သည်။ 307 မျိုးလုံး အရသာစမ်းသပ်ပြီးဟု မဆိုလိုပါ။`,
  "",
  "| မီနူး | အရင်အတည်ပြုရန် |",
  "|---|---|",
];
for (const r of records) {
  const blockers = r.issues.filter((i) => i.level === "blocker");
  if (blockers.length)
    review.push(
      `| ${r.name} | ${blockers
        .map((i) => i.message)
        .join(" ")
        .replaceAll("|", " / ")} |`,
    );
}
review.push(
  "",
  "SCA standards စာရင်းကို မီနူးအားလုံး၏အရသာအချိုးအဖြစ် မသုံးထားပါ။ ဆိုင်သုံး 16 g → 32 g / 25–30 s သည် စတင်စမ်းသပ် baseline ဖြစ်သည်။ Brand၊ density၊ grind နှင့် အရသာကို လက်တွေ့စမ်းပြီးမှ ဆိုင်စံဖော်မြူလာအဖြစ် သတ်မှတ်ပါ။",
  "",
  "ရွေးထားသောနို့/ရေသည် ယခုဖွင့်ထားသောခွက်အတွက်သာဖြစ်ပြီး မူရင်း JSON ကို မပြောင်းပါ။ Favorites နှင့် menu IDs မပြောင်းပါ။",
);
writeFileSync("docs/FULL_GUIDE_REVIEW_MM.md", review.join("\n") + "\n");
