import type { Recipe } from "./model";
import { isPreparation } from "./preparations";

export const researchSources = [
  {
    label:
      "SCA — Published standards (signature recipe စံနှုန်းအဖြစ် မသုံးထား)",
    url: "https://sca.coffee/research/coffee-standards",
  },
  {
    label: "SCA — Espresso definition သမိုင်းနှင့် ပြောင်းလဲမှု",
    url: "https://sca.coffee/sca-news/25-magazine/issue-3/defining-ever-changing-espresso-25-magazine-issue-3-zyx36",
  },
  {
    label: "La Marzocco — Milk steaming / microfoam",
    url: "https://www.lamarzocco.com/it/en/how-to-steam-milk/",
  },
  {
    label: "Ippodo — Usucha 2 g / 60 ml / 80°C (latte formula မဟုတ်)",
    url: "https://global.ippodo-tea.co.jp/blogs/tea-recipe/basic-usucha-matcha",
  },
  {
    label: "FDA — အအေးထိန်းခြင်းနှင့် အပြင်ထားနိုင်ချိန်",
    url: "https://www.fda.gov/food/buy-store-serve-safe-food/refrigerator-thermometers-cold-facts-about-food-safety",
  },
  {
    label: "FDA — Pasteurized egg သုံးရန်",
    url: "https://www.fda.gov/food/buy-store-serve-safe-food/what-you-need-know-about-egg-safety",
  },
  {
    label: "Oreo / Mondelēz — Allergen ကို မိမိ label မှစစ်ရန်",
    url: "https://smartlabel.mondelez.info/044000047009-0002-en-US/index.html",
  },
];
const round = (n: number) => Math.round(n * 100) / 100;
// No dry coffee, spent tea, unknown-density syrup, alternatives, or ranges can masquerade as exact finished mass.
export function ingredientMetric(i: Recipe["ingredients"][number]) {
  const n = i.name,
    q = i.quantity;
  const processOnly =
    /ကော်ဖီ.*မှုန့်|ကော်ဖီစေ့|ground coffee|coffee powder|coffee (?:dose|grounds|beans)|အရွက်ခြောက်|tea leaves/i.test(
      n,
    );
  const ambiguous =
    /\d\s*[–-]\s*\d|အနည်းငယ်|လိုသလောက်|အလိုက်|optional/i.test(q) ||
    /\/|သို့မဟုတ်/.test(n);
  const m = q.match(/^\s*(\d+(?:\.\d+)?)\s*(g|ml)\b/i);
  const g = !ambiguous && m && m[2].toLowerCase() === "g" ? Number(m[1]) : null;
  const ml =
    !ambiguous && m && m[2].toLowerCase() === "ml" ? Number(m[1]) : null;
  const plainMilk =
    /နို့အေး|နို့ပူ|whole milk|fresh milk|steamed milk/i.test(n) &&
    !/ဆီ|cream|powder|မှုန့်|\/|သို့မဟုတ်/.test(n);
  const water =
    /^သောက်ရေ|^ရေနွေး|^ရေအေး|^ရေသန့်|^ဆိုဒါရေ|^soda water|^water$/i.test(n);
  return {
    name: n,
    original: q,
    g,
    ml,
    processOnly,
    approximateG:
      g === null && ml !== null && (plainMilk || water)
        ? round(ml * (plainMilk ? 1.03 : 1))
        : null,
    approximateMl:
      g !== null && plainMilk
        ? round(g / 1.03)
        : g !== null && water
          ? g
          : null,
    reason: processOnly
      ? "ထုတ်ယူရန် input — စစ်ထုတ်ပြီး drink total ထဲမပေါင်း"
      : ambiguous
        ? "ရွေးချယ်မှု/အပိုင်းအခြားရှိ — တစ်ပမာဏ အတည်ပြုရန်"
        : g !== null
          ? "g ဖြင့်ချိန်ထားသော input"
          : ml !== null
            ? "ml မူရင်း — brand သိပ်သည်းဆဖြင့် g ပြန်တိုင်းရန်"
            : "ပမာဏ/ယူနစ် မပြည့်စုံ — ချိန်တိုင်းရန်",
  };
}
export function massAudit(r: Recipe) {
  const rows = r.ingredients.map(ingredientMetric),
    included = rows.filter((x) => !x.processOnly);
  const knownG = round(included.reduce((s, x) => s + (x.g ?? 0), 0));
  const unresolved = included.filter((x) => x.g === null).map((x) => x.name);
  const extractionLoss =
    /V60|Pour Over|French Press|AeroPress|Moka|Cold Brew|Filter Coffee|Cold Drip|Turkish|Tubruk|Tea|Tarik|Hojicha|Genmaicha|Cascara|Chamomile|Hibiscus/i.test(
      r.englishName,
    ) && !r.id.startsWith("upgrade-");
  const cookingLoss = isPreparation(r) && r.categoryId !== "prep-foam";
  return {
    rows,
    knownG,
    unresolved,
    exactInputG: unresolved.length ? null : knownG,
    finishedG:
      unresolved.length || extractionLoss || cookingLoss ? null : knownG,
    yieldWarning:
      extractionLoss || cookingLoss
        ? "စစ်ထုတ်ခြင်း/ကျိုခြင်းကြောင့် input mass သည် actual finished yield မဟုတ်ပါ။ ပြီးမှပြန်ချိန်ပါ။"
        : "အထက်ပါ total သည် input mass ဖြစ်ပြီး spill/jug loss/ရေခဲပျော်နှုန်းကို မတိုင်းထားပါ။",
  };
}
export function qualityFor(r: Recipe) {
  const n = r.englishName,
    all = n + " " + r.ingredients.map((i) => i.name).join(" ");
  const prep = isPreparation(r),
    iced = r.ingredients.some((i) => /ရေခဲ|^ice$/i.test(i.name)),
    blended = /frapp[eé]|smoothie/i.test(n);
  const coffee =
    !!r.espressoDose ||
    r.ingredients.some((i) => /espresso|double shot/i.test(i.name));
  const milk = /နို့|milk|cream|yogurt|ဒိန်ချဉ်/i.test(all),
    fruit =
      /berry|lychee|passion|lemon|lime|orange|mango|pineapple|fruit|သံပ|အသီး/i.test(
        all,
      );
  const matcha = /matcha/i.test(all),
    soda = /soda|tonic|ဆိုဒါ/i.test(all),
    cookie = /oreo|biscuit/i.test(all),
    chocolate = /chocolate|cocoa|ချောကလက်/i.test(all);
  const sweet = r.ingredients.filter((i) =>
    /syrup|sauce|concentrate|purée|puree|သကြား|နို့ဆီ|honey/i.test(i.name),
  );
  const mode = prep
    ? "Preparation"
    : blended
      ? "Blended"
      : iced
        ? "Iced"
        : "Hot / မူရင်းအပူအအေး ပြန်စစ်ရန်";
  let serving = prep
    ? "Batch ပမာဏ — ခွက်အရွယ်မဟုတ်"
    : iced
      ? "16 oz ≈ 473 ml ခွက်ဆံ့ပမာဏ။ အရည် + ရေခဲ + လွတ်နေရာကို လက်တွေ့စမ်းရန်"
      : r.cupSizes.length
        ? r.cupSizes.join(" / ") + " oz မူရင်းခွက်"
        : "မူရင်းခွက်အရွယ် မပါ — စမ်းသပ်အတည်ပြုရန်";
  if (!iced && /latte/i.test(n))
    serving =
      "အဆိုပြု serving: 8 oz ခွက် (US 8 oz ≈ 237 ml; ဆိုင်သုံး 240–260 ml ခွက်ကို ရေဖြည့်တိုင်းပါ)။ မူရင်းပမာဏကို မပြောင်းထားပါ။";
  if (!iced && /cappuccino/i.test(n))
    serving =
      "အဆိုပြု serving: 150–180 ml cappuccino ခွက်။ မူရင်း 12 oz ပမာဏကို မပြောင်းထားပါ။ Microfoam ဖြင့် မဆံ့လျှင် သီးခြား trial ပြုလုပ်ပါ။";
  if (!iced && /^(Hot (Double )?Espresso|Ristretto|Doppio Ristretto)$/i.test(n))
    serving =
      "Espresso 60–90 ml အပူခံခွက်ကို စမ်းသုံးရန်။ 32 g yield သည် crema ပါ volume နှင့် မတူပါ။";
  const flavor = [
    ["အချို", sweet.length || cookie ? 3 : milk ? 2 : 1],
    ["အချဉ်", fruit ? 4 : coffee ? 2 : 1],
    ["အခါး", coffee || matcha ? 3 : chocolate ? 2 : 1],
    ["Body — ထူထဲမှု", milk || cookie ? 4 : fruit ? 2 : 1],
    ["Creaminess — နို့ဆန်မှု", milk ? 4 : 1],
    ["ကော်ဖီပြင်းအား", coffee ? (milk ? 3 : 5) : 1],
  ] as [string, number][];
  const aroma =
    [
      coffee ? "bean/roast အလိုက် ကော်ဖီအနံ့" : "",
      matcha ? "လက်ဖက်စိမ်းအနံ့" : "",
      chocolate ? "cocoa အနံ့" : "",
      cookie ? "ဘီစကစ်အနံ့" : "",
      fruit ? "အသီးရနံ့" : "",
      /vanilla/i.test(all) ? "ဗနီလာ" : "",
      /taro/i.test(all) ? "ပိန်းဥ premix အနံ့" : "",
      /caramel/i.test(all) ? "ကာရာမယ်" : "",
    ]
      .filter(Boolean)
      .join("၊ ") || "ပါဝင်ပစ္စည်း label နှင့် လတ်ဆတ်မှုအလိုက် ပြောင်းလဲသည်";
  const adjustments = [
    sweet.length
      ? `${sweet[0].name} ကို တစ်ခွက်လျှင် 2 g တိုးပြီး ပြန်စမ်းပါ။ concentrate ဆို အချဉ်လည်းတိုးနိုင်သောကြောင့် အချိုတိုးရန် 1:1 syrup 2 g သီးခြား trial သုံးနိုင်သည်။`
      : "မူရင်းအချိုမပါပါက 1:1 simple syrup 2 g စီတိုးသော trial ကို သီးခြားမှတ်တမ်းရေးပါ။",
    "ချိုလွန်းလျှင် နောက်ခွက်တွင် sweetener 2–5 g လျှော့ပါ။ ဖျော်ပြီးသားထဲ ရေအများထည့်၍ မဖုံးကွယ်ပါနှင့်။ ဆိုင် standard ပြောင်းလျှင် version မှတ်တမ်းတင်ပါ။",
    coffee
      ? "Coffee ပိုပြင်းရန် syrup 2 g သို့မဟုတ် နို့/ရေ 10 g လျှော့သော trial စပါ။ Extra shot လိုလျှင် 16 g → 32 g သီးခြားထုတ်ပြီး volume/ကဖိန်းတိုးမှုကို အသိပေးပါ။ basket ထဲ 18 g ကို အလိုအလျောက်မထည့်ပါနှင့်။"
      : "ကော်ဖီမပါ recipe ဖြစ်သည်။ Shot ထပ်ထည့်ခြင်းကို recipe အသစ်အဖြစ်သာ သီးခြားစမ်းပါ။",
    milk
      ? "နို့ပိုထင်ရန် နောက်ခွက်တွင် နို့ 10 g တိုး၊ ရေပါလျှင် ရေ 10 g လျှော့စမ်းပါ။ စုစုပေါင်း g၊ ခွက်ဆံ့ပမာဏ၊ အချဉ်အသီးနှင့် နို့အဖတ်ဖြစ်မှုကို ပြန်စစ်ပါ။"
      : "နို့မပါ recipe ဖြစ်သည်။ နို့ထည့်ခြင်းက texture/allergen နှင့် acidity ကို ပြောင်းလဲမည်။ တိုက်ရိုက်အစားမထိုးပါနှင့်။",
    coffee
      ? "အချဉ်လွန်လျှင် bean လတ်ဆတ်မှု၊ channeling၊ 32 g yield နှင့် အချိန်ကို စစ်ပါ။ မြန်လွန်းသော shot ကို grinder အနည်းငယ်စိပ်၍ ပြန်ထုတ်စမ်းပါ။ ခါးလွန်လျှင် အပူလွန်/နှေးလွန်း/ညစ်ပတ်မှုစစ်၊ grinder တစ်ဆင့်ကြမ်းစမ်းပါ။ အရသာတစ်ခုတည်းဖြင့် extraction diagnosis မဆုံးဖြတ်ပါနှင့်။"
      : fruit
        ? "အချဉ်လွန်လျှင် concentrate 2 g လျှော့၊ syrup 2 g တိုးသည့် trial ကို တစ်ကြိမ်တစ်မျိုးစမ်းပါ။ Brand အချို/အချဉ်အချိုး label ကို စစ်ပါ။"
        : matcha
          ? "ခါးလွန်လျှင် matcha အဟောင်း/ရေပူလွန်မှုစစ်၊ 75–80°C ရေဖြင့် စစ်ပြီးဖျော်ပါ။ နောက်ခွက် powder 0.5 g လျှော့သော trial မှတ်တမ်းရေးပါ။"
          : "ခါးလွန်လျှင် cocoa/powder brand နှင့် dose စစ်၊ အပိုင်းတစ်မျိုးကို 1 g လျှော့စမ်းပါ။",
    iced
      ? "ရေခဲအလေးချိန်၊ အရွယ်၊ အစအပူချိန်ကို တူအောင်ထားပါ။ Base အေးထားပြီး ချက်ချင်းတည်ခင်းပါ။ 0 / 5 / 10 min အရသာကို စမ်း၍ dilution မှတ်တမ်းရေးပါ။ ရေခဲကို ပိုတင်ခြင်းဖြင့် အရသာပြန်ပြင်းမလာပါ။"
      : "အပူချိန်ကျပြီးနောက် အရသာကို ပြန်စမ်းပါ။ ပြန်ပူဖျော်ထားသောနို့နှင့် မရောပါနှင့်။",
  ];
  const issues = massAudit(r).unresolved.map(
    (x) => `${x} — exact g မအတည်ပြုရသေး`,
  );
  if (!r.burmeseName) issues.push("မြန်မာအမည် မပါရှိသေး");
  if (!r.menuNumber)
    issues.push("မူရင်း menu number မပါ — ID ကို လက်ရှိနံပါတ်အဖြစ်ပြထားသည်");
  if (!iced && /latte|cappuccino|espresso/i.test(n))
    issues.push(
      "မူရင်း serving size နှင့် အဆိုပြုဆိုင်သုံး size ကို taste/fit test ပြုလုပ်ရန်",
    );
  if (/blue/i.test(all))
    issues.push("Blue ၏ အရသာ/အသီးမျိုးကို brand label မရမချင်း မအတည်ပြုနိုင်");
  return {
    mode,
    serving,
    coffee,
    milk,
    matcha,
    soda,
    prep,
    difficulty:
      blended || matcha || coffee || prep
        ? "အလယ်အလတ် — technique လေ့ကျင့်ရန်"
        : "အစပြုသူ",
    time: /cold brew|cold drip/i.test(n)
      ? "ကြိုနှပ်ချိန်ကို မူရင်းအဆင့်မှစစ်ပါ; service 2–4 min ခန့်"
      : prep
        ? "လုပ်ငန်းစဉ်အလိုက် ကွာခြား — မူရင်းအချိန်စစ်ရန်"
        : "3–5 min ခန့် (လက်တွေ့မတိုင်းရသေး)",
    origin:
      "ဤ exact formula ၏ မူရင်းနိုင်ငံကို အတည်မပြုရသေး။ နိုင်ငံတကာစာမျက်နှာသည် style discovery သာဖြစ်သည်။",
    status:
      r.verification === "owner-tested"
        ? "ပိုင်ရှင်အတည်ပြု မူရင်း"
        : "Professional Trial / မူရင်းအချက်အလက် အတည်ပြုရန်ကျန်",
    flavor,
    aroma,
    aftertaste: coffee
      ? "ကော်ဖီ roast အလိုက် cocoa/roast အရသာကျန်နိုင်; ခြောက်သွေ့ခါးကြမ်းမှုကို trial တွင်စစ်"
      : matcha
        ? "လက်ဖက်စိမ်းအနံ့ကျန်မှုနှင့် astringency ကိုစမ်းရန်"
        : fruit
          ? "အသီးရနံ့၊ အချိုအချဉ်ကျန်မှုကို brand အလိုက်စမ်းရန်"
          : "နို့/ဗနီလာ/cocoa သို့မဟုတ် မူရင်းပစ္စည်းရနံ့ကျန်မှုကိုစမ်းရန်",
    expected: coffee
      ? milk
        ? "နို့၏ချိုနူးမှုကြား ကော်ဖီသိသာ၊ အခါးကြမ်းနှင့် syrup လွှမ်းမိုးမှုမရှိရန် ရည်မှန်း"
        : "ကော်ဖီ aroma ရှင်း၊ အခါးအချဉ်ကို roast နှင့်အညီ ရည်မှန်း"
      : matcha
        ? "Matcha ရနံ့မြင်သာ၊ အဖုအခဲမရှိ၊ နို့/အသီးက လက်ဖက်အနံ့မဖုံးရန် ရည်မှန်း"
        : soda
          ? "အသီးရနံ့၊ အချိုအချဉ်နှင့် gas ညီ၊ အောက်ခြေ concentrate မကျန်ရန် ရည်မှန်း"
          : "အဓိကပစ္စည်းရနံ့နှင့် texture မြင်သာ၊ အချိုမလွှမ်းရန် ရည်မှန်း",
    adjustments,
    issues,
    allergens: [
      milk ? "နို့/cream (lactose၊ milk protein)" : "",
      cookie ? "Oreo: wheat/gluten၊ soy နှင့် label ပေါ်ရှိ cross-contact" : "",
      /egg|ကြက်ဥ/i.test(all) ? "ကြက်ဥ — pasteurized သာ" : "",
      /nut|almond|hazelnut|pistachio/i.test(all) ? "အခွံမာသီး" : "",
      /soy/i.test(all) ? "soy" : "",
    ].filter(Boolean),
    temperature: iced
      ? "တည်ခင်းစဉ် ≤5°C ကို trial target ထားပြီး thermometer ဖြင့်စစ်ပါ; အအေးသိမ်းရန် ≤4°C"
      : milk
        ? "နို့ steaming 55–65°C ကို ဆိုင် trial target ထားပါ; အလွန်ပူ၍ လောင်နိုင်မှုကို အသိပေးပါ"
        : "မူရင်း brew temperature နှင့် serving temperature သီးခြားစစ်ပါ။ ပူလောင်မှုမဖြစ်ရန် အပူခံခွက်သုံးပါ။",
    texture: milk
      ? iced
        ? "အဖုမရှိ၊ foam ပါလျှင် ပျော့ပျောင်း၍စီးနိုင်၊ သီးခြား oil မပေါ်ရန်"
        : "Latte microfoam 5–10 mm / cappuccino 10–20 mm ကို ဆိုင် trial ရည်မှန်းချက်ထား၍ လေဖောင်းကြီးမရှိ၊ glossy အရည်နှင့်ညီရန်"
      : soda
        ? "အမြှုပ်ဖောင်းလွန်ခြင်းမရှိ၊ gas ကျန်၊ purée ပျံ့နှံ့ညီရန်"
        : "မူရင်း method နှင့်ကိုက်ညီသော ရှင်းလင်းမှု/texture ကိုစမ်းရန်",
  };
}
export const microfoamSteps = [
  "CRM3605 ကို ထုတ်လုပ်သူညွှန်ကြားချက်အတိုင်း steam mode အပူတက်သည်အထိ စောင့်ပါ။ Cold pasteurized milk ကို သန့်ရှင်းအေးသော pitcher ထဲ ချိန်၍ headroom ချန်ပါ။",
  "Steam wand ကို လူဘက်မညွှန်ဘဲ drip tray ထဲ purge လုပ်၍ ကျန်ရေထုတ်ပါ။ Tip ကို နို့မျက်နှာပြင်အောက်အနည်းငယ်တွင် ဘေးစောင်းထားပါ။",
  "Steam ဖွင့်ပြီး tip အနီး လေကို အနည်းငယ်ဝင်စေပါ။ Latte အတွက် ခဏသာ၊ cappuccino အတွက် အနည်းငယ်ပိုကြာစေပါ။ အော်သံကျယ်/ဖောင်းကြီးဖြစ်လျှင် tip နေရာကို ပြန်ညှိပါ။",
  "နို့နွေးလာချိန် tip ကို နည်းနည်းမြှုပ်၍ whirlpool ဖြစ်အောင် လှည့်ပါ။ 55–65°C ဆိုင် trial target ကို thermometer ဖြင့်စစ်ပြီး steam ပိတ်မှ pitcher ထုတ်ပါ။ ထပ်ခါထပ်ခါ နို့ပြန်မပူပါနှင့်။",
  "Wand ကို သန့်ရှင်းသော အဝတ်စိုဖြင့် ချက်ချင်းသုတ်၊ ပြန် purge လုပ်ပါ။ Pitcher ကို ခပ်ညင်ညင်တစ်ချက်ခေါက်၍ဖောင်းကြီးဖယ်၊ လှည့်ပြီး glossy texture ကို espresso ထဲချက်ချင်းလောင်းပါ။ Brew ပြန်မထုတ်မီ စက်လက်စွဲအတိုင်း brew mode အပူချိန်ပြန်ညှိပါ။",
];
