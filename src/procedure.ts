import type { Recipe } from "./model";
import { isPreparation } from "./preparations";

type Row = Recipe["ingredients"][number];
const clean = (s: string) => s.replace(/^\s*\d+[.)။]\s*/, "").trim();
const list = (rows: Row[]) =>
  rows.map((i) => `${i.name} ${i.quantity}`).join("၊ ");
const iceRow = (i: Row) =>
  /ရေခဲ|\bice\b/i.test(i.name) && !/မုန့်|cream/i.test(i.name);
const carbonated = (i: Row) =>
  /ဆိုဒါ|soda|tonic|sparkling|ginger beer/i.test(i.name);
const coffeeRow = (i: Row) => /espresso|double shot/i.test(i.name);
const milkRow = (i: Row) => /နို့|milk|yogurt|ဒိန်ချဉ်/i.test(i.name);
const powderRow = (i: Row) =>
  /မှုန့်|powder|အရွက်|leaves|ground coffee|ကော်ဖီစေ့/i.test(i.name);
const toppingRow = (i: Row) =>
  /whipped cream|cold foam|cream foam|ရေခဲမုန့်|ice cream/i.test(i.name);
const packaging =
  /Cup Carrier|Tissue|စုပ်တံ|အော်ဒါအမည်|ခွက်အပြင်|အိတ်ထဲ|အဖုံးကို ပတ်လည်/i;

export function recipeFamily(r: Recipe) {
  const n = r.englishName;
  if (isPreparation(r)) return r.categoryId;
  if (/Matcha/i.test(n)) return "matcha";
  if (/Frappe|Frappé|Smoothie|Yogurt/i.test(n)) return "blended";
  if (
    r.ingredients.some(carbonated) ||
    /Soda|Mojito|Mocktail|Sunrise|Punch|Sparkler/i.test(n)
  )
    return "refreshers";
  if (/Cold Brew/i.test(n)) return "cold-brew";
  if (/V60|French Press|AeroPress|Moka Pot|Filter Coffee|Cold Drip/i.test(n))
    return "manual-brew";
  if (r.ingredients.some(coffeeRow) || r.line === "barista")
    return /Latte|Milk|Cream|Mocha|Cappuccino|Cortado|Piccolo|Breve/i.test(n)
      ? "milk-coffee"
      : "black-coffee";
  if (/Tea|Hojicha|Genmaicha|Tarik|Chamomile|Cascara|Hibiscus/i.test(n))
    return "tea";
  return "milk-fruit";
}
export const familyNames: Record<string, string> = {
  matcha: "Matcha စတိုင်များ",
  blended: "Smoothie / Frappé / Yogurt",
  refreshers: "Soda / Mocktail / Refresher",
  "cold-brew": "Cold Brew စတိုင်များ",
  "manual-brew": "Manual Brew စတိုင်များ",
  "milk-coffee": "နို့ကော်ဖီနှင့် Cream စတိုင်များ",
  "black-coffee": "Black Coffee / Espresso စတိုင်များ",
  tea: "Tea Bar စတိုင်များ",
  "milk-fruit": "နို့နှင့်သစ်သီးအအေးစတိုင်များ",
  "prep-syrup": "Syrup အခြေခံများ",
  "prep-sauce": "Sauce အခြေခံများ",
  "prep-concentrate": "Fruit Concentrate အခြေခံများ",
  "prep-puree": "Fruit Purée အခြေခံများ",
};
export function relatedStyles(recipe: Recipe, all: Recipe[]) {
  return all.filter(
    (r) => r.id !== recipe.id && recipeFamily(r) === recipeFamily(recipe),
  );
}

