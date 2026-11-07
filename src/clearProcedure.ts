import type { Recipe } from "./model";
import { isPreparation } from "./preparations";

type Row = Recipe["ingredients"][number];
const label = (i: Row) => `${i.name} ${i.quantity}`;
const clean = (s: string) => s.replace(/^\s*\d+[.)။]\s*/, "").trim();
// Split Burmese sentences, never decimal quantities, ranges, or temperatures.
export function shortSteps(steps: string[]) {
  return steps.flatMap((s) =>
    clean(s)
      .split(/။\s*/)
      .map((x) => x.trim())
      .filter(Boolean)
      .map((x) => x + "။"),
  );
}
export const brewingWords = [
  [
    "g / ml",
    "g ကို ချိန်ခွင်နဲ့ချိန်ပါ။ ml ကို အရည်တိုင်းခွက်နဲ့တိုင်းပါ။ ပျစ်ရည်နဲ့နို့မှာ g နဲ့ ml မတူပါ။",
  ],
  [
    "TARE / ZERO",
    "ခွက်အလွတ်ကို ချိန်ခွင်ပေါ်တင်ပြီး ဒီခလုတ်နှိပ်ပါ။ 0 g ပြမယ်။ ပစ္စည်းတစ်မျိုးထပ်ထည့်မီ ပြန်နှိပ်ရင် အသစ်ထည့်တဲ့ပစ္စည်းအလေးချိန်ကိုပဲ ဖတ်လို့ရပါတယ်။",
  ],
  [
    "Espresso / Dose / Yield",
    "Espresso က စက်နဲ့ထုတ်တဲ့ ကော်ဖီအနှစ်ရည်ပါ။ Dose က ထုတ်ဖို့သုံးတဲ့ ကော်ဖီမှုန့်အလေးချိန်၊ Yield က ခွက်ထဲထွက်လာတဲ့ ကော်ဖီရည်အလေးချိန်ပါ။ 16 g မှုန့်ကို အဖျော်ရည်ထဲ မထည့်ရပါ။",
  ],
  [
    "Syrup / Sauce / Concentrate / Purée",
    "Syrup = အချိုရည်၊ Sauce = ပျစ်တဲ့ဆော့စ်၊ Concentrate = ပြန်ရောသောက်ရတဲ့ အသီးရည်အပြင်း၊ Purée = အသီးအနှစ်ပါ။ တစ်ခုနဲ့တစ်ခု ပမာဏတူ အစားမထိုးပါနဲ့။",
  ],
  [
    "Cold Foam / Whipping Cream",
    "Whipping cream က ဝယ်သုံးတဲ့ နို့မလိုင်အရည်ပါ။ Cold foam က နို့မလိုင်၊ နို့၊ အချိုကို စာရင်းအတိုင်းရောပြီး လက်ကိုင်အမြှုပ်စက်နဲ့ ခတ်ထားတဲ့ အအေးအမြှုပ်ပါ။",
  ],
  [
    "Steam Wand / Microfoam",
    "Steam wand က စက်ဘေးက နို့ပူဖောက်တဲ့ ရေနွေးငွေ့ပိုက်ပါ။ Microfoam က ပူဖောက်ပြီးရတဲ့ ပူဖောင်းသေးသေးညီညီ၊ တောက်ပြောင်ချောမွေ့တဲ့ နို့အမြှုပ်ပါ။",
  ],
  [
    "Layer / Garnish",
    "Layer က အရောင်အလွှာခွဲပြီး လောင်းတာပါ။ မွှေသောက်ရန်/မမွှေသောက်ရန်ကို မီနူးညွှန်ကြားချက်အတိုင်းလိုက်ပါ။ Dirty Coffee ကို မမွှေရပါ။ Garnish က အလှတင်ပစ္စည်းပါ။ စာရင်းထဲမပါရင် အပိုမထည့်ပါနဲ့။",
  ],
];

