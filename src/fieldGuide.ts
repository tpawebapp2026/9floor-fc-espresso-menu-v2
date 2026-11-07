import type { Recipe } from "./model";
import { getClearProcedure, shortSteps } from "./clearProcedure";
import { isPreparation } from "./preparations";
import { massAudit } from "./quality";

type Row = Recipe["ingredients"][number];
export type GuideStep = {
  title: string;
  action: string;
  check: string;
  ingredientIndexes: number[];
};
export type GuideIssue = { level: "blocker" | "trial"; message: string };
export const guideSources = {
  sca: {
    label: "SCA — တရားဝင် standards စာရင်း",
    url: "https://sca.coffee/research/coffee-standards",
  },
  espresso: {
    label: "La Marzocco — Espresso / နို့ဖျော်နည်း (ထုတ်လုပ်သူလမ်းညွှန်)",
    url: "https://home.lamarzoccousa.com/the-essential-guide-to-mastering-espresso-at-home/",
  },
  matcha: {
    label: "Ippodo — Matcha latte နည်းစနစ် (ဤမီနူး၏အချိုးအဖြစ် ကူးမထား)",
    url: "https://global.ippodo-tea.co.jp/blogs/tea-recipe/matcha-latte",
  },
  v60: {
    label: "HARIO — V60 bloom / ရေလောင်းနည်း",
    url: "https://www.hario.co.uk/pages/brew-guides-v60-basic",
  },
  aeropress: {
    label: "AeroPress — စက်အသုံးပြုနည်း",
    url: "https://aeropress.com/pages/how-to-use",
  },
  moka: {
    label: "Bialetti — Moka safety valve / မဖိထည့်ရန်",
    url: "https://bialetti-cookware.zendesk.com/hc/en-us/articles/5416235346322-How-to-use-the-Moka-Express",
  },
  cold: {
    label: "FDA — အအေးထိန်းခြင်း",
    url: "https://www.fda.gov/food/buy-store-serve-safe-food/refrigerator-thermometers-cold-facts-about-food-safety",
  },
  egg: {
    label: "FDA — ကြက်ဥလုံခြုံရေး",
    url: "https://www.fda.gov/food/buy-store-serve-safe-food/what-you-need-know-about-egg-safety",
  },
};
type SourceKey = keyof typeof guideSources;
const text = (i: Row) => `${i.name} ${i.quantity || "(ပမာဏမပါ)"}`;
const number = (i: Row | undefined) =>
  i ? Number(i.quantity.match(/^\s*(\d+(?:\.\d+)?)/)?.[1] || 0) : 0;
const isGround = (i: Row) =>
  !/instant/i.test(i.name) &&
  /ကော်ဖီ.*မှုန့်|ကော်ဖီစေ့|ground coffee|coffee.*powder/i.test(i.name);
const isIce = (i: Row) =>
  /^(ရေခဲ|ice$)/i.test(i.name) && !/မုန့်|cream/i.test(i.name);
const isShot = (i: Row) =>
  !isGround(i) && /espresso|ထုတ်ယူ.*ကော်ဖီရည်/i.test(i.name);
const isSoda = (i: Row) =>
  /soda|tonic|sparkling|ginger ale|ginger beer|ဆိုဒါ/i.test(i.name);
const isWater = (i: Row) =>
  !isSoda(i) && /^(ရေ(?:ပူ|အေး|နွေး|သန့်|$)|သောက်ရေ)/.test(i.name);
const isLeaf = (i: Row) =>
  !/ရည်|powder|မှုန့်|အနှစ်|အေး|syrup/i.test(i.name) &&
  /tea|အရွက်|cascara|hibiscus|chamomile/i.test(i.name);
const isMatcha = (i: Row) =>
  /matcha/i.test(i.name) && /powder|မှုန့်/i.test(i.name);
const isPowder = (i: Row) =>
  !isGround(i) &&
  !isLeaf(i) &&
  /powder|မှုန့်/i.test(i.name) &&
  !/cardamom|ဖာလာ|သစ်ကြံပိုး|pumpkin spice/i.test(i.name);
const isMilk = (i: Row) =>
  /half-and-half/i.test(i.name) ||
  (!/နို့ဆီ|condensed|cream|အမြှုပ်|foam|ဒိန်ချဉ်|yogurt|powder|မှုန့်/i.test(
    i.name,
  ) &&
    /နို့|milk/i.test(i.name));
const isSweet = (i: Row) =>
  /syrup|sauce|သကြား|ပျားရည်|နို့ဆီ|condensed|spread/i.test(i.name);
const isTopping = (i: Row) =>
  !/half-and-half|coconut cream/i.test(i.name) &&
  /cream|foam|အမြှုပ်|ရေခဲမုန့်|ကြက်ဥ/i.test(i.name);
const isHerb = (i: Row) =>
  /mint|ပူဒီနာ|ပင်စိမ်း|rosemary|အခွံ|သစ်ကြံပိုး|cardamom|saffron|ဖာလာ|pumpkin spice/i.test(
    i.name,
  );
const isPreparedCoffee = (i: Row) =>
  /coffee|cold brew|cold drip|ကော်ဖီရည်|Café Cubano/i.test(i.name) &&
  !isShot(i) &&
  !isGround(i) &&
  !/instant/i.test(i.name);
const isPreparedTea = (i: Row) =>
  !isLeaf(i) &&
  !isMatcha(i) &&
  /tea|လက်ဖက်ရည်|ပန်းရည်|Roselle/i.test(i.name) &&
  !/powder|မှုန့်/i.test(i.name);
const isWholeFruit = (i: Row) =>
  !/ရည်|purée|puree|paste|syrup|အနှစ်/i.test(i.name) &&
  /သီး|Mixed Berry/i.test(i.name);

