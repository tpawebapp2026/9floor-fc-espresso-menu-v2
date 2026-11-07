import type { Recipe } from "./model";
export type LiquidChoice = "milk" | "water";
export type InputResolution = {
  index: number;
  original: Recipe["ingredients"][number];
  resolved: Recipe["ingredients"][number];
  basis: string;
};
// These branches are explicitly written in the legacy source steps. The stored
// source record stays untouched; the reader sees which original branch is used.
export function resolveGuideInputs(r: Recipe, choice?: LiquidChoice) {
  const resolutions: InputResolution[] = [];
  const source = r.steps.join(" ");
  const smoothieChoice =
    /^v8-05-0[1-6]$/.test(r.id) &&
    r.ingredients.some((i) => /နို့အေး.*\/.*သောက်ရေ/.test(i.name));
  const ingredients = r.ingredients.map((i, index) => {
    let name: string | undefined,
      basis = "";
    if (
      /^v8-04-(?:0[1-9]|1[0-2])$/.test(r.id) &&
      /နို့အေး.*\/.*ရေအေး/.test(i.name) &&
      /^120 ml/.test(i.quantity) &&
      /နို့ပါသော Menu/.test(source) &&
      /Lemon\/Peach Tea/.test(source)
    ) {
      const water = /Lemon|Peach/.test(r.englishName);
      name = water ? "ရေအေး" : "နို့အေး";
      basis = water
        ? "မူရင်းအဆင့်က Lemon/Peach Tea တွင် ရေအေး 120 ml သုံးရန် ရေးထားသည်။"
        : "မူရင်းအဆင့်က နို့ပါသောမီနူးတွင် နို့အေး 120 ml သုံးရန် ရေးထားသည်။";
    } else if (
      /^v8-04-1[3-6]$/.test(r.id) &&
      /လိုအပ်သော Menu/.test(i.quantity) &&
      /^120 ml/.test(i.quantity) &&
      /နို့ပါသော Menu/.test(source)
    ) {
      name = "နို့ (အပူဖောက်ရန်)";
      basis =
        "မူရင်းအဆင့်က နို့ပါသောမီနူးတွင် နို့ 120 ml ကို သီးခြားအပူပေးရန် ရေးထားသည်။";
    } else if (
      smoothieChoice &&
      choice &&
      /နို့အေး.*\/.*သောက်ရေ/.test(i.name)
    ) {
      name = choice === "milk" ? "နို့အေး" : "သောက်ရေသန့်အေး";
      basis =
        "မူရင်းရွေးချယ်စရာ နှစ်မျိုးထဲမှ ဤခွက်အတွက် တစ်မျိုးသာ ရွေးထားသည်။ နို့နှင့်ရေကို နှစ်ဆမထည့်ရပါ။";
    }
    if (!name) return { ...i };
    const resolved = {
      name,
      quantity: i.quantity.replace(/\s*\(.*\)\s*$/, "").trim(),
    };
    resolutions.push({ index, original: { ...i }, resolved, basis });
    return resolved;
  });
  return {
    recipe: { ...r, ingredients },
    resolutions,
    liquidChoiceRequired: smoothieChoice,
    choice: smoothieChoice ? choice : undefined,
  };
}