function expansionSteps(r: Recipe): string[] {
  const rows = r.ingredients;
  const find = (rx: RegExp) => rows.find((i) => rx.test(i.name));
  const by = (rx: RegExp) => rows.filter((i) => rx.test(i.name));
  const milk = find(/^နို့အေး/),
    ice = find(/^ရေခဲ$/),
    espresso = find(/^Espresso$/);
  const taro = find(/^Taro Powder/),
    matcha = find(/^Matcha Powder/);
  const oreo = find(/^Oreo Biscuit/),
    foam = find(/Cold Foam Base/);
  const sweet = by(/Syrup|Sauce/),
    fruit = by(/Concentrate|Purée/);
  if (r.categoryId === "prep-foam") {
    return [
      "လက်ဆေးပြီး သန့်ရှင်းတဲ့ ခွက်ရှည်၊ ဇွန်း၊ ချိန်ခွင်နဲ့ လက်ကိုင်အမြှုပ်စက် ပြင်ပါ။",
      "နို့မလိုင်နဲ့နို့ကို 4°C အောက် အေးထားပါ။ အပူမပေးရပါ။",
      ...rows.map(
        (i) =>
          `ခွက်ရှည်ကို ချိန်ခွင်ပေါ်တင်၊ TARE နှိပ်ပြီး ${label(i)} ထည့်ပါ။`,
      ),
      "ဇွန်းနဲ့ 10 စက္ကန့် မွှေပါ။",
      "အမြှုပ်စက်ခေါင်းကို အရည်ထဲမြှုပ်ပြီး စဖွင့်ပါ။ 15–25 စက္ကန့်ခန့် ခတ်ပါ။",
      "ဇွန်းကနေ ဖြည်းဖြည်းစီးကျတဲ့ နို့အမြှုပ်ပျစ်ပျစ်ရရင် ရပ်ပါ။ ထောပတ်လို ခဲတဲ့အထိ မခတ်ပါနဲ့။",
      "ဒါက စုစုပေါင်း 100 g ပါဝင်ပစ္စည်းနဲ့လုပ်တဲ့ အမြှုပ်တစ်ဘူးစာပါ။ အဖျော်ရည်တစ်ခွက်ပေါ် တင်ရမယ့် 40 g နဲ့ မရောထွေးပါနဲ့။",
      "သုံးမယ့်အမြှုပ်ကို သီးခြားချိန်ယူပါ။ ကျန်တာကို ဖုံးအုပ်၊ အချိန်ရေး၊ 4°C အောက်ထားပြီး ထိုနေ့အတွင်းသုံးပါ။ ပစ္စည်း label က ပိုတိုတဲ့သိမ်းချိန်သတ်မှတ်ရင် အဲဒီအတိုင်းလိုက်ပါ။",
    ];
  }
  const steps = [
    "လက်ဆေးပြီး 16 oz အအေးသောက်ခွက်၊ ချိန်ခွင်၊ ဇွန်းနဲ့ ဖျော်ခွက်ငယ် ပြင်ပါ။",
  ];
  if (r.categoryId === "upgrade-soda") {
    for (const i of fruit)
      steps.push(
        `အအေးသောက်ခွက်ကို ချိန်ခွင်ပေါ်တင်၊ TARE နှိပ်ပြီး ${label(i)} ထည့်ပါ။`,
      );
    const soda = find(/ဆိုဒါ/)!;
    steps.push(`${label(soda)} ကို သီးခြားချိန်ထားပါ။`);
    steps.push(
      "ချိန်ထားတဲ့ ဆိုဒါထဲက 20 g ကို အသီးရည်ထဲထည့်ပြီး ဇွန်းနဲ့ ဖြည်းဖြည်းမွှေပါ။ ဆိုဒါအသစ် 20 g ထပ်ယူတာ မဟုတ်ပါ။",
    );
    steps.push(`TARE နှိပ်ပြီး ${label(ice!)} ထည့်ပါ။`);
    steps.push("ချိန်ထားတဲ့ဆိုဒါထဲက ကျန် 140 g ကို ဖြည်းဖြည်းလောင်းထည့်ပါ။");
    steps.push(
      "ဇွန်းနဲ့ အောက်ခြေကနေ အပေါ်ကို ညင်သာစွာ မွှေပါ။ အဖုံးပိတ်ပြီး မလှုပ်ပါနဲ့။ ချက်ချင်းတည်ခင်းပါ။",
    );
    if (r.englishName.includes("Blue"))
      steps.push(
        "Blue အသီးရည်ဘူးရဲ့ label ကို စစ်ပါ။ Blueberry လို့ အလိုအလျောက် မယူဆပါနဲ့။",
      );
    return steps;
  }
  if (espresso)
    steps.push(
      "စက် basket ထဲ ကော်ဖီမှုန့် 16 g ထည့်၊ ညီအောင်ဖြန့်ပြီး တည့်တည့်ဖိပါ။ သီးခြားခွက်ကို ချိန်ခွင်ပေါ်တင်၊ 0 g ပြန်ထားပြီး စက်ဖွင့်ပါ။",
    );
  if (espresso)
    steps.push(
      `${label(espresso)} ရလာရင် ရပ်ပါ။ စဖွင့်ချိန်ကနေ 25–30 စက္ကန့်က စတင်စမ်းသပ်ချက်ပါ။ ကော်ဖီမှုန့်ကို သောက်ခွက်ထဲ မထည့်ပါနဲ့။`,
    );
  if (taro) {
    const water = find(/ရေနွေး.*Taro/) || find(/^ရေနွေး$/)!;
    steps.push(`ဖျော်ခွက်ငယ်ထဲ ${label(taro)} ထည့်ပါ။`);
    steps.push(
      `${label(water)} ထည့်ပြီး ဇွန်းနဲ့ အဖုမကျန်အောင် မွှေပါ။ ဒါက Taro အနှစ်ရည်ပါ။`,
    );
  }
  if (matcha) {
    const water = find(/ရေနွေး.*(?:Matcha|75)/)!;
    steps.push(`သီးခြားဖျော်ခွက်ငယ်ထဲ ${label(matcha)} ကို ဇကာစစ်ထည့်ပါ။`);
    steps.push(`${label(water)} ထည့်ပါ။ ပွက်ပွက်ဆူရေ မသုံးပါနဲ့။`);
    steps.push(
      "လက်ကိုင်အမြှုပ်စက်ခေါင်းကို အရည်ထဲမြှုပ်ပြီး 15–20 စက္ကန့်ခန့် ခတ်ပါ။ အဖုမရှိတဲ့ အစိမ်းရောင် Matcha ရည်ဖြစ်ရင် ရပ်ပါ။",
    );
  }
  if (oreo)
    steps.push(
      `${label(oreo)} ကို cream ပါအပါအဝင် ချိန်ပါ။ သန့်ရှင်းတဲ့အိတ်ထဲထည့်ပြီး 2–4 mm အစိတ်လေးတွေဖြစ်အောင် ခွဲထားပါ။`,
    );
  for (const i of fruit)
    steps.push(
      `သောက်ခွက်ကို ချိန်ခွင်ပေါ်တင်၊ TARE နှိပ်ပြီး ${label(i)} ကို အောက်ခြေမှာထည့်ပါ။`,
    );
  if (taro)
    steps.push("ဖျော်ထားတဲ့ Taro အနှစ်ရည်အားလုံးကို သောက်ခွက်ထဲ လောင်းထည့်ပါ။");
  if (oreo)
    steps.push(
      "ချိန်ပြီးခွဲထားတဲ့ Oreo အားလုံးကို သောက်ခွက်အောက်ခြေမှာ ထည့်ပါ။ အလှတင်ဖို့ Oreo အပို မယူပါနဲ့။",
    );
  for (const i of sweet) {
    if (espresso && /Sauce/.test(i.name))
      steps.push(
        `ဖျော်ထားတဲ့ Espresso ထဲ ${label(i)} ထည့်ပြီး ဇွန်းနဲ့ ပျော်အောင်မွှေပါ။`,
      );
    else steps.push(`နို့တိုင်းမယ့် သီးခြားခွက်ထဲ ${label(i)} ထည့်ပါ။`);
  }
  if (milk)
    steps.push(
      `သီးခြားခွက်ကို ချိန်ခွင်ပေါ်တင်၊ TARE နှိပ်ပြီး ${label(milk)} ထည့်ပါ။${sweet.some((i) => !espresso || !/Sauce/.test(i.name)) ? " ထည့်ထားတဲ့အချိုရည်နဲ့ ဇွန်းဖြင့်မွှေပါ။" : ""}`,
    );
  if (milk) steps.push("ချိန်ထားတဲ့နို့ကို သောက်ခွက်ထဲ ဖြည်းဖြည်းလောင်းပါ။");
  if (ice)
    steps.push(
      `သောက်ခွက်ကို ချိန်ခွင်ပေါ်ပြန်တင်၊ TARE နှိပ်ပြီး ${label(ice)} ထည့်ပါ။`,
    );
  if (espresso)
    steps.push(
      "ပြင်ထားတဲ့ Espresso ရည်အားလုံးကို ရေခဲပေါ်ကနေ ဖြည်းဖြည်းလောင်းပါ။",
    );
  if (matcha)
    steps.push(
      "ဖျော်ထားတဲ့ Matcha ရည်အားလုံးကို ဇွန်းနောက်ကျောပေါ်ကနေ ဖြည်းဖြည်းလောင်းထည့်ပါ။",
    );
  if (foam)
    steps.push(
      `${label(foam)} ကို သီးခြားချိန်ပြီး အပေါ်ဆုံးမှာ ဇွန်းနဲ့တင်ပါ။ CF-01 / CF-02 က ကြိုဖျော်ထားတဲ့ နို့အမြှုပ်အမည်ပါ။ Whipping cream အလွတ် 40 g မဟုတ်ပါ။`,
    );
  steps.push(
    "အဖုံးအတွက် ခွက်အပေါ်မှာ နေရာချန်ပါ။ မဆံ့ရင် အတင်းမဖိဘဲ ခွက်နဲ့ပမာဏကို ပြန်စစ်ပါ။",
  );
  steps.push(
    "သောက်ခါနီး အောက်ခြေအထိ မွှေပါ။ နို့အဖတ်ဖြစ်တာ၊ အနံ့မမှန်တာ တွေ့ရင် မသောက်၊ မရောင်းပါနဲ့။ လတ်လတ်ဆတ်ဆတ် တည်ခင်းပါ။",
  );
  return steps;
}