export function getProcedure(r: Recipe) {
  const n = r.englishName;
  const ice = r.ingredients.filter(iceRow),
    soda = r.ingredients.filter(carbonated),
    espresso = r.ingredients.filter(coffeeRow);
  const dairy = r.ingredients.filter(milkRow),
    powders = r.ingredients.filter(powderRow),
    toppings = r.ingredients.filter(toppingRow);
  const steamMilk = dairy.filter(
    (i) => !/နို့ဆီ|condensed|cream|ဒိန်ချဉ်|yogurt/i.test(i.name),
  );
  const thermalSource =
    n +
    " " +
    r.ingredients.map((i) => i.name).join(" ") +
    " " +
    r.steps.join(" ");
  const hot =
    !ice.length &&
    !/Dirty Coffee|Affogato/i.test(n) &&
    /Hot |Turkish|Café de Olla|Ristretto|Lungo|Cortado|Piccolo|Gibraltar|Breve|Con Panna|Macchiato|Noisette|Bicerin|Marocchino|Bombón|Romano|Cubano|ရေပူ|ရေနွေး|နို့အပူ|နို့ပူ|steam/i.test(
      thermalSource,
    );
  const warnings: string[] = [];
  if (!r.cupSizes.length && !isPreparation(r))
    warnings.push(
      "မူရင်းတွင် ခွက်အရွယ် မသတ်မှတ်ထားပါ။ အောက်ပါခွက်သည် V2 အဆိုပြုစမ်းသပ်ခွက်သာဖြစ်သည်။ ပမာဏမပြောင်းဘဲ လက်တွေ့ဆံ့မှုကို စစ်ဆေးရန်လိုသည်။",
    );
  if (r.ingredients.some((i) => /\d\s*[–-]\s*\d/.test(i.quantity)))
    warnings.push(
      "မူရင်းပမာဏအချို့သည် အပိုင်းအခြားဖြစ်သည်။ ပထမစမ်းသပ်မှုတွင် ရေခဲကို အများဆုံးဘက်၊ အချိုကို အနည်းဆုံးဘက်မှ စပါ။ ရွေးထားသည့်တိကျသောပမာဏကို မှတ်တမ်းတင်ပြီး နောက်ခွက်များ၌ တူညီစွာသုံးပါ။ မူရင်းစာရင်း၏အပိုင်းအခြားကို မပြောင်းထားပါ။",
    );
  if (
    r.ingredients.some((i) =>
      /Menu အလိုက်|\/|သင့်တော်သလို|လိုသလောက်|as needed|to taste/i.test(
        i.name + " " + i.quantity,
      ),
    )
  )
    warnings.push(
      "မူရင်းပါ ရွေးချယ်စရာပစ္စည်း / ပမာဏ မရှင်းလင်းမှုကို မီနူးအမည်နှင့် မူရင်းညွှန်ကြားချက်ဖြင့် စစ်ပါ။ မရှင်းလင်းသေးပါက ဆိုင်ရောင်း recipe အဖြစ် မအတည်ပြုပါနှင့်။",
    );
  if (r.ingredients.some((i) => /ကြက်ဥ|egg/i.test(i.name)))
    warnings.push(
      "Pasteurized ကြက်ဥအနှစ် / egg product ကိုသာ သုံးပါ။ ရိုးရိုးအစိမ်းဥကို မသုံးပါနှင့်။ ပူသောကော်ဖီလောင်းရုံဖြင့် ပိုးသတ်ပြီးဟု မယူဆပါနှင့်။ Pasteurized မရပါက ဤမီနူးကို မရောင်းပါနှင့်။",
    );
  if (isPreparation(r) || /^(matcha-|style-)/.test(r.id))
    return {
      method: "အသေးစိတ် စမ်းသပ်ဖျော်နည်း",
      steps: r.steps.map(clean),
      warnings,
      proposedCup: null,
    };
  const proposedCup = r.cupSizes.length
    ? null
    : hot
      ? /V60|French|Olla|Lait/.test(n)
        ? 12
        : 8
      : 16;
  const cup = r.cupSizes.length
    ? r.cupSizes.map((s) => `${s} oz`).join(" / ")
    : `အဆိုပြု ${proposedCup} oz`;
  const steps: string[] = [
    `${cup} ${hot ? "အပူခံ" : "အအေးသောက်"}ခွက်၊ ချိန်ခွင်၊ ml တိုင်းခွက်၊ သန့်ရှင်းသောဖျော်ခွက်နှင့် ဇွန်းကို ပြင်ပါ။ ရေခဲကို လက်ဖြင့်မကိုင်ဘဲ scoop သုံးပါ။`,
    "အောက်ပါပစ္စည်းတစ်ခုချင်းကို ကြိုချိန်ပြင်ပါ။ g အတွက် ချိန်ခွင် tare / zero ကို သုံးပြီး ml အတွက် မျက်လုံးအမြင့်တည့်တည့်မှ graduation ကို ဖတ်ပါ။ Syrup / sauce ကဲ့သို့ပျစ်ရည်ကို အပြီးသတ်ခွက်ထဲ တိုက်ရိုက်ချိန်ခြင်းက ခွက်ကူးရာတွင်ကျန်ရစ်မှုကို လျှော့ပေးသည်။",
    ...r.ingredients.map(
      (i) =>
        `ချိန်ပြင်ရန် — ${i.name}: ${i.quantity}။ ဤသည် မူရင်းတစ်ခွက်စာပမာဏဖြစ်သည်။ အခြားခွက်ထဲ ခွဲယူပြီး ပြန်ပေါင်းလျှင် စုစုပေါင်း မကျော်စေရ။`,
    ),
  ];
  const espressoStep = () => {
    if (!espresso.length) return;
    const target = r.espressoYield || list(espresso);
    steps.push(
      `Espresso ကို သီးခြား shot glass ထဲ အရင်ထုတ်ပါ။ ထည့်မည့်ပမာဏမှာ ${target} ဖြစ်သည်။ 32 g double shot မီနူးအတွက် ဆိုင် baseline 16 g ကော်ဖီ → 32 g Espresso၊ 25–30 စက္ကန့်ကို စမှတ်ယူပါ။ Ristretto / Lungo ကဲ့သို့ yield ကွာသော မီနူးတွင် မူရင်း yield ကိုသာ လိုက်ပါ။`,
    );
    steps.push(
      "Portafilter ကို သန့်ရှင်းခြောက်သွေ့စွာပြင်၍ ကော်ဖီညီအောင်ဖြန့်၊ တည့်တည့် tamp လုပ်ပါ။ ချိန်ခွင်နှင့် timer သုံး၍ ရည်ထွက်ပမာဏကို စစ်ပါ။ မူရင်းရည်ထွက်ပမာဏပြည့်လျှင် ရပ်ပြီး နို့ / ရေ ပမာဏကို ကော်ဖီမကောင်းမှုဖုံးကွယ်ရန် မပြောင်းပါနှင့်။",
    );
  };
  let method = "အရည်ရောဖျော်ခြင်း";
  if (/Dalgona/i.test(n)) {
    method = "Dalgona အမြှုပ်ခတ်ခြင်း";
    steps.push(
      "Instant coffee၊ သကြားနှင့် စာရင်းပါ ရေနွေးပမာဏကို သီးခြားအဖွင့်ဖျော်ခွက်ထဲ ထည့်ပါ။ Instant coffee ကို espresso / coffee grounds ဖြင့် မအစားထိုးပါနှင့်။",
      "Whisk / handheld frother ခေါင်းကို အရည်အောက်မြှုပ်ပြီး စတင်ပါ။ 2–5 မိနစ်ကို စမ်းသပ်စမှတ်ယူကာ အရောင်ဖျော့၊ ပျစ်ပြီး ခေါင်းထောင်သော foam ရသည်အထိ ခတ်ပါ။ စက်မော်ဒယ်နှင့်အချိုးပေါ် မူတည်၍ အချိန်ကွာနိုင်သည်။",
      /Matcha/i.test(n)
        ? "Matcha powder ကို သီးခြားဇကာချပြီး Matcha အတွက် သတ်မှတ်ထားသော ရေ 30 ml နှင့်သာ အဖုမရှိအောင် ဖျော်ပါ။ Dalgona အတွက် ရေနွေး 12 ml နှင့် ဤရေ 30 ml ကို မပေါင်းမှားပါနှင့်။ နို့အေးနှင့် Matcha ရည်ကို ရောပါ။"
        : "စာရင်းပါ နို့ကို အေးအေးထား၍ တိုင်းယူပါ။ Foam ခတ်ရာ၌ နို့အားလုံးကို ကြိုမရောပါနှင့်။",
      `ပေးမည့်ခွက်ထဲ ${list(ice)} ထည့်ပြီး ပြင်ထားသောနို့အရောကို လောင်းပါ။ ကော်ဖီ foam ကို နောက်ဆုံးမှ ဇွန်းဖြင့် အပေါ်တင်ပါ။`,
    );
  } else if (/Turkish Coffee/i.test(n)) {
    method = "Cezve ဖြင့် Turkish Coffee";
    steps.push(
      "Cezve ထဲ စာရင်းပါ ရေအေး၊ အလွန်နူးညံ့သော ကော်ဖီမှုန့်နှင့် ရွေးထားသောသကြားပမာဏကို ထည့်၍ အဖုမကျန်အောင် ရောပါ။ Espresso စက် / paper filter မသုံးပါနှင့်။",
      "မီးအနိမ့်ဖြင့် ဖြည်းဖြည်းအပူပေးပါ။ အမြှုပ်တက်ပြီး နှုတ်ခမ်းဆီတက်လာလျှင် မီးမှဖယ်ပါ။ အားပြင်းပြင်းပွက်ပွက်ဆူအောင် မထားပါနှင့်။ အမြှုပ်လျှံနိုင်၍ မျက်နှာနှင့်လက်ကို ဖယ်ထားပါ။",
      "အပူခံခွက်ထဲ အမြှုပ်နှင့်ရည်ကို ဖြည်းဖြည်းလောင်းပါ။ အဖတ်ကျရန် 30–60 စက္ကန့်ကို အဆိုပြုစမှတ်ထားပါ။ ကော်ဖီအဖတ်ကို ရောပြီး အတင်းသောက်ရန် မညွှန်ကြားပါနှင့်။",
    );
  } else if (
    /V60|French Press|AeroPress|Moka Pot|Filter Coffee|Cold Drip|Café de Olla|Kopi Tubruk/i.test(
      n,
    )
  ) {
    method = "သီးသန့် Brew နည်း";
    steps.push(
      "ဤမီနူး၏ ကော်ဖီ / ရေစုစုပေါင်းကို မပြောင်းပါနှင့်။ Filter ဆေးရန်သုံးသောရေကို သောက်မည့်ခွက်ထဲ မကျန်စေဘဲ စွန့်ပြီးမှ မူရင်းဖျော်ရေကို တိုင်းပါ။",
    );
    if (/V60|Filter Coffee/i.test(n))
      steps.push(
        "Paper filter ကို dripper ထဲ ချ၊ ဆေးရေစွန့်၍ သတ်မှတ်ကော်ဖီထည့်ပါ။ ချိန်ခွင် tare နှိပ်ပြီး မူရင်းအဆင့်ပါ bloom ရေ / အချိန်နှင့် စုစုပေါင်းရေကို လိုက်ပါ။ ရေလောင်းသည့်တိုင်း စုစုပေါင်းကို ချိန်ပါ။",
      );
    if (/French Press|Kopi Tubruk/i.test(n))
      steps.push(
        "Coffee grounds ထဲ ရေကို မူရင်းပမာဏအတိုင်းထည့်၍ အားလုံးစိုစွတ်အောင် ညင်သာစွာမွှေပါ။ မူရင်းနှပ်ချိန်ကို timer ဖြင့် စစ်ပါ။ French press ကို နှိပ်ရာတွင် မအားပြင်းစေဘဲ ဖြည်းဖြည်းနှိပ်၍ ရည်ကို ချက်ချင်း ခွဲလောင်းပါ။",
      );
    if (/AeroPress/i.test(n))
      steps.push(
        "အစပြုသူအတွက် filter cap ကို လုံအောင်တပ်ထားသော upright နည်းသုံးပါ။ အပူခံတည်ငြိမ်သောခွက်ပေါ်တင်၍ မူရင်းကော်ဖီ / ရေ / နှပ်ချိန်အတိုင်းလုပ်ပါ။ ပူသောရည်ပါစက်ကို အပေါ်အောက်လှန်ခြင်း မလုပ်ပါနှင့်။ နှိပ်ရာတွင် တဖြည်းဖြည်းသာ ဖိပါ။",
      );
    if (/Moka Pot/i.test(n))
      steps.push(
        "စက်ထုတ်လုပ်သူ၏ safety valve၊ basket နှင့် ရေပမာဏညွှန်ကြားချက်ကို ဦးစားပေးပါ။ ကော်ဖီကို tamp မလုပ်၊ safety valve ကို ရေဖြင့်မမြှုပ်ပါနှင့်။ ပူနေစဉ် စက်ကို မဖွင့်ပါနှင့်။ မူရင်းစာရင်းနှင့် စက် capacity မကိုက်ပါက ဤမီနူးကို ဆက်မဖျော်မီ စစ်ဆေးပါ။",
      );
    steps.push(...r.steps.map(clean).filter((s) => !packaging.test(s)));
    steps.push(
      "စစ်ရန်လိုသောနည်းတွင် grounds / အရွက် / သစ်ကြံပိုးကို သတ်မှတ်အတိုင်း စစ်ဖယ်ပါ။ အရည်ပိုထွက်သည်ဟု သတ်မှတ်ခွက်ပမာဏကိုကျော် မလောင်းပါနှင့်။",
    );
  } else if (/Cold Brew/i.test(n)) {
    method = "Cold Brew အခြေခံရည် အသုံးပြုခြင်း";
    steps.push(
      "Cold brew concentrate သည် အသင့်နှပ်ပြီးစစ်ထားသော အခြေခံရည်ဖြစ်သည်။ မူရင်းစမ်းသပ်နည်းအတိုင်း ပြင်ထားသော base ကိုသာ သုံးပါ။ ရိုးရိုးအရည်ဖျော့ coffee / espresso ဖြင့် ပမာဏတူ မအစားထိုးပါနှင့်။",
      "မူရင်းပါ base နှပ်ခြင်းနှင့်စစ်ခြင်းညွှန်ကြားချက်ကို လိုက်ပါ။ အအေးခန်းတွင် သန့်ရှင်းစွာပြင်ပြီး သတ်မှတ် concentrate ပမာဏကိုသာ ဤတစ်ခွက်အတွက် တိုင်းယူပါ။",
      `ပေးမည့်ခွက်ထဲ ${list(ice)} ထည့်ပါ။ Concentrate နှင့် စာရင်းပါ ရေ / နို့ / သစ်သီးရည်ကို သီးခြားတိုင်း၍ ပေါင်းထည့်ပါ။`,
    );
    if (soda.length)
      steps.push(
        `ဆိုဒါပါဝင်သော ${list(soda)} ကို နောက်ဆုံးမှ ဖြည်းဖြည်းလောင်းပါ။ ပိတ်မရှိတ်၊ blender မသုံးပါနှင့်။`,
      );
    if (toppings.length)
      steps.push(
        `${list(toppings)} ကို နောက်ဆုံးမှ အပေါ်တင်ပါ။ Foam အတွက် နို့ / cream အသစ် ထပ်မခန့်မှန်းပါနှင့်။`,
      );
    steps.push(
      "ဤခွက်ထဲသို့ raw coffee grounds၊ နှပ်ပြီးအဖတ် သို့မဟုတ် မသတ်မှတ်ထားသောရေ မထည့်ပါနှင့်။",
    );
  } else if (/Egg Coffee/i.test(n)) {
    method = "Pasteurized Egg Cream Coffee";
    espressoStep();
    steps.push(
      "သန့်ရှင်းသောအဖွင့်ဖျော်ခွက်ထဲ pasteurized egg yolk / egg product ကို မူရင်းသတ်မှတ်တစ်လုံးစာနှင့် ကိုက်ညီသောပမာဏယူပါ။ နို့ဆီကို စာရင်းပါအတိုင်း တိုင်းထည့်ပါ။",
      "သန့်ရှင်းသော whisk ဖြင့် ပျစ်ဖျော့ပြီး foam ဖြစ်လာသည်အထိ ခတ်ပါ။ ခတ်ချိန်ကိုသာကြည့်၍ ပိုးသတ်ပြီးဟု မယူဆပါနှင့်။ မဖွင့်ရသေးသော pasteurized ပစ္စည်း၏ အညွှန်းနှင့် အအေးထိန်းစည်းကမ်းကို လိုက်ပါ။",
      "သတ်မှတ် Espresso ရည်အပေါ် egg cream ကို ဇွန်းဖြင့်တင်ပါ။ ချက်ချင်းသုံးဆောင်ရန်ပေးပြီး ပြင်ပြီးသား egg cream ကို နောက်အော်ဒါအတွက် ချန်မထားပါနှင့်။",
    );
  } else if (soda.length) {
    method = "ဆိုဒါ / Sparkling / Mocktail";
    espressoStep();
    if (/Mojito|Mint/i.test(n))
      steps.push(
        "စာရင်းတွင် Mint ပါမှသာ သန့်ရှင်းသောအရွက်ကို ပေးမည့်ခွက်ထဲ ထည့်၍ 2–3 ကြိမ် ညင်သာစွာ ဖိပါ။ အရွက်ကို အမှုန့်ဖြစ်အောင် မချေပါနှင့်။",
      );
    steps.push(
      "စာရင်းပါ syrup၊ purée နှင့် သစ်သီးရည်ကို အောက်ခြေခွက်ထဲ သတ်မှတ်ပမာဏအတိုင်း ရောပါ။ Concentrate၊ purée နှင့် syrup တို့ကို ပမာဏတူ အစားမထိုးပါနှင့်။",
      `ရေခဲ ${list(ice)} ကို တိုက်ရိုက်ချိန်ထည့်ပါ။ ရေခဲမှအရည်ပျော်ရေကို အပိုမထည့်ပါနှင့်။`,
      `${list(soda)} ကို အေးအေးထား၍ နောက်ဆုံးမှ ခွက်ဘေးက ဖြည်းဖြည်းလောင်းပါ။ အမြှုပ်တက်လျှင် ခဏရပ်ပါ။ ခွက်ထိပ်နေရာ ချန်ထားပါ။`,
    );
    if (espresso.length)
      steps.push(
        "ပြင်ထားသော Espresso ကို ဆိုဒါအပေါ် ဇွန်းကျောမှ ဖြည်းဖြည်းလောင်းပါ။ တစ်ခါတည်း အားပြင်းပြင်းမလောင်းပါနှင့်။",
      );
    steps.push(
      "ဇွန်းရှည်ဖြင့် အောက်ခြေမှ အပေါ်သို့ 2–3 ကြိမ်သာ ဖြည်းဖြည်းရောပါ။ ဆိုဒါကို blender ထဲ မကြိတ်၊ အဖုံးပိတ် shaker ထဲ မရှိတ်ပါနှင့်။",
    );
  } else if (
    /Frappe|Frappé|Smoothie|Piña Colada|Yogurt/i.test(n) ||
    r.ingredients.some((i) => /ဒိန်ချဉ်|yogurt/i.test(i.name))
  ) {
    method = "Blender ဖြင့် ဖျော်ရေခဲ / Smoothie";
    espressoStep();
    steps.push(
      "Ice-crushing အတွက် ထုတ်လုပ်သူခွင့်ပြုထားသော blender ကို သုံးပါ။ အရည်အရင်၊ သကြားရည် / powder / အသီးနောက်၊ ရေခဲနောက်ဆုံး ဟူသောအစဉ်ဖြင့် ထည့်ပါ။ ရေခဲပမာဏသည် သောက်ခွက်ထဲထပ်ထည့်ရန် မဟုတ်ဘဲ blender ထဲသုံးမည့် စုစုပေါင်းဖြစ်သည်။",
      "ပူသော Espresso / tea ကို အရင်အေးသွားအောင်ထားပါ။ အဖုံးပိတ် blender ထဲ ပူသောရည် မထည့်ပါနှင့်။ Soda / tonic မထည့်ပါနှင့်။",
      "စာရင်းပါ အရည်၊ အသီး၊ syrup နှင့် powder ပမာဏအားလုံး ထည့်ပြီးမှ ရေခဲထည့်ပါ။ MAX အမှတ်မကျော်ကြောင်း စစ်၍ အဖုံးလုံအောင်ပိတ်ပါ။",
      "Low speed 5 စက္ကန့်၊ ထို့နောက် high speed 20 စက္ကန့်ခန့်ကို စမ်းသပ်စမှတ်ထားပါ။ အရည်ညီပြီး ရေခဲတုံးကြီးမကျန်သည်ကို စစ်ပါ။ စက်လုံးဝရပ်မှ အဖုံးဖွင့်ပါ။",
      "လိုလျှင် 5 စက္ကန့်စီ ထပ်ကြိတ်ပါ။ Blender မလည်ခြင်းကို အပိုနို့ / ရေထပ်ဖြည့်၍ အချိုးမပြောင်းပါနှင့်။ စက်ကိုရပ်၊ မီးဖြုတ်ပြီးမှ ထုတ်လုပ်သူညွှန်ကြားချက်အတိုင်း ပြင်ပါ။",
      "ခွက်ထဲ ချက်ချင်းလောင်းပါ။ စာရင်းတွင် topping ပါမှ နောက်ဆုံးတင်ပါ။ Frappe powder / whipped cream ကို စာရင်းမပါဘဲ အလိုအလျောက် မထည့်ပါနှင့်။",
    );
  } else if (/Matcha/i.test(n)) {
    method = "Matcha ကို အဖုမရှိအောင် ဖျော်ခြင်း";
    steps.push(
      `Matcha powder ကို စာရင်းပါ g အတိုင်း ချိန်၍ ဇကာချပါ။ Premix ကို pure matcha ပမာဏနှင့် တူသည်ဟု မယူဆပါနှင့်။`,
      "စာရင်းပါ Matcha ဖျော်ရေကို 75–80°C ခန့်ပြင်ပါ။ ထိုရေထဲမှ အနည်းငယ်ဖြင့် powder ကို ပျစ်ရုံ အရင်မွှေပြီးမှ ကျန်သတ်မှတ်ရေကို ထည့်ပါ။ အပိုရေမထည့်ပါနှင့်။",
      "Whisk ကို W ပုံစံခတ်၍ သို့မဟုတ် frother ခေါင်းကို အရည်အောက်မြှုပ်၍ 15–20 စက္ကန့်ခန့် ခတ်ပါ။ အဖုခြောက်မကျန်ကြောင်း စစ်ပါ။",
    );
    if (hot)
      steps.push(
        `နို့ပါလျှင် ${list(dairy)} ကို 55–65°C ခန့်သာ အပူပေးပါ။ နို့မဆူစေဘဲ Matcha ရည်ထဲ ဖြည်းဖြည်းပေါင်းပါ။`,
      );
    else
      steps.push(
        `စာရင်းပါ syrup / နို့ကို ပေးမည့်ခွက်ထဲ ရောပါ။ ${list(ice)} ထည့်ပြီး Matcha ရည်ကို အပေါ်မှ ဖြည်းဖြည်းလောင်းပါ။ နို့ထပ်မဖြည့်ဘဲ စာရင်းပါ စုစုပေါင်းကို ထိန်းပါ။`,
      );
    steps.push(
      "အလွှာလိုက်တင်ထားပါက သောက်မီ အောက်ခြေအထိ ရောမွှေရန် ပြောပါ။ Matcha အရသာပြင်းခြင်းကို သကြားထပ်ထည့်ပြီး မဖုံးကွယ်ဘဲ စမ်းသပ်ရလဒ်ကို မှတ်ပါ။",
    );
  } else if (/Dirty Coffee/i.test(n)) {
    method = "အလွန်အေးသောနို့ပေါ် Espresso တိုက်ရိုက်ထုတ်ခြင်း";
    steps.push(
      `အအေးခံထားသောခွက်သေးထဲ ${list(dairy)} တိုင်းထည့်ပါ။ ရေခဲမထည့်၊ နို့ကို steam မလုပ်ပါနှင့်။ နို့နှင့်ခွက်ကို အလွန်အေးအောင် ကြိုပြင်ပါ။`,
    );
    espressoStep();
    steps.push(
      "မူရင်းအတိုင်း Espresso ကို နို့ပေါ် တိုက်ရိုက် extract လုပ်ပါ။ ပူသော Espresso နှင့် နို့အေးအလွှာကို ထိန်းရန် မမွှေဘဲ ချက်ချင်းတည်ခင်းပါ။ နို့အပို မထည့်ပါနှင့်။",
    );
  } else if (/Café Cubano/i.test(n)) {
    method = "Cubano သကြားအမြှုပ်";
    espressoStep();
    steps.push(
      "စာရင်းပါ သကြားကို ခွက်သေးထဲ ချိန်ထည့်ပါ။ ထုတ်စ Espresso ရည်အနည်းငယ်ကို သတ်မှတ် yield စုစုပေါင်းထဲမှ ယူ၍ သကြားနှင့် ပြင်းပြင်းမွှေပါ။ သီးခြား Espresso အပိုမထုတ်ပါနှင့်။",
      "အရောင်ဖျော့သော သကြားအမြှုပ်အနှစ်ရလျှင် ကျန်သတ်မှတ် Espresso ကို ဖြည်းဖြည်းထည့်ပါ။ အပူခံခွက်သေးထဲ ချက်ချင်းပေးပါ။ နို့နှင့် ရေခဲ မထည့်ပါနှင့်။",
    );
  } else if (espresso.length) {
    method = hot
      ? "Espresso နှင့် အပူနို့ / ရေ ပေါင်းခြင်း"
      : /Shakerato|Freddo/i.test(n)
        ? "အအေး Espresso ခတ်ခြင်း"
        : "Espresso အလွှာလိုက် ပေါင်းခြင်း";
    espressoStep();
    if (/Shakerato|Freddo/i.test(n))
      steps.push(
        "Espresso နှင့် စာရင်းပါသကြား / syrup ကို အဖွင့်ဖျော်ခွက်ထဲ အရင်မွှေပါ။ အပူလျော့ပြီးမှ ရေခဲနှင့်အတူ shaker / frother သုံးပါ။ ပူသောရည်ကို အဖုံးပိတ်မရှိတ်ပါနှင့်။ မူရင်းခတ်ခြင်း၊ စစ်လောင်းခြင်းအဆင့်ကို လိုက်ပါ။",
      );
    if (hot && steamMilk.length)
      steps.push(
        `နို့အရည်ကို ${list(steamMilk)} အတိုင်း တိုင်း၍ သန့်ရှင်းသော jug ထဲ ထည့်ပါ။ Steam wand ကို အရင် purge လုပ်ပြီး 55–65°C အထိ အပူပေးပါ။ နို့ဆူအောင် မလုပ်ပါနှင့်။ Handheld frother သည် နို့ကို အပူမပေးသောကြောင့် သီးခြားအပူထိန်းစစ်ဆေးရန်လိုသည်။`,
        "Steam wand ကို သုံးပြီးချက်ချင်း စိုသောသန့်ရှင်းအဝတ်ဖြင့်သုတ်၊ purge ပြန်လုပ်ပါ။ နို့ jug ကို ညင်သာစွာလှည့်၍ microfoam ညီအောင်လုပ်ပါ။ အမြှုပ်ကြီးများဖြစ်ပါက ပူလွန်းအောင် steam ထပ်မပေးပါနှင့်။",
      );
    steps.push(
      "စာရင်းပါ syrup / sauce / နို့ဆီကို သတ်မှတ်ပမာဏသာ သုံးပါ။ ပျစ်ရည်ဖြစ်ပါက သတ်မှတ်ထားသော Espresso သို့မဟုတ် နို့ပမာဏထဲမှ အနည်းငယ်ဖြင့် အရင်ပျော်အောင်မွှေပြီး ပြန်ပေါင်းပါ။ အပိုရေမထည့်ပါနှင့်။",
    );
    if (hot)
      steps.push(
        "အပူခံခွက်ထဲ Espresso ထည့်ပြီး စာရင်းပါ နို့ / ရေနွေးကို ဖြည်းဖြည်းပေါင်းပါ။ ရေပို / နို့ပိုဖြင့် ခွက်ပြည့်အောင် အလိုအလျောက်မဖြည့်ပါနှင့်။ ပမာဏသေးသော Espresso ကို ခွက်အကြီးထဲ ဖျော်သော်လည်း yield မပြောင်းပါနှင့်။",
      );
    else
      steps.push(
        `ပေးမည့်ခွက်ထဲ စာရင်းပါ နို့ / ရေ / သစ်သီးရည်ကို ထည့်ပြီး ${list(ice)} ချိန်ထည့်ပါ။ Espresso ကို ရေခဲပေါ် သို့မဟုတ် ဇွန်းကျောမှ နောက်ဆုံးဖြည်းဖြည်းလောင်းပါ။`,
      );
    if (toppings.length)
      steps.push(
        `${list(toppings)} ကို နောက်ဆုံး အပေါ်တင်ပါ။ Topping ကို နို့အရည်ပမာဏအဖြစ် မရောတွက်ပါနှင့်။`,
      );
    if (/Bicerin|Marocchino|Bombón|Con Panna|Affogato|Romano/i.test(n))
      steps.push(...r.steps.map(clean).filter((s) => !packaging.test(s)));
  } else if (
    /Tea|Hojicha|Genmaicha|Chamomile|Cascara|Hibiscus|Tarik/i.test(n) ||
    /category-(04|09|26)/.test(r.categoryId)
  ) {
    method = "လက်ဖက် / Cocoa / နို့ အခြေခံဖျော်ခြင်း";
    const hasLeaves = r.ingredients.some((i) =>
      /အရွက်|လက်ဖက်ခြောက်|leaves|cascara|ပန်းခြောက်/i.test(i.name),
    );
    steps.push(
      hasLeaves
        ? "အရွက် / ပန်းခြောက်ကို စာရင်းပါ ရေနှင့် သီးခြားနှပ်ခွက်ထဲ နှပ်ပါ။ Powder နှင့် အရွက်ကို ပမာဏတူ အစားမထိုးပါနှင့်။ အသုံးပြုသည့်အထုပ်ပါ အပူချိန် / နှပ်ချိန်ကို ဦးစားပေးပြီး မူရင်းပါ ချိန်ကို timer ဖြင့် စစ်ပါ။"
        : "အသင့်ဖျော် tea concentrate ပါလျှင် သတ်မှတ်ရည်ပမာဏကို တိုင်းယူပါ။ Powder ပါလျှင် စာရင်းပါ အရည်ထဲမှ အနည်းငယ်ဖြင့် အရင်ပျစ်အောင်မွှေပါ။ အပိုရေ / အပိုနို့ကို မခန့်မှန်းထည့်ပါနှင့်။",
    );
    if (hasLeaves)
      steps.push(
        "နှပ်ချိန်ပြည့်လျှင် အရွက် / ပန်းခြောက်ကို ဇကာဖြင့် စစ်ဖယ်ပါ။ စစ်ပြီးသား အရည်မည်မျှသုံးရန် မူရင်းတွင် မပါပါက မဆုံးဖြတ်ဘဲ စမ်းသပ်မှတ်တမ်းတင်ပါ။ စစ်ရည်ကို ခွက်ပြည့်အောင် မခန့်မှန်းဖြည့်ပါနှင့်။",
      );
    steps.push(
      "သကြား၊ ပျားရည် သို့မဟုတ် နို့ဆီပါမှ သတ်မှတ်ပမာဏအတိုင်း ပူနွေးသော tea ရည်ထဲ ပျော်အောင်မွှေပါ။ Lemon / သစ်သီးရည် ပါသည့်ရေဖျော်မီနူးကို နို့ဖျော်မီနူးနှင့် မရောမှားပါနှင့်။",
      ...r.steps
        .map(clean)
        .filter((s) => !packaging.test(s))
        .slice(0, 6),
    );
    steps.push(
      hot
        ? "အပူခံခွက်ထဲ သတ်မှတ်ပမာဏသာ ပေါင်းလောင်း၍ နို့ကို မဆူစေဘဲ အပူချိန်စစ်ပါ။ ရေခဲမထည့်ပါနှင့်။"
        : `အရည်အပူလျော့ပြီးမှ နို့ / သစ်သီးရည်တို့ကို စာရင်းအတိုင်း ပေါင်းပါ။ ပေးမည့်ခွက်ထဲ ${list(ice)} ထည့်၍ အရည်ကို ဖြည်းဖြည်းလောင်းပါ။`,
    );
  } else {
    method = "နို့ / အသီး / အရည်အခြေခံ ရောဖျော်ခြင်း";
    steps.push(
      `စာရင်းပါ အရည်ပစ္စည်းများကို သီးခြားတိုင်းပြီး ဖျော်ခွက်ထဲ ရောပါ။ ${powders.length ? `${list(powders)} ကို အရည်ထဲမှ အနည်းငယ်ဖြင့် အရင်ပျစ်ပျစ်လေးမွှေ၍ အဖုမကျန်မှ ပြန်ပေါင်းပါ။` : "ပျစ်ရည်ပါလျှင် ခွက်အောက်ခြေတွင် မကျန်အောင် ဖြည်းဖြည်းမွှေပါ။"}`,
      "လတ်ဆတ်သစ်သီးပါလျှင် ရေဆေး၊ အစေ့ / မစားရသောအပိုင်းဖယ်ပြီးမှ အသားပမာဏကို ချိန်ပါ။ Syrup၊ concentrate နှင့် purée ကို စာရင်းမတူဘဲ ပမာဏတူ မအစားထိုးပါနှင့်။",
      "အအေးရည်အရောကို အဖွင့်ဖျော်ခွက်ထဲ ဇွန်း / frother ဖြင့် 10–15 စက္ကန့်ကို စမှတ်ထား၍ ညီအောင်ရောပါ။ သစ်သီးအသားတုံးပါမီနူးကို blender မလိုဘဲ အလိုအလျောက်မကြိတ်ပါနှင့်။",
      `ပေးမည့်ခွက်ထဲ ${list(ice)} ကို ချိန်ထည့်ပြီး အရည်အရောကို လောင်းပါ။ အောက်ခြေကျန်ပျစ်ရည်ကို ဇွန်းဖြင့်ယူပြီး ပမာဏပြည့်စုံအောင် ထည့်ပါ။ အပိုရေမဖြည့်ပါနှင့်။`,
      ...r.steps
        .map(clean)
        .filter((s) => !packaging.test(s))
        .slice(0, 3),
    );
  }
  steps.push(
    "သန့်ရှင်းသောဇွန်းဖြင့် သီးသန့် sample ယူ၍ အရသာ၊ အပူချိန်နှင့် အဖု / အလွှာကို စစ်ပါ။ မသတ်မှတ်ဘဲ အချို / နို့ / ရေ ပေါင်းဖြည့်ခြင်း မလုပ်ပါနှင့်။ ပြင်မည့်ပမာဏကို နောက်စမ်းသပ် version အဖြစ် မှတ်တမ်းတင်ပါ။",
    "မူရင်းတွင် မမွှေရန်ညွှန်ကြားသည့် Dirty Coffee ကဲ့သို့ မီနူးများကို မမွှေပါနှင့်။ အခြားရောရန်လိုသော အလွှာဖျော်ရည်ဖြစ်ပါက သုံးဆောင်သူအား ပြောပါ။ ခွက်ထိပ်လျှံနေပါက ရေခဲ / အရည်ကို အလိုအလျောက်လျှော့ပြီး စံrecipe ဟု မသတ်မှတ်ဘဲ ခွက်ဆံ့မှုကို အရင်စစ်ပါ။",
    "ချက်ချင်းတည်ခင်းပါ။ သုံးပြီးသော jug၊ whisk / blender နှင့် ဇွန်းများကို ဆေးကြော၍ နို့နှင့် ဖွင့်ပြီးအခြေခံရည်များကို အအေးထိန်းရာသို့ ပြန်ထားပါ။",
  );
  return { method, steps, warnings, proposedCup };
}