export function buildFieldGuide(r: Recipe) {
  const rows = r.ingredients,
    n = r.englishName;
  const steps: GuideStep[] = [],
    issues: GuideIssue[] = [],
    used = new Set<number>();
  const sources = new Set<SourceKey>(["sca", "cold"]);
  const take = (p: (i: Row) => boolean) =>
    rows.map((i, k) => ({ i, k })).filter((x) => !used.has(x.k) && p(x.i));
  const add = (
    title: string,
    action: string,
    check: string,
    indexes: number[] = [],
  ) => {
    indexes.forEach((k) => used.add(k));
    steps.push({ title, action, check, ingredientIndexes: indexes });
  };
  const group = (
    p: (i: Row) => boolean,
    title: string,
    action: string,
    check: string,
  ) => {
    for (const { i, k } of take(p))
      add(title, `${text(i)} — ${action}`, check, [k]);
  };
  const block = (message: string) => issues.push({ level: "blocker", message });
  const trial = (message: string) => issues.push({ level: "trial", message });
  const hasIce = rows.some(isIce);
  const hot =
    !hasIce &&
    !/Dirty|Cold|Iced|Affogato/i.test(n) &&
    (/Hot|Latte|Flat White|Cappuccino|Macchiato|Cortado|Piccolo|Gibraltar|Breve|Espresso|Bicerin|Marocchino|Noisette|Turkish|Olla|Tubruk|V60|French|AeroPress|Moka|Lungo|Ristretto/i.test(
      n,
    ) ||
      rows.some((i) => /အပူ|ပူ|နွေး/.test(i.name)));
  const raw = r.steps.join(" ");
  let method = hot ? "အပူရောဖျော်ခြင်း" : "အအေးရောဖျော်ခြင်း";
  const dust = (i: Row) =>
    /Tiramisu|Marocchino/.test(n) && /cocoa/i.test(i.name);
  for (const i of rows) {
    if (!i.quantity.trim())
      block(
        `${i.name} ပမာဏမပါပါ။ ပစ္စည်းနှင့်ရေပမာဏ အတည်မပြုမီ မစမ်းဖျော်ပါနှင့်။`,
      );
    if (
      /အနည်းငယ်|လိုသလောက်|အလိုက်|Menu|scoop|strands|sprig|ချပ်|ရွက်|ချောင်း|စိတ်|လုံး|×/i.test(
        i.quantity,
      ) ||
      /\/|သို့မဟုတ်/.test(i.name)
    )
      trial(
        `${text(i)} — မရွေးရသေးသော အစားထိုး/အပိုင်း/အလေးချိန်ကို မှတ်တမ်းတင်ရန် လိုသည်။`,
      );
    if (/\d\s*[–-]\s*\d/.test(i.quantity))
      trial(
        `${text(i)} — တစ်ပမာဏကို ခွက်မဖျော်မီ ရွေးချယ်မှတ်သားပြီး အဲဒီပမာဏကိုပဲ သုံးပါ။`,
      );
  }
  if (
    rows.some((i) =>
      /နို့.*\/.*ရေ|ရေ.*\/.*နို့|လိုအပ်သော Menu/.test(i.name + i.quantity),
    )
  )
    block(
      "မူရင်းက နို့/ရေ ရွေးချယ်မှု မရှင်းပါ။ နို့နှင့်လီမွန်ကို မခန့်မှန်းရောပါနှင့်။ အသုံးပြုမည့်အရည်ကို အတည်ပြုမှ စမ်းဖျော်ပါ။",
    );
  if (n === "Doppio Ristretto")
    block(
      "Dose 16 g နှင့် yield 2 × 20–24 g သည် shot အရေအတွက် မရှင်းပါ။ 16 g ကို နှစ်ကြိမ်သုံးရမည်ဟု မခန့်မှန်းထားပါ။",
    );
  if (n === "Iced Ristretto Black")
    block(
      "အမည်မှာ Ristretto ဖြစ်သော်လည်း မူရင်းက Espresso 32 g ရေးထားသည်။ Shot သတ်မှတ်ချက်ကို အရင်အတည်ပြုပါ။",
    );
  if (/Oliang/.test(n) && !rows.some(isWater))
    block(
      "မူရင်းအဆင့်တွင် နှပ်ရေ 220 ml ခန့်ဟု ရေးထားသော်လည်း ingredients စာရင်းတွင် မပါပါ။ ဒီကွာဟချက်ကို အတည်ပြုပြီးမှ ဆက်ဖျော်ပါ။",
    );
  if (
    /cream|foam|အမြှုပ်/i.test(rows.map((i) => i.name).join(" ")) &&
    r.categoryId !== "prep-foam"
  )
    trial(
      "Cream/foam ကို အသင့်စားသုံးနိုင်သော အခြေခံပစ္စည်းဖြင့်သာသုံးပါ။ ပစ္စည်း brand၊ အချိုနှင့် ကြိုပြင်ပုံကို batch တိုင်း တူညီအောင် မှတ်တမ်းထားပါ။",
    );
  if (/ကြက်ဥ|egg/i.test(rows.map((i) => i.name).join(" "))) {
    sources.add("egg");
    block(
      "Pasteurized ကြက်ဥအနှစ်/egg product ရရှိကြောင်း စစ်ပြီးမှ လုပ်ပါ။ အပူကော်ဖီလောင်းရုံနှင့် ပိုးသတ်ပြီးဟု မယူဆပါနှင့်။",
    );
  }
  if (
    /concentrate|အနှစ်|purée|puree|powder|မှုန့်/i.test(
      rows.map((i) => i.name).join(" "),
    )
  )
    trial(
      "အနှစ်/မှုန့်၏ အချိုပါဝင်မှုနှင့် dilution အချိုးက brand အလိုက် ကွာသည်။ မိမိသုံးမည့် label နှင့် အရသာကို စမ်းသပ်ရမည်။",
    );
  if (!r.cupSizes.length && !isPreparation(r))
    trial(
      "မူရင်းခွက်အရွယ် မပါပါ။ Finished yield ကို တိုင်းပြီး ခွက်ရွေးရန် လိုသည်။",
    );

  add(
    "အလုပ်မစမီ ပြင်ပါ",
    `${n} အတွက် ${isPreparation(r) ? "သန့်ရှင်းသော အိုး/ဖျော်ဘူး" : r.cupSizes.length ? `${r.cupSizes.join(" / ")} oz ခွက်` : "ပါဝင်ပစ္စည်းပမာဏ ဆံ့မည့် ခွက်"}၊ ချိန်ခွင်၊ ml တိုင်းခွက်၊ ဇွန်းနှင့် သန့်ရှင်းသောအသုံးအဆောင် ပြင်ပါ။ လက်ဆေးပါ။`,
    "ခွက်နှင့်အသုံးအဆောင် သန့်ရှင်းပြီး နို့/cream/အသီးတို့ အအေးထိန်းထားရမည်။",
  );
  add(
    "ပမာဏဖတ်ပုံ",
    "g ကို ချိန်ခွင်နဲ့ချိန်ပါ။ ခွက်တင်ပြီး TARE နှိပ်၍ 0 g ပြန်ထားပါ။ ml ကို အရည်တိုင်းခွက်ဖြင့် မျက်လုံးအမြင့်က ဖတ်ပါ။",
    "ပါဝင်ပစ္စည်းဇယားနှင့် အဆင့်ထဲကပမာဏ တူရမည်။ g ကို ml ဟု မယူဆရပါ။",
  );
  const shot = () => {
    const grounds = take(isGround),
      extracted = take(isShot);
    if (!extracted.length && !/Ristretto|Lungo/.test(n)) return;
    sources.add("espresso");
    if (grounds.length)
      for (const { i, k } of grounds)
        add(
          "ကော်ဖီမှုန့် ပြင်ပါ",
          `${text(i)} ကို သန့်ရှင်းခြောက်သွေ့သော basket ထဲ ချိန်ထည့်ပြီး ညီအောင်ဖြန့်၊ တည့်တည့်ဖိပါ။`,
          "Dose သည် basket ထဲသုံးရန်ဖြစ်ပြီး သောက်ခွက်ထဲ မထည့်ရပါ။",
          [k],
        );
    else
      add(
        "Espresso အတွက် စက်ပြင်ပါ",
        extracted.some((x) => number(x.i) === 64)
          ? "ကော်ဖီမှုန့် 16 g ဖြင့် Espresso 32 g တစ်ခါထုတ်ပါ။ နောက်ထပ် ကော်ဖီမှုန့်သစ် 16 g ဖြင့် 32 g ထပ်ထုတ်၍ စုစုပေါင်း 64 g ရယူပါ။ 16 g တစ်ကြိမ်တည်းဖြင့် 64 g အရှည်မထုတ်ပါနှင့်။"
          : "Gemilai CRM3605 တွင် basket ဆံ့မှုစစ်ပြီး ကော်ဖီမှုန့် 16 g ကို စတင်စမ်းသပ်ချက်အဖြစ်သုံးပါ။ 18 g သို့ အလိုအလျောက်မတိုးပါနှင့်။",
        "စက်ပူပြီး basket/portafilter ခြောက်သွေ့၊ ကော်ဖီမျက်နှာပြင် ညီရမည်။ ဤ 16 g သည် ဆိုင်စမ်းသပ်စမှတ်သာ ဖြစ်သည်။",
      );
    for (const { i, k } of extracted)
      add(
        "ကော်ဖီရည် ထုတ်ပါ",
        `${text(i)} ကို သီးခြား shot ခွက်ထဲ ထုတ်ယူပါ။ ခွက်ကို ချိန်ခွင်ပေါ် 0 g ထားပြီး pump စဖွင့်ချိန်ကနေ အချိန်မှတ်ပါ။`,
        "32 g espresso အတွက် 25–30 s ကို ဆိုင်စမ်းသပ်စမှတ်ယူပါ။ တခြား yield များကို 32 g သို့ မပြောင်းပါနှင့်။ Crema တစ်ခုတည်းနှင့် အရသာမဆုံးဖြတ်ရပါ။",
        [k],
      );
    if (!extracted.length)
      block("ထုတ်ယူမည့်ကော်ဖီရည်ပမာဏကို မူရင်းက မရှင်းလင်းပါ။");
  };
  const steam = () => {
    const prepared = take(
      (i) => isMilk(i) && /နို့ပူ|နို့အပူ|steamed/i.test(i.name),
    );
    for (const { i, k } of prepared)
      add(
        "ပူဖောက်ပြီးနို့ တိုင်းထည့်ပါ",
        `${text(i)} သည် ကြိုပူဖောက်ပြီးသော နို့ပမာဏဖြစ်သည်။ ညင်သာစွာလှည့်၊ အမြှုပ်ညီအောင်လုပ်ပြီး သောက်ခွက်ထဲ တိုင်းလောင်းပါ။`,
        "ဤ ml ကို နို့စိမ်း input ml ဟု မယူဆရပါ။ လေဝင်မှုကြောင့် ပမာဏကွာနိုင်သည်။",
        [k],
      );
    const dairy = take(isMilk);
    if (!dairy.length) return;
    sources.add("espresso");
    for (const { i, k } of dairy)
      add(
        "နို့ကို တိုင်းပါ",
        `${text(i)} ကို နို့ဖျော်ခွက်ထဲ ထည့်ပါ။ ခွက်အပေါ်ပိုင်းမှာ အမြှုပ်တက်ရန် နေရာချန်ပါ။`,
        "အအေးထိန်းထားသော နို့ဖြစ်ရမည်။ နို့စိမ်းကဲ့သို့ အသင့်ဖျော်ရည်ကို steam သင့်မသင့် label စစ်ပါ။",
        [k],
      );
    add(
      "Steam ပိုက်ပြင်ပါ",
      "စက်လက်စွဲအတိုင်း steam mode ပြောင်းပြီး အပူတက်သည်အထိ စောင့်ပါ။ ပိုက်ကို drip tray ဘက်ညွှန်၊ ခဏဖွင့်၍ ကျန်ရေထုတ်ပြီး ပြန်ပိတ်ပါ။",
      "ပိုက်က လူဘက်မညွှန်ရပါ။ ပူနေသောပိုက်ကို လက်မထိရပါ။",
    );
    add(
      "နို့ထဲ လေဝင်စေပါ",
      "ပိုက်ထိပ်ကို နို့မျက်နှာပြင်အောက် အနည်းငယ်စောင်းမြှုပ်ပြီး steam ဖွင့်ပါ။ လေအနည်းငယ်သာ ဝင်စေပါ။",
      /Cappuccino/.test(n)
        ? "ခပ်တိုးတိုး ရှူးသံရပြီး ပူဖောင်းကြီး မထရပါ။ Cappuccino အတွက် latte ထက် အမြှုပ်အနည်းငယ်ပိုထူရမည်။"
        : "ခပ်တိုးတိုး ရှူးသံရပြီး ပူဖောင်းကြီး မထရပါ။ နို့အမြှုပ် ပါးပါးချောချောရအောင် လေဝင်မှုအနည်းငယ်သာထားပါ။",
    );
    add(
      "နို့အမြှုပ် ချောအောင်လုပ်ပါ",
      "နို့နွေးလာလျှင် ပိုက်ထိပ်ကို အနည်းငယ်ပိုမြှုပ်၍ နို့ကို ဝဲလည်စေပါ။ Thermometer ဖြင့် 55–65°C ဆိုင်စမ်းသပ်ပစ်မှတ်ကို စစ်ပါ။",
      "ဤအပူချိန်က universal standard မဟုတ်ပါ။ နို့/စက်ညွှန်ကြားချက်နှင့် ကိုက်ညီမှုစစ်ပါ။ နို့ကို ဆူအောင် မထားပါနှင့်။",
    );
    add(
      "Steam ပိတ်ပြီးမှ ခွက်ဖယ်ပါ",
      "Steam ကို အရင်ပိတ်ပြီးမှ နို့ခွက်ကို ဖယ်ပါ။ ပိုက်ကို သန့်ရှင်းသော အဝတ်စိုဖြင့်သုတ်ပြီး drip tray ဘက်မှာ ခဏပြန်ဖွင့် ရှင်းပါ။",
      "နို့က တောက်ပြောင်ပြီး အမြှုပ်သေးသေးညီညီဖြစ်ရမည်။ ပြန်အပူပေးထားသည့် နို့ကျန် မသုံးပါနှင့်။",
    );
    add(
      "နို့လောင်းပါ",
      "နို့ဖျော်ခွက်ကို ညင်သာစွာလှည့်၊ ပြင်ထားသော အခြေခံရည်ထဲ ဖြည်းဖြည်းလောင်းပါ။",
      "နို့ရည်နှင့် အမြှုပ် မကွဲဘဲ တစ်သားတည်းဝင်ရမည်။ Latte art ပုံထက် အရသာ/texture ကို ဦးစားပေးပါ။",
    );
  };
  const ice = (where = "သောက်ခွက်") =>
    group(
      isIce,
      "ရေခဲထည့်ပါ",
      `${where}ထဲ သန့်ရှင်းသော scoop ဖြင့် ချိန်ထည့်ပါ။ ရေခဲပမာဏကို မျက်မှန်းမဆပါနှင့်။`,
      "ရေခဲက သောက်သုံးနိုင်သောရေမှ ပြုလုပ်ထားရမည်။ အရည်ကျဲလျှင် ရေခဲကို အကြောင်းမဲ့လျှော့မချပါနှင့်။",
    );
  const sweet = (where = "ဖျော်ခွက်") =>
    group(
      isSweet,
      "အချို/ဆော့စ် ထည့်ပါ",
      `${where}ထဲ အတိအကျထည့်ပြီး ဇွန်းနဲ့ပျော်အောင် မွှေပါ။ အပို pump မနှိပ်ပါနှင့်။`,
      "အောက်ခြေတွင် သကြား/ဆော့စ်အထူ မကျန်ရပါ။ တစ်ကြိမ်ထည့်ပြီးသားပမာဏကို ထပ်မထည့်ရပါ။",
    );
  const liquids = (skipMilk = false) => {
    for (const { i, k } of take(
      (i) =>
        !isIce(i) &&
        !isSoda(i) &&
        !isTopping(i) &&
        !dust(i) &&
        (!skipMilk || !isMilk(i)),
    )) {
      add(
        "အခြေခံပစ္စည်း ပေါင်းပါ",
        `${text(i)} ကို ဖျော်ခွက်ထဲ တစ်မျိုးချင်း ထည့်ပြီး ဇွန်းနဲ့ ညီအောင်ရောပါ။`,
        isWholeFruit(i)
          ? "အသီးကို ရေဆေး၊ အခွံ/အစေ့ဖယ်ပြီး စားသုံးနိုင်သောအသားကိုသာ ချိန်ရမည်။"
          : "ဖျော်ရည်အရောင် ညီရမည်။ အဖတ်ဖြစ်ခြင်း/အနံ့မမှန်ခြင်း ရှိလျှင် ရပ်ပါ။",
        [k],
      );
    }
  };
  const tops = () => {
    for (const { i, k } of take(isTopping))
      add(
        "အပေါ်အမြှုပ် တင်ပါ",
        `${text(i)} ကို သီးခြားတိုင်းပြီး အပေါ်ဆုံးတွင် ဖြည်းဖြည်းတင်ပါ။`,
        "အသင့်စားသုံးနိုင်သော topping ဖြစ်ရမည်။ Foam/cream အရောတစ်ဘူးလုံးကို တစ်ခွက်စာပမာဏဟု မယူဆရပါ။",
        [k],
      );
  };

  if (isPreparation(r)) {
    method = "အခြေခံရည် / အမြှုပ် တစ်ဘူးပြင်ဆင်ခြင်း";
    for (const { i, k } of take(() => true))
      add(
        "တစ်ဘူးစာ ပစ္စည်းချိန်ပါ",
        text(i) + " ကို သီးခြားချိန်ပြင်ထားပါ။",
        "ဒီပမာဏသည် batch input ဖြစ်သည်။ ရောပြီးထွက်မည့် yield နှင့် မတူနိုင်ပါ။",
        [k],
      );
    const core =
      r.categoryId === "prep-foam" ? getClearProcedure(r) : shortSteps(r.steps);
    for (const s of core)
      add(
        "တစ်ဘူးပြင်ဆင်ရန် လိုက်လုပ်ပါ",
        s,
        "အပူပေး/ကြိတ်ပြီး အရည်ထွက်ပမာဏ၊ အပူချိန်နှင့် အဖုမကျန်မှုကို စစ်ပါ။",
      );
    add(
      "ဘူးအမည်နှင့်အချိန် ရေးပါ",
      "အအေးခံပြီး သန့်ရှင်းသောဘူးထဲထည့်၊ ပစ္စည်းအမည်၊ batch အချိန်နှင့် အလေးချိန်ရေးပါ။ 4°C အောက်တွင် ဖုံးအုပ်ထားပါ။",
      "ဤအိမ်လုပ် base ကို အပြင်အပူချိန်တွင် shelf-stable ဟု မသတ်မှတ်ရပါ။ ပိုးသတ်အောင် အပူပေးပြီးဟု မယူဆပါနှင့်။",
    );
  } else if (r.id.startsWith("upgrade-")) {
    method = "မီနူးအလိုက် သီးသန့် ရောစပ်ခြင်း";
    const missingCore =
      !rows.some(isIce) ||
      (r.categoryId === "upgrade-coffee" && !rows.some(isShot)) ||
      (r.categoryId === "upgrade-soda" && !rows.some(isSoda)) ||
      (/Matcha/.test(n) && !rows.some(isMatcha));
    if (missingCore)
      block(
        "မီနူးပါဝင်ပစ္စည်း ပြောင်းထားသဖြင့် သီးသန့်ဖျော်နည်းနှင့် မကိုက်တော့ပါ။ ဖျော်နည်းကို အရင်ပြန်အတည်ပြုပါ။",
      );
    let dedicated: string[];
    try {
      dedicated = getClearProcedure(r).slice(1);
    } catch {
      block(
        "မီနူးပါဝင်ပစ္စည်း ပြောင်းထားသဖြင့် သီးသန့်ဖျော်နည်းနှင့် မကိုက်တော့ပါ။ ဖျော်နည်းကို အရင်ပြန်အတည်ပြုပါ။",
      );
      dedicated = rows.map(
        (i) =>
          text(i) +
          " ကို ချိန်ပြင်ထားပါ။ ထည့်စဉ်မရှင်းလင်းသေးသဖြင့် ဆက်မဖျော်ပါနှင့်။",
      );
    }
    for (const [index, s] of dedicated.entries())
      add(
        /စက် basket/.test(s)
          ? "ကော်ဖီမှုန့် ပြင်ပါ"
          : /ရလာရင် ရပ်/.test(s)
            ? "ကော်ဖီရည် ထုတ်ပါ"
            : /ဇကာစစ်ထည့်/.test(s)
              ? "Matcha စစ်ပါ"
              : /Oreo.*ခွဲထား/.test(s)
                ? "Oreo ခွဲပါ"
                : /လက်ကိုင်အမြှုပ်စက်ခေါင်း/.test(s)
                  ? "Matcha အဖုဖျော်ပါ"
                  : /နို့.*လောင်းပါ/.test(s)
                    ? "နို့ လောင်းပါ"
                    : /အပေါ်ဆုံးမှာ/.test(s)
                      ? "နို့အမြှုပ် တင်ပါ"
                      : /ရေခဲ.*ထည့်ပါ/.test(s)
                        ? "ရေခဲ ချိန်ထည့်ပါ"
                        : /ဆိုဒါထဲက ကျန်/.test(s)
                          ? "ကျန်ဆိုဒါ လောင်းပါ"
                          : /Espresso ရည်အားလုံး/.test(s)
                            ? "ကော်ဖီကို အပေါ်လောင်းပါ"
                            : /Matcha ရည်အားလုံး/.test(s)
                              ? "Matcha ကို အပေါ်လောင်းပါ"
                              : `လိုက်ဖျော်အဆင့် ${index + 1}`,
        s,
        /ရလာရင် ရပ်/.test(s)
          ? "Dose 16 g နှင့် ထုတ်ရည် 32 g ကို မရောထွေးရပါ။ Shot ခွက်ထဲက ရည်ကိုသာ သုံးရမည်။"
          : /Oreo.*ခွဲထား/.test(s)
            ? "Cream ပါအပါအဝင် သတ်မှတ် g ပြည့်ပြီး မုန့်အစိတ်လေးများ 2–4 mm ဝန်းကျင် ဖြစ်ရမည်။"
            : /Matcha|Taro/.test(s) && /အဖု|ဇကာ/.test(s)
              ? "ခြောက်နေသောမှုန့်နှင့် အဖုအလုံး မကျန်ရပါ။ ဖျော်ထားသောရည်ကို နောက်အဆင့်ထိ သီးခြားထားပါ။"
              : /40 g.*အပေါ်တင်|အပေါ်ဆုံးမှာ/.test(s)
                ? "တင်ထားတာသည် ကြိုဖျော်ပြီးသော နို့အမြှုပ် 40 g ဖြစ်ရမည်။ အခြေခံအရောတစ်ဘူး 100 g ကို မထည့်ရပါ။"
                : /ဆိုဒါ/.test(s)
                  ? "20 g ကို အရင်သုံးပြီး ကျန် 140 g ပဲ ဆက်လောင်းရမည်။ စုစုပေါင်း 160 g မကျော်ရပါ။ ဆိုဒါပူဖောင်း ကျန်ရမည်။"
                  : /TARE/.test(s)
                    ? "ပစ္စည်းတစ်မျိုးချင်းမထည့်မီ 0 g ပြန်ထားပြီး စာရင်းပါ g ပြည့်တာကို စစ်ပါ။"
                    : /လောင်း/.test(s)
                      ? "ပြင်ထားသောရည်ကိုပဲ ပြောင်းလောင်းပါ။ အရည်သစ်/ရေသစ် ထပ်မပေါင်းရပါ။ အောက်ခြေအနှစ် မကျန်ရပါ။"
                      : "အဆင့်ပါပမာဏနှင့် လုပ်ဆောင်ချက်ကို စစ်ပြီးမှ နောက်အဆင့်သို့ ဆက်ပါ။",
      );
    // Source quantities are used by the explicitly written expansion path.
    for (let k = 0; k < rows.length; k++) used.add(k);
  } else if (/Moka Pot/i.test(n)) {
    method = "Moka Pot";
    sources.add("moka");
    group(
      () => true,
      "စက် capacity စစ်ပါ",
      "စက်၏ မော်ဒယ်နှင့် basket/water capacity ကို အရင်အတည်ပြုပါ။",
      "ပမာဏမပြည့်စုံသောကြောင့် ခန့်မှန်း၍ မပြင်ရပါ။",
    );
    add(
      "Safety valve မမြှုပ်ပါနှင့်",
      "ရေကို safety valve အောက်အထိသာ ဖြည့်ပါ။ ကော်ဖီကို basket ထဲ ညီအောင်ဖြည့်ပြီး espresso လို ဖိတင်းခြင်း မလုပ်ပါနှင့်။",
      "စက်မော်ဒယ် manual ကို ဦးစားပေးပါ။ ပူနေစဉ် စက်ကို မဖွင့်ပါနှင့်။",
    );
    add(
      "အပူပေးပြီး ရပ်ပါ",
      "မီးကို စက်လက်စွဲအတိုင်း ထိန်းပြီး ရည်ထွက်ခြင်းကို ကြည့်ပါ။ ရည်ပြင်းပြင်းပန်းထွက်/အသံကြမ်းလာလျှင် အပူမှဖယ်ပါ။",
      "လက်ကိုင်ပူနိုင်သည်။ စက်လုံးဝအေးပြီး ဖိအားမရှိမှ ဖြုတ်ဆေးပါ။",
    );
  } else if (
    /V60|French Press|AeroPress|Tubruk|Turkish|Café de Olla/i.test(n)
  ) {
    method = /V60/.test(n)
      ? "V60 ရေစစ်ဖျော်နည်း"
      : /French/.test(n)
        ? "French Press နှပ်ဖျော်နည်း"
        : /AeroPress/.test(n)
          ? "AeroPress upright နည်း"
          : /Turkish/.test(n)
            ? "Turkish Cezve"
            : "ကော်ဖီနှပ်/ပြုတ်နည်း";
    if (/V60/.test(n)) sources.add("v60");
    if (/AeroPress/.test(n)) sources.add("aeropress");
    group(
      isGround,
      "ကော်ဖီမှုန့်ချိန်ပါ",
      "သီးခြားချိန်၍ အသုံးပြုမည့်စက်နှင့်ကိုက်သော ကြိတ်အရွယ်ကို ပြင်ပါ။",
      "V60 အတွက် အလယ်အလတ်၊ French Press အတွက် ကြမ်း၊ Turkish အတွက် အလွန်နူးသည့်ကြိတ်အရွယ်ကို စမ်းသပ်စပါ။",
    );
    const water = take(isWater);
    for (const { i, k } of water)
      add(
        "ဖျော်ရေ ပြင်ပါ",
        `${text(i)} ကို တိတိကျကျတိုင်းပါ။ Filter ဆေးရေကို ဒီပမာဏထဲ မထည့်ရပါ။`,
        "ရေအားလုံးကို တစ်ကြိမ်ချိန်ထားပါ။ အဆင့်ခွဲလောင်းရင် ဒီစုစုပေါင်းထဲကပဲ သုံးရမည်။",
        [k],
      );
    if (/V60/.test(n)) {
      const total = number(water[0]?.i),
        bloom = /Iced V60/.test(n) ? 35 : 30;
      add(
        "စက္ကူစစ် စိုအောင်လုပ်ပါ",
        "Dripper ထဲ filter တပ်၊ သီးခြားရေဖြင့် ဆေးပြီး ဆေးရေကို စွန့်ပါ။ ကော်ဖီမှုန့်ထည့်ပြီး ချိန်ခွင်ကို 0 g ပြန်ထားပါ။",
        "ကော်ဖီအနှံ့ အညီဖြန့်ထားပြီး စစ်အောက်ထဲ ဆေးရေမကျန်ရပါ။",
      );
      if (hasIce) ice("ကော်ဖီစစ်ရည်ခံမည့်ခွက်");
      add(
        "ကော်ဖီအားလုံး စိုအောင်လောင်းပါ",
        `ချိန်ထားသော ဖျော်ရေထဲမှ ${bloom} g ကို ဖြည်းဖြည်းလောင်း၍ ${/Iced V60/.test(n) ? "30" : "30–40"} စက္ကန့် စောင့်ပါ။ ဤသည် မူရင်းဖျော်နည်းပါ ခွဲပမာဏဖြစ်သည်။`,
        "ကော်ဖီမျက်နှာပြင်အားလုံး စိုရမည်။ ရေသစ် ထပ်ပေါင်းသုံးခြင်း မဟုတ်ပါ။",
      );
      add(
        "ကျန်ရေ ဖြည်းဖြည်းလောင်းပါ",
        `ကျန် ${total - bloom} g ကို နှစ်ပိုင်း/သုံးပိုင်း ဖြည်းဖြည်းလောင်းပါ။ စုစုပေါင်း ဖျော်ရေ ${total} g ပြည့်လျှင် ရပ်ပါ။`,
        "စစ်သားဘေးကိုသာ မလောင်းပါနှင့်။ အချိန်/ရည်ထွက်ကို မှတ်တမ်းတင်ပြီး grind ကို တစ်မျိုးချင်းညှိပါ။",
      );
      add(
        "Dripper ဖယ်ပြီး မွှေပါ",
        "ရည်ဆင်းပြီးလျှင် dripper ဖယ်၍ ရည်ကို ညင်သာစွာ မွှေပါ။",
        "ဖျော်ရေအားလုံးသည် finished drink yield မဟုတ်ပါ။ ကော်ဖီမှုန့်ထဲကျန်သောရေကို ထည့်မတွက်ရပါ။",
      );
    } else {
      // These source recipes contain unique timings and device-specific sequencing.
      for (const s of shortSteps(r.steps).filter(
        (s) => !/Tissue|Cup Carrier|အော်ဒါအမည်/.test(s),
      ))
        add(
          "စက်/နှပ်နည်း အဆင့်လိုက်",
          s,
          "ကော်ဖီနှင့်ဖျော်ရေပမာဏကို အထက်တွင်ချိန်ထားသည့်ပမာဏမှပဲ သုံးပါ။ ထပ်မပေါင်းပါနှင့်။",
        );
      if (/French/.test(n))
        add(
          "ရည်ကို ခွဲလောင်းပါ",
          "မူရင်းနှပ်ချိန်ပြည့်လျှင် plunger ကို ဖြည်းဖြည်းနှိပ်ပြီး ကော်ဖီရည်အားလုံးကို ခွက်သစ်ထဲ ချက်ချင်းခွဲလောင်းပါ။",
          "ကြာကြာကော်ဖီမှုန့်ပေါ်ထား၍ အရသာဆက်ပြောင်းခြင်းကို ရှောင်ပါ။",
        );
      if (/AeroPress/.test(n))
        add(
          "Upright ကိုသာ သုံးပါ",
          "အောက်က filter cap လုံအောင်တပ်ပြီး တည်ငြိမ်သောခွက်ပေါ်တင်ကာ ဖြည်းဖြည်းနှိပ်ပါ။ ပူရည်ပါစက်ကို လှန်ခြင်း မလုပ်ပါနှင့်။",
          "မိမိစက်မော်ဒယ် manual ကို ဦးစားပေးပါ။ အားဖြင့်အတင်းမဖိရပါ။",
        );
    }
    sweet("စစ်ထုတ်ပြီးသော ကော်ဖီရည်");
    liquids();
  } else if (/Dalgona|Greek Frappé/.test(n)) {
    method = "Instant coffee အမြှုပ်ခတ်နည်း";
    group(
      (i) => /instant|သကြား/.test(i.name),
      "အမြှုပ်အတွက် ထည့်ပါ",
      "အမြှုပ်ခတ်မည့် ခွက်ငယ်ထဲ ထည့်ပါ။",
      "ကော်ဖီမှုန့်စိမ်း/espresso ဖြင့် အစားမထိုးရပါ။",
    );
    const waters = take(isWater);
    for (const { i, k } of waters) {
      if (/ရေအေး/.test(i.name)) continue;
      if (/Dalgona Matcha/.test(n) && i.name === "ရေ") continue;
      add(
        "အမြှုပ်အတွက် ရေထည့်ပါ",
        `${text(i)} ကို instant coffee အရောထဲ ထည့်ပါ။`,
        "Matcha အတွက် သီးခြားရေကို ဒီထဲမထည့်ရပါ။",
        [k],
      );
    }
    add(
      "ကော်ဖီအမြှုပ် ခတ်ပါ",
      "ခွက်အဖွင့်တွင် whisk/frother ဖြင့် အရောင်ဖျော့ပြီး ဇွန်းပေါ်မှာ ခဏတင်နေနိုင်သောအမြှုပ် ရသည်အထိခတ်ပါ။",
      "Greek Frappé က ခပ်ပွပွအမြှုပ်၊ Dalgona က ပိုပျစ်သောအမြှုပ် ဖြစ်ရမည်။ အချိန်က စက်/brand ပေါ်မူတည်သည်။",
    );
    group(
      isMatcha,
      "Matcha ဖျော်ပါ",
      "ဇကာစစ်ပြီး သီးခြားဖျော်ခွက်ထဲ ထည့်ပါ။",
      "Matcha ထဲ ကော်ဖီအမြှုပ်မရောသေးပါနှင့်။",
    );
    group(
      isWater,
      "အောက်ခံအတွက် ရေထည့်ပါ",
      "သီးခြားအောက်ခံဖျော်ခွက်ထဲ ထည့်ပါ။ Matcha ပါသောမီနူးတွင် ၎င်း Matcha နှင့်အရင်အဖုမရှိအောင် ဖျော်ပါ။",
      "အမြှုပ်ခတ်ရန် သုံးပြီးသောရေကို ထပ်ထည့်ခြင်း မလုပ်ရပါ။",
    );
    liquids();
    ice();
    add(
      "အမြှုပ် တင်ပါ",
      "အောက်ခံရည်နဲ့ရေခဲပါခွက်ပေါ် ပြင်ထားတဲ့ကော်ဖီအမြှုပ်အားလုံးကို ဇွန်းဖြင့်တင်ပါ။",
      "အမြှုပ်နှင့်အောက်ခံ ခွဲမြင်ရမည်။ မသောက်မီ မွှေသောက်ပါ။",
    );
  } else if (/Oliang/.test(n)) {
    method = "Oliang အနှစ်နှပ်ခြင်း — ရေပမာဏ အတည်ပြုရန်";
    group(
      () => true,
      "မူရင်းပစ္စည်း ပြင်ပါ",
      "သီးခြားချိန်ပြင်ထားပါ။ နှပ်ရေ ပမာဏမသိသေးသဖြင့် ဆက်မဖျော်ပါနှင့်။",
      "Oliang powder ကို espresso basket ထဲမထည့်ရပါ။ မူရင်းရေကို အတည်ပြုရန် ကျန်သည်။",
    );
  } else if (/Egg Coffee/.test(n)) {
    method = "Pasteurized egg cream ကော်ဖီ";
    shot();
    group(
      (i) => /ကြက်ဥ/.test(i.name),
      "ပိုးသတ်ထားသော ဥသာပြင်ပါ",
      "Pasteurized egg product သို့မဟုတ် ပိုးသတ်ထားသော အနှစ်ကိုသာ သီးခြားခွက်ထဲထည့်ပါ။",
      "ပစ္စည်းတံဆိပ်/အနှစ်အလေးချိန်ကို မှတ်သားပါ။ ရိုးရိုးအစိမ်းဥ မသုံးရပါ။",
    );
    sweet("ဥအနှစ်ပါခွက်");
    add(
      "Egg cream ခတ်ပါ",
      "သန့်ရှင်းသော whisk ဖြင့် အရောင်ဖျော့၊ အနှစ်ရည်ပျစ်လာအောင် ခတ်ပါ။",
      "ပူသောကော်ဖီဖြင့် ပိုးသတ်ပြီးဟု မယူဆရပါ။ ခတ်ပြီး ချက်ချင်းသုံးပါ။",
    );
    add(
      "Egg cream တင်ပါ",
      "ပူသောကော်ဖီရည်ပေါ် ဥအမြှုပ်ကို ဖြည်းဖြည်းတင်၍ ချက်ချင်းတည်ခင်းပါ။",
      "နို့ပါဝင်ပစ္စည်းနှင့် ကြက်ဥ allergen ကို သိရှိထားရမည်။",
    );
  } else if (/Frappe|Frappé|Smoothie|Piña Colada|Honey Banana Milk/i.test(n)) {
    method = "Blender ဖြင့် ကြိတ်ဖျော်ခြင်း";
    shot();
    group(
      isWholeFruit,
      "အသီးပြင်ပါ",
      "ရေဆေး၊ အခွံ/အစေ့ဖယ်၍ အသားအလေးချိန်သာ ချိန်ပြီး blender ထဲထည့်ပါ။",
      "စိမ်းသော taro/ube အမှုန့်ဖြင့် အစားမထိုးရပါ။",
    );
    group(
      isPowder,
      "မှုန့်ပြင်ပါ",
      "ဇကာစစ်ပြီး ထည့်မည့်နို့/ရေထဲမှ အနည်းငယ်နှင့် အရင်အဖုမရှိအောင် မွှေပါ။ ပြီးမှ blender ထဲ ထည့်ပါ။",
      "စာရင်းမပါသောရေနွေး အပိုမဖြည့်ရပါ။ Premix အမျိုးအစားကို label စစ်ပါ။",
    );
    if (rows.some(isShot))
      add(
        "ကော်ဖီကို blender ထဲပြောင်းပါ",
        "ထုတ်ထားသော espresso ကို အဖွင့်ခွက်တွင် အပူလျော့စေပြီး blender ထဲ ပြောင်းထည့်ပါ။",
        "ပူသောရည်ကို ပိတ်ထားသော blender ထဲ မကြိတ်ရပါ။ ကော်ဖီ shot အပို ထပ်မထုတ်ရပါ။",
      );
    sweet("blender");
    liquids();
    ice("blender");
    add(
      "အဖုံးပိတ်ပြီး ကြိတ်ပါ",
      "Blender အဖုံးကို လုံအောင်ပိတ်ပြီး ice-crushing ခွင့်ပြုထားသော စက်ညွှန်ကြားချက်အတိုင်း ကြိတ်ပါ။ ပူသောရည်ကို ပိတ်ထားသော blender ထဲ မထည့်ရပါ။",
      "ရေခဲအတုံးကြီး/မှုန့်အဖု မကျန်ဘဲ ညီညာပျစ်ပျစ် ဖြစ်ရမည်။ စက်ပိတ်ပြီး ဓားရပ်မှ ဖွင့်ပါ။",
    );
    add(
      "ခွက်ထဲ လောင်းပါ",
      "အရောအားလုံးကို ခွက်ထဲ ခွဲမကျန်အောင်လောင်းပါ။",
      "ပျစ်လွန်းလို့ စုပ်မရလျှင် နောက် batch trial တွင် အရည်/ရေခဲကို ချိန်ပြီး တစ်မျိုးချင်းပြင်ပါ။ ခန့်မှန်းရေထပ်မဖြည့်ပါနှင့်။",
    );
    tops();
  } else {
    shot();
    const leaves = take(isLeaf),
      powders = take(
        (i) =>
          isPowder(i) &&
          !(/Tiramisu|Marocchino/.test(n) && /cocoa/i.test(i.name)),
      ),
      waters = take(isWater);
    if (leaves.length) {
      method = "အရွက်နှပ်ပြီး ရောဖျော်ခြင်း";
      for (const { i, k } of leaves)
        add(
          "အရွက်ချိန်ပါ",
          `${text(i)} ကို အပူခံနှပ်ခွက်ထဲ ထည့်ပါ။`,
          "အရွက်ကို instant powder ဟု မယူဆရပါ။",
          [k],
        );
      for (const { i, k } of waters.filter((x) => /ပူ|နွေး/.test(x.i.name)))
        add(
          "နှပ်ရန် ရေထည့်ပါ",
          `${text(i)} ကို အရွက်ပါခွက်ထဲ လောင်းပါ။`,
          "နှပ်ချိန်နှင့် အပူချိန်ကို tea brand label / မူရင်းနည်းနှင့် စစ်ပါ။ မရှိပါက ဆိုင် recipe အဖြစ် မအတည်ပြုသေးရပါ။",
          [k],
        );
      const timing = raw.match(
        /\d+(?:[–-]\d+)?\s*(?:မိနစ်|minutes?|min\b)/i,
      )?.[0];
      add(
        "အချိန်မှတ်ပြီး စစ်ပါ",
        timing
          ? `မူရင်းနှပ်ချိန် ${timing} ကို timer နဲ့မှတ်ပြီး ပြည့်လျှင် အရွက်ကို စစ်ဖယ်ပါ။`
          : "Tea brand label တွင် နှပ်ချိန်/အပူချိန် စစ်ပြီး timer နဲ့မှတ်ပါ။ အချက်အလက်မရပါက မခန့်မှန်းဘဲ ရပ်ပြီး အတည်ပြုပါ။",
        "အရွက်အဖတ် မကျန်ရပါ။ အရွက်ထဲရေကျန်ခြင်းကြောင့် input water နှင့် ထွက်ရည်ပမာဏ ကွာနိုင်သည်။",
      );
      if (!timing)
        block(
          "Tea နှပ်ချိန် အတိအကျမပါပါ။ Brand label သို့မဟုတ် ဆိုင်စမ်းသပ်ချက်ဖြင့် အတည်ပြုရန် ကျန်သည်။",
        );
      if (hasIce)
        add(
          "လက်ဖက်ရည် အေးအောင်ပြင်ပါ",
          "စစ်ပြီးသောရည်ကို သန့်ရှင်းသော ခွက်တွင် အမြန်အအေးခံပါ။",
          "နို့/ရေခဲနှင့် ပူပူကြီး ရော၍ ရေခဲလျင်မြန်စွာပျော်မသွားစေရပါ။",
        );
    }
    if (powders.length) {
      method = powders.some((x) => isMatcha(x.i))
        ? "Matcha/မှုန့်ကို အရင်ဖျော်ခြင်း"
        : "မှုန့်ကို အရင်ဖျော်ခြင်း";
      if (powders.some((x) => isMatcha(x.i))) sources.add("matcha");
      for (const { i, k } of powders)
        add(
          "မှုန့်စစ်ပါ",
          `${text(i)} ကို ဇကာစစ်ပြီး သီးခြားဖျော်ခွက်ငယ်ထဲ ထည့်ပါ။`,
          "အချိုပါ premix နှင့် pure powder မတူပါ။ Taro/ube က အသင့်ဖျော်သောက်နိုင်သောအမျိုးအစား ဖြစ်ရမည်။",
          [k],
        );
      for (const { i, k } of take(isWater).filter(
        (x) => /နွေး|ပူ/.test(x.i.name) || /Matcha/.test(n),
      ))
        add(
          "မှုန့်ဖျော်ရေ ထည့်ပါ",
          `${text(i)} ကို အပေါ်ပါမှုန့်ထဲ ဖြည်းဖြည်းထည့်ပြီး အဖုမရှိအောင် ဖျော်ပါ။`,
          powders.some((x) => isMatcha(x.i))
            ? "Matcha အတွက် 75–80°C ကို trial စမှတ်ယူပါ။ အပူချိန်မူရင်းက ကွာလျှင် မူရင်းအတိုင်း စစ်ပါ။"
            : "Powder brand ၏ ဖျော်ရေညွှန်ကြားချက်နှင့် စစ်ပါ။ အဖုအလုံး မကျန်ရပါ။",
          [k],
        );
      if (!waters.length)
        add(
          "စာရင်းပါအရည်နဲ့ အဖုဖျော်ပါ",
          "အောက်မှာ ထည့်မည့်နို့/အခြေခံရည်ထဲမှ အနည်းငယ်ကိုပဲ ခွဲယူပြီး မှုန့်နှင့် paste လုပ်ပါ။ ကျန်အရည်ကို နောက်မှ ပေါင်းပါ။",
          "ရေသစ်အပို ထပ်မထည့်ရပါ။ အမှုန့်ခြောက် အလုံး မကျန်ရပါ။",
        );
      add(
        "အဖုမကျန်အောင် မွှေပါ",
        "Whisk သို့မဟုတ် အရည်အောက်မြှုပ်ထားသော frother ဖြင့် ညီအောင်မွှေပါ။",
        powders.some((x) => isMatcha(x.i))
          ? "Matcha အရွက်မှုန့်သည် လုံးဝပျော်ဝင်ခြင်းမဟုတ်ဘဲ အရည်ထဲညီညီပျံ့နေခြင်းဖြစ်သည်။ ခဏထားလျှင် အနည်ပြန်ကျနိုင်သည်။"
          : "ဇွန်းနဲ့စမ်းယူကြည့်လျှင် အမှုန့်ခြောက်/အဖုအလုံး မရှိရပါ။",
      );
    }
    group(
      isPreparedCoffee,
      "အသင့်ကော်ဖီရည် တိုင်းပါ",
      "ကြိုဖျော်စစ်ထားသော သတ်မှတ်အခြေခံရည်ကိုသာ တိုင်းထည့်ပါ။",
      "Concentrate နှင့် ready-to-drink အားပြင်းမှု မတူပါ။ တစ်ခုနှင့်တစ်ခု ပမာဏတူ မအစားထိုးရပါ။",
    );
    group(
      isPreparedTea,
      "အသင့်လက်ဖက်ရည် တိုင်းပါ",
      "ကြိုနှပ်၊ စစ်၊ အအေးထိန်းထားသော အခြေခံရည်ကို တိုင်းထည့်ပါ။",
      "အခြေခံရည်၏ tea/water/နှပ်ချိန် batch record ကို သိရှိထားရမည်။",
    );
    if (rows.some(isPreparedCoffee) || rows.some(isPreparedTea))
      trial(
        "အသင့် base ၏ မူရင်းဖျော်အချိုးကို အတည်ပြုရန်လိုသည်။ အရည်အားပြင်းမှု မသိဘဲ နောက်ထပ်ရေဖြည့် မညှိပါနှင့်။",
      );
    const shaken = /Shakerato|Shaken Espresso|Freddo Espresso/.test(n);
    const dirty = /Dirty Coffee/.test(n),
      affogato = /Affogato/.test(n);
    const carbon = rows.some(isSoda);
    if (affogato) {
      method = "Affogato";
      tops();
      add(
        "Espresso လောင်းပါ",
        "ပေးမည့်ခွက်ထဲရှိ ရေခဲမုန့်ပေါ် ထုတ်ပြီးသော espresso ကို သောက်ခါနီးမှ လောင်းပါ။",
        "ရေခဲမုန့်က အကုန်မပျော်သေးဘဲ ကော်ဖီပူနှင့် အအေးအချိုကို တွဲရမည်။ ထပ်ရေခဲမထည့်ပါနှင့်။",
      );
    } else if (dirty) {
      method = "Dirty Coffee — မမွှေသောက်သော အလွှာကော်ဖီ";
      group(
        isMilk,
        "နို့အောက်ခံ ထည့်ပါ",
        "အေးစက်နေသော ခွက်ထဲ တိုင်းထည့်ပါ။ နို့အပူမပေးရပါ။",
        "နို့အောက်ခံ အေးနေပြီး အပိုရေ/ရေခဲ မပါရပါ။",
      );
      add(
        "ကော်ဖီကို အပေါ်လောင်းပါ",
        "ထုတ်ပြီးသော espresso ကို နို့ပေါ် ဖြည်းဖြည်းလောင်းပါ။",
        "မမွှေပါနှင့်။ အပေါ်ကော်ဖီနွေး၊ အောက်နို့အေး contrast ကို ချက်ချင်းသုံးဆောင်ပါ။",
      );
    } else if (/Bombón/.test(n)) {
      method = "Café Bombón အလွှာဖျော်နည်း";
      group(
        isSweet,
        "နို့ဆီအောက်ခံ ထည့်ပါ",
        "သောက်မည့်ဖန်ခွက်အောက်ခြေတွင် တိုင်းထည့်ပါ။ မမွှေသေးပါနှင့်။",
        "နို့ဆီအချိုဖြစ်ရမည်။ Evaporated milk မဟုတ်ပါ။",
      );
      add(
        "ကော်ဖီအပေါ်လောင်းပါ",
        "ထုတ်ထားသော espresso အားလုံးကို ဇွန်းနောက်ကျောမှ ဖြည်းဖြည်းလောင်းပါ။",
        "နို့ဆီအောက်ခံနှင့် ကော်ဖီအပေါ်လွှာ ခွဲမြင်ရမည်။ သောက်ခါနီး မွှေပါ။",
      );
    } else if (n === "Bicerin") {
      method = "Bicerin အလွှာဖျော်နည်း";
      group(
        isSweet,
        "Chocolate အောက်ခံထည့်ပါ",
        "အပူခံခွက်အောက်ခြေတွင် တိုင်းထည့်ပါ။",
        "ဆော့စ်အောက်ခံကို နို့/ကော်ဖီထဲ ကြိုမမွှေသေးရပါ။",
      );
      add(
        "Espresso ပေါင်းပါ",
        "ထုတ်ပြီးသော espresso ကို ဆော့စ်ပေါ် ဖြည်းဖြည်းလောင်းပါ။",
        "ထုတ်ထားသောတစ် shot ကိုသာသုံးပါ။",
      );
      group(
        isMilk,
        "နို့ပူလောင်းပါ",
        "ကြိုပူဖောက်ထားသော နို့ကို သတ်မှတ်ပမာဏတိုင်း၍ ဖြည်းဖြည်းလောင်းပါ။",
        "နို့ပြင်နည်းမှာ steam ပိတ်ပြီးမှ ခွက်ဖယ်ရန် လိုသည်။ သတ်မှတ်ထားသောပမာဏက နို့ပူပမာဏဖြစ်သည်။",
      );
      tops();
    } else if (n === "Iced Cappuccino") {
      method = "Iced Cappuccino — အောက်ခံနို့နှင့်အမြှုပ် သီးခြား";
      sweet("ထုတ်ပြီးသော espresso");
      group(
        (i) => isMilk(i),
        "အောက်ခံနို့ ထည့်ပါ",
        "သောက်ခွက်ထဲ တိုင်းထည့်ပါ။",
        "အောက်ခံနို့နှင့် အမြှုပ်ခတ်ရန် နို့ကို ခွဲထားရမည်။",
      );
      ice();
      add(
        "Espresso လောင်းပါ",
        "ထုတ်ထားသော espresso အားလုံးကို ရေခဲပေါ်လောင်းပါ။",
        "ကော်ဖီရည်ပမာဏကို ထပ်မပေါင်းပါနှင့်။",
      );
      group(
        (i) => /Cold Foam.*နို့/i.test(i.name),
        "အမြှုပ်အတွက် နို့ခတ်ပါ",
        "သီးခြားအေးသောခွက်ရှည်ထဲ တိုင်းထည့်ပြီး frother ခေါင်းကို အရည်ထဲမြှုပ်ခတ်ပါ။",
        "အပူမပေးရပါ။ အောက်ခံနို့ထဲ ဒီနို့ပမာဏကို မထည့်ပြီးသားဖြစ်ရမည်။",
      );
      add(
        "အမြှုပ်ကို အပေါ်တင်ပါ",
        "ခတ်ထားသောနို့အမြှုပ်အားလုံးကို ဇွန်းဖြင့် အပေါ်ဆုံးတင်ပါ။",
        "အောက်ကော်ဖီနှင့် အပေါ်အမြှုပ်ကို ခွဲမြင်ရမည်။",
      );
    } else if (n === "Freddo Cappuccino") {
      method = "Freddo Cappuccino အအေးနို့အမြှုပ်";
      group(
        isMilk,
        "နို့အေးအမြှုပ် ပြင်ပါ",
        "အေးသောခွက်ရှည်ထဲ ထည့်ပြီး လက်ကိုင် frother ဖြင့် အရည်အောက်မြှုပ်ခတ်ပါ။ အပူမပေးပါနှင့်။",
        "ပျစ်ပျစ်အမြှုပ်လေးရပြီး နို့ရည်နဲ့ အလွယ်မကွဲရပါ။",
      );
      ice();
      add(
        "ကော်ဖီရည် လောင်းပါ",
        "ထုတ်ပြီး အအေးခံထားသော espresso အားလုံးကို ရေခဲပေါ်လောင်းပါ။",
        "ရေခဲအလွန်မပျော်စေရန် ပူပူကြီး မလောင်းပါနှင့်။",
      );
      add(
        "နို့အမြှုပ် အပေါ်တင်ပါ",
        "ခတ်ထားသော နို့အမြှုပ်အားလုံးကို ဇွန်းဖြင့် အပေါ်တင်ပါ။",
        "အောက်ကော်ဖီနှင့် အပေါ်နို့အမြှုပ်ကို ခွဲမြင်ရမည်။",
      );
    } else if (/Café Cubano/.test(n) && !hasIce) {
      method = "Café Cubano";
      sweet("espresso ခွက်");
      add(
        "သကြားဖျော်ပါ",
        "ထုတ်ပြီးသော espresso ထဲက အနည်းငယ်နှင့် သကြားကို ခပ်မြန်မြန်မွှေပြီး ကျန် espresso ကို ပေါင်းပါ။",
        "စုစုပေါင်း espresso yield ကို ထပ်မထည့်ရပါ။ သကြားစေ့ မကျန်ရပါ။",
      );
      liquids();
    } else {
      // Toppings remain separate. Raw whipping cream is whipped in its own bowl.
      if (rows.some((i) => /whipping cream/i.test(i.name))) {
        group(
          (i) => /whipping cream/i.test(i.name),
          "နို့မလိုင် သီးခြားပြင်ပါ",
          "အအေးခံထားသောခွက်ထဲ သီးခြားထည့်၍ ပျော့ပျောင်းပျစ်လာအောင် whisk ဖြင့်ခတ်ပါ။",
          "နို့မလိုင် အပူမပေးရပါ။ ထောပတ်လို ခဲလာလျှင် အလွန်ခတ်ထားခြင်း ဖြစ်သည်။",
        );
        group(
          (i) => /^သကြား$/.test(i.name),
          "နို့မလိုင်အချို ထည့်ပါ",
          "နို့မလိုင်အရောထဲ ထည့်ခတ်ပါ။",
          "ဒီသကြားကို ကော်ဖီထဲ ထပ်မထည့်ရပါ။",
        );
      }
      sweet(
        rows.some(isShot) && !carbon
          ? "ထုတ်ပြီးသော espresso အရည်"
          : "ဖျော်ခွက်",
      );
      if (/Saffron/.test(n)) {
        group(
          (i) => /saffron/i.test(i.name),
          "Saffron ပြင်ပါ",
          "သီးခြားအပူခံခွက်ငယ်ထဲ ထည့်ပါ။",
          "Saffron စစ်မှန်မှုနှင့် ရွေးထားသည့် strands အရေအတွက်ကို မှတ်ပါ။",
        );
        group(
          (i) => isWater(i) && /နွေး/.test(i.name),
          "Saffron နှပ်ပါ",
          "အထက်ပါ Saffron ခွက်ထဲထည့်၍ မူရင်းအတိုင်း 5 မိနစ်နှပ်ပါ။",
          "အရည်အရောင်နှင့် Saffron အနံ့ရရမည်။ ဒီနှပ်ရည်ကို အားလုံးပေါင်းသုံးပါ။",
        );
        add(
          "Saffron ရည်ပေါင်းပါ",
          "နှပ်ပြီးသော Saffron ရည်အားလုံးကို နို့ရောမည့်ဖျော်ခွက်ထဲ ပြောင်းထည့်ပါ။",
          "ရေနွေးပမာဏကို နောက်တစ်ကြိမ် ထပ်မထည့်ရပါ။",
        );
      }
      for (const { i, k } of take(isHerb))
        add(
          "အနံ့ပစ္စည်း ပြင်ပါ",
          `${text(i)} — ${/mint|ပူဒီနာ|ပင်စိမ်း/i.test(i.name) ? "ရေဆေးပြီး အောက်ခံအရည်ထဲ ညင်သာစွာဖိ၍ အနံ့ထွက်စေပါ။" : /အခွံ|rosemary/i.test(i.name) ? "ရေဆေးသန့်ရှင်း၍ ခွက်နှုတ်ခမ်း/အပေါ်ဆုံးတွင် သတ်မှတ်ပမာဏသာထားပါ။" : "ဖျော်မည့်အရည်ထဲ ပါးပါးညီညီမွှေဖြန့်ပါ။"}`,
          "အနံ့သာဖြစ်ရမည်။ အလွန်များ၍ အခြေခံအနံ့ကို မဖုံးရပါ။",
          [k],
        );

      if (hot && take(isMilk).length) {
        liquids(true);
        if (rows.some(isShot))
          add(
            "ကော်ဖီကို ခွက်ထဲပြောင်းပါ",
            "ထုတ်ပြီးသော espresso ကို သောက်မည့်ခွက်ထဲ အရင်လောင်းထားပါ။",
            "နို့မလောင်းမီ espresso က သောက်ခွက်ထဲ ရှိပြီးဖြစ်ရမည်။",
          );
        steam();
        if (rows.some(isShot))
          add(
            "ကော်ဖီနှင့်နို့ ပေါင်းစပ်မှု စစ်ပါ",
            "နို့မလောင်းမီ ထုတ်ပြီးသော espresso ကို သောက်ခွက်ထဲ ပြောင်းထားရမည်။ နို့အမြှုပ်ကို တစ်သားတည်း ဝင်အောင်လောင်းပါ။",
            "Macchiato ကဲ့သို့ နို့နည်းသော မီနူးတွင် သတ်မှတ်နို့ပမာဏသာ သုံးပါ။",
          );
      } else {
        liquids(shaken);
        if (shaken) {
          if (rows.some(isShot))
            add(
              "Shaker ထဲ ကော်ဖီပြောင်းပါ",
              "ထုတ်ထားသော espresso နှင့် ရောပြီးသောအချိုအရောကို အဖွင့် shaker ထဲ ပြောင်းထည့်ပါ။",
              "ပူနေလျှင် အဖုံးမပိတ်ရပါ။",
            );
          ice("အဖွင့်ဖြင့် အေးအောင်ပြင်ပြီးသော ကော်ဖီပါ shaker");
          add(
            "အေးမှ shaker ပိတ်ပါ",
            "ကော်ဖီကို ပူပူကြီးပိတ်မလှုပ်ပါနှင့်။ ရေခဲထည့်၍ အရင်အေးအောင်မွှေ၊ အေးသွားမှ အဖုံးပိတ်ပြီး အပြင်ဘက်အေးသည်အထိ ခဏလှုပ်ပါ။",
            "အပူကြောင့် အဖုံးပေါက်ထွက်မှု မရှိစေရပါ။ လှုပ်ပြီးခွက်ထဲ ပြန်လောင်းပါ။",
          );
        } else {
          ice();
          if (
            rows.some(
              (i) =>
                !isGround(i) &&
                !isShot(i) &&
                !isIce(i) &&
                !isSoda(i) &&
                !isTopping(i) &&
                !isHerb(i),
            )
          )
            add(
              "အောက်ခံရည်ကို ခွက်ထဲပြောင်းပါ",
              "ဖျော်ခွက်ထဲ ပြင်ထားသောအရည်အားလုံးကို သောက်ခွက်ထဲ ဖြည်းဖြည်းလောင်းထည့်ပါ။",
              "ခွက်ကူးရာမှာ အောက်ခြေဆော့စ်/အနှစ် မကျန်ရပါ။ အရည်သစ် ထပ်မဖြည့်ရပါ။",
            );
        }
        if (carbon) {
          method = "ဆိုဒါရောဖျော်နည်း";
          group(
            isSoda,
            "ဆိုဒါကို နောက်ဆုံးထည့်ပါ",
            "ခွက်ဘေးမှ ဖြည်းဖြည်းလောင်းပြီး ဇွန်းနဲ့ ညင်သာစွာ ပေါင်းပါ။",
            "ဆိုဒါ/tonic ကို blender မကြိတ်၊ အဖုံးပိတ်ပြီး မလှုပ်ရပါ။ အမြှုပ်လျှံမသွားရပါ။",
          );
        }
        if (rows.some(isShot))
          add(
            "ထုတ်ထားသော ကော်ဖီရည် ပေါင်းပါ",
            "ပြင်ပြီးသော သောက်ခွက်ထဲ ထုတ်ထားသည့် espresso အားလုံးကို ဖြည်းဖြည်းလောင်းပါ။",
            "အဆင့်အစတွင် ချိန်ထုတ်ထားသောရည်ကိုပဲ သုံးရမည်။ နောက် shot ထပ်ထုတ်ခြင်း မဟုတ်ပါ။",
          );
      }
      group(
        (i) => /Tiramisu|Marocchino/.test(n) && /cocoa/i.test(i.name),
        "Cocoa အလှတင်ပါ",
        "ဇကာစိတ်ဖြင့် ခွက်အပေါ် ပါးပါးဖြူးပါ။",
        "Cocoa အလုံးမကျရပါ။ ဒီပမာဏကို အရည်ထဲ ထပ်မရောရပါ။",
      );
      if (shaken)
        group(
          isMilk,
          "လှုပ်ပြီးမှ နို့ထည့်ပါ",
          "လှုပ်ပြီးလောင်းထားသော ကော်ဖီပေါ် ဖြည်းဖြည်းလောင်းပါ။",
          "နို့နှင့်ကော်ဖီ အလွှာကို မြင်နိုင်ရမည်။",
        );
      tops();
      if (rows.some((i) => /whipping cream/i.test(i.name)))
        add(
          "နို့မလိုင်အမြှုပ် တင်ပါ",
          "သီးခြားခတ်ထားသော နို့မလိုင်အရောအားလုံးကို ခွက်အပေါ် ဖြည်းဖြည်းတင်ပါ။",
          "နို့မလိုင်က ပေါ်နေပြီး အောက်ကော်ဖီထဲ ချက်ချင်းမပြိုကျရပါ။",
        );
    }
  }
  // Any uncategorised garnish/alternative remains visible and accounted for.
  for (const { i, k } of take(() => true))
    add(
      "သီးခြားပစ္စည်းကို စစ်ပါ",
      `${text(i)} ကို မူရင်းနည်းအတိုင်း ထည့်မည့်နေရာ စစ်ပါ။ မရှင်းပါက အရင်အတည်ပြုပါ။`,
      "ဤပစ္စည်းကို ချန်မထား၊ ထပ်မထည့်ရပါ။",
      [k],
    );
  if (!isPreparation(r))
    add(
      "သောက်မည့်အရသာ စစ်ပါ",
      `${n} ကို သန့်ရှင်းသော ဇွန်းအသစ်ဖြင့် နမူနာယူ စမ်းပါ။ အောက်ပါ အရသာပစ်မှတ်နှင့် နှိုင်းပါ။`,
      "အချို/အချဉ်/အခါး၊ အပူချိန်နှင့် 5 မိနစ်အကြာ ရေခဲပျော်ပြီးအရသာကို မှတ်တမ်းရေးပါ။ ကိုယ်တိုင် taste test မလုပ်မီ ဆိုင်စံ recipe ဟု မသတ်မှတ်ရပါ။",
    );
  const sweetNames = rows.filter(isSweet).map(text),
    fruitNames = rows
      .filter((i) =>
        /juice|purée|puree|သံပ|လီမွန်|သီးရည်|concentrate/i.test(i.name),
      )
      .map(text);
  const coffee = rows.some(
    (i) =>
      isShot(i) ||
      isGround(i) ||
      isPreparedCoffee(i) ||
      /instant/i.test(i.name),
  );
  const dairy = rows.some((i) => isMilk(i) || isTopping(i));
  const expected = [
    coffee
      ? "ကော်ဖီ၏ မူရင်းအနံ့နှင့်အရသာကို ခွဲသိနိုင်ရမည်။ အလွန်ချဉ်စူးခြင်း/မီးလောင်သလိုခါးခြင်း မဖုံးကွယ်ရပါ။"
      : "ကော်ဖီမပါသော မီနူးဖြစ်သည်။ ကော်ဖီအရသာ ထင်ရမည်ဟု မမျှော်မှန်းပါနှင့်။",
    sweetNames.length
      ? `${sweetNames.map((x) => x.split(/\d/)[0].trim()).join("၊ ")} မှ အချိုရပြီး အခြေခံအနံ့ကို မဖုံးသင့်ပါ။`
      : "အပိုအချိုရည်မပါပါ။ မူရင်းပစ္စည်း၏ သဘာဝအချိုကိုသာ စစ်ပါ။",
    fruitNames.length
      ? `${fruitNames.map((x) => x.split(/\d/)[0].trim()).join("၊ ")} ၏အသီးအနံ့နှင့် ချဉ်သွက်မှုကို ခွဲသိနိုင်ရမည်။`
      : dairy
        ? "နို့/cream ၏ နူးညံ့မှုရှိပြီး အဖတ်/အချဉ်အနံ့ မဖြစ်ရပါ။"
        : "အဖု/အဖတ် မရှိသော သန့်ရှင်းသည့် အရသာနောက်ခံရရမည်။",
    hasIce
      ? "အေးပြီး ရေခဲမပျော်လွန်းရပါ။ ခွက်ဆံ့ ml နှင့် အဖျော်ရည်အသားတင် g ကို မရောထွေးပါနှင့်။"
      : "မူရင်းအပူ/အအေးနည်းအတိုင်း ချက်ချင်းသုံးဆောင်ပါ။",
  ];
  const adjustments = [
    sweetNames.length
      ? `${sweetNames[0]} က အချိုရင်းမြစ်တစ်ခုဖြစ်သည်။ နောက် trial ခွက်တွင် ထိုပစ္စည်းကိုသာ တစ်ဆင့်ချင်းပြောင်းပြီး မူရင်းပမာဏနှင့် ပြောင်းပမာဏကို ရေးမှတ်ပါ။`
      : "အချိုထပ်ထည့်လိုလျှင် မူရင်း recipe ကို မပြင်ဘဲ trial version အသစ်အဖြစ်သာ သတ်မှတ်ပါ။",
    coffee
      ? "ကော်ဖီချဉ်/ခါးလွန်လျှင် အချိုဖြင့်ဖုံးမထားဘဲ Espresso/Brew ကို သီးခြားစမ်းပါ။ Dose/yield တည်ငြိမ်ထားပြီး grind ကို တစ်မျိုးချင်းညှိပါ။"
      : "မှုန့်/အသီးရည်ပြင်းလွန်းလျှင် brand နှင့် dilution ကို စစ်ပြီး တစ်မျိုးချင်းပြောင်းစမ်းပါ။",
    dairy
      ? "နို့ပိုပြင်းချင်လျှင် နောက် trial တွင် နို့ပမာဏနှင့် ခွက်ဆံ့မှုကို ပြန်တွက်ပါ။ ရေ/နို့ကို မျက်မှန်းဖြည့်ခြင်း မလုပ်ရပါ။"
      : "အရသာကျဲလျှင် ရေအပိုပါသွားခြင်းနှင့် ရေခဲပျော်ခြင်းကို စစ်ပါ။",
    hasIce
      ? "ရေခဲပျော်ပြီးကျဲလျှင် ပစ္စည်းကို ကြိုအေးထားမှု၊ ရေခဲအရွယ်၊ အရည်ပူထည့်မိမှုကို အရင်စစ်ပါ။ မူရင်း ice weight ကို မျက်မှန်းမပြောင်းရပါ။"
      : "တစ်ခွက်ချင်း အပူချိန်နှင့် ပြင်ပြီးစောင့်ထားချိန်ကို တူညီစေပါ။",
  ];
  const mass = massAudit(r);
  if (mass.unresolved.length)
    trial(
      `g စုစုပေါင်း အတိအကျရရန် တိုင်းတာရန်ကျန်: ${mass.unresolved.join("၊ ")}။ ml ကို g အဖြစ် မတူညီဟုယူဆထားသည်။`,
    );
  return {
    id: r.id,
    method,
    mode: isPreparation(r)
      ? "တစ်ဘူးစာ"
      : hasIce
        ? "အအေး"
        : hot
          ? "အပူ"
          : "မူရင်းနည်းအတိုင်း",
    steps,
    issues,
    expected,
    adjustments,
    sourceKeys: [...sources],
    usedIngredientIndexes: [...used].sort((a, b) => a - b),
    status: issues.some((i) => i.level === "blocker")
      ? "ဖော်မြူလာအချက်အလက် အရင်အတည်ပြုရန်"
      : "Professional Trial — လက်တွေ့အရသာ မစမ်းသပ်ရသေး",
    standard:
      "နည်းစနစ်ကိုးကားထားခြင်းသာ ဖြစ်သည်။ ဤမီနူး၏ အချိုးနှင့်အရသာကို SCA အသိအမှတ်ပြုစံဟု မဆိုလိုပါ။",
  };
}