export function getClearProcedure(r: Recipe) {
  if (r.id.startsWith("upgrade-")) return expansionSteps(r);
  const seen = new Set<string>();
  const source = r.steps.map(clean).filter((s) => {
    // Repeated takeaway packing instructions obscure the actual mixing order.
    if (
      /Cup Carrier|Tissue|အော်ဒါအမည်|ခွက်အပြင်ဘက်|အိတ်ထဲ|အဖုံးကို ပတ်လည်/i.test(
        s,
      )
    )
      return false;
    if (seen.has(s)) return false;
    seen.add(s);
    return true;
  });
  const milk = r.ingredients.find(
    (i) =>
      /နို့|milk/i.test(i.name) &&
      !/နို့ဆီ|condensed|cream|ဒိန်ချဉ်|yogurt/i.test(i.name),
  );
  const simple = shortSteps(source.length ? source : r.steps).flatMap((s) => {
    if (milk && /Steam Wand/i.test(s) && /55–65/.test(s))
      return [
        `${label(milk)} ကို သန့်ရှင်းတဲ့ နို့ဖျော်ခွက်ထဲ တိုင်းထည့်ပါ။ အပေါ်မှာ အမြှုပ်တက်ဖို့ နေရာချန်ပါ။`,
        "စက်လက်စွဲအတိုင်း နို့ပူဖောက်မည့် steam mode ပြောင်းပြီး အပူတက်သည်အထိ စောင့်ပါ။",
        "ရေနွေးငွေ့ပိုက်ကို လူနဲ့ဝေးရာ drip tray ဘက်ညွှန်ပါ။ ခဏဖွင့်ပြီး ကျန်နေတဲ့ရေကို ထုတ်၊ ပြန်ပိတ်ပါ။",
        "ပိုက်ထိပ်ကို နို့မျက်နှာပြင်အောက် အနည်းငယ်မြှုပ်ပြီး steam ဖွင့်ပါ။ နို့ထဲကို လေအနည်းငယ်ဝင်အောင် လုပ်ပါ။ ပူဖောင်းအကြီးကြီး မဖြစ်စေပါနဲ့။",
        "နို့နွေးလာရင် ပိုက်ထိပ်ကို နည်းနည်းပိုမြှုပ်ပါ။ နို့ကို ခွက်ထဲမှာ ဝဲလည်စေပြီး အမြှုပ်ချောမွေ့အောင် လုပ်ပါ။",
        "အပူချိန်တိုင်းကိရိယာနဲ့ 55–65°C ရောက်တာစစ်ပါ။ steam အရင်ပိတ်ပြီးမှ နို့ခွက်ကို ဖယ်ပါ။ ပိုက်ကို လက်နဲ့ မထိပါနဲ့။",
        "ပိုက်ကို သန့်ရှင်းတဲ့ အဝတ်စိုနဲ့သုတ်ပါ။ drip tray ဘက်မှာ steam ခဏပြန်ဖွင့်ပြီး ပိုက်ထဲကျန်နို့ကို ရှင်းပါ။",
        "နို့ဖျော်ခွက်ကို ညင်သာစွာလှည့်ပါ။ အမြှုပ်က သေးသေးညီညီနဲ့ နို့ရည်တောက်ပြောင်ရပါမယ်။",
      ];
    return [s];
  });
  return simple.map((s) =>
    s.replace(
      /Espresso\s+16\s*g\s*→\s*32\s*g/g,
      "ကော်ဖီမှုန့် 16 g နဲ့ စက်ကနေ Espresso ကော်ဖီရည် 32 g",
    ),
  );
}
