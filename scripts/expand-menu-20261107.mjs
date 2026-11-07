import fs from "node:fs";
import crypto from "node:crypto";
const file = "public/recipes.json";
const catalog = JSON.parse(
  fs.readFileSync(
    process.argv.includes("--from-backup")
      ? "tests/fixtures/before-upgrade-283.json"
      : file,
    "utf8",
  ),
);
const specs = [
  [
    "Iced Oreo Latte",
    "အိုရီယို နို့ကော်ဖီအအေး",
    "coffee",
    [
      ["Oreo Biscuit (cream ပါ)", 20],
      ["နို့အေး", 150],
      ["Espresso", 32],
      ["ရေခဲ", 180],
    ],
  ],
  [
    "Chocolate Oreo Mocha",
    "ချောကလက် အိုရီယို မိုခါ",
    "coffee",
    [
      ["Chocolate Sauce", 18],
      ["Oreo Biscuit (cream ပါ)", 15],
      ["နို့အေး", 140],
      ["Espresso", 32],
      ["ရေခဲ", 180],
    ],
  ],
  [
    "Caramel Oreo Latte",
    "ကာရာမယ် အိုရီယို လာတေး",
    "coffee",
    [
      ["Caramel Syrup", 10],
      ["Oreo Biscuit (cream ပါ)", 15],
      ["နို့အေး", 150],
      ["Espresso", 32],
      ["ရေခဲ", 180],
    ],
  ],
  [
    "Vanilla Cold Foam Latte",
    "ဗနီလာ နို့အမြှုပ် လာတေး",
    "coffee",
    [
      ["Vanilla Syrup", 10],
      ["နို့အေး", 130],
      ["Espresso", 32],
      ["ရေခဲ", 180],
      ["Vanilla Cold Foam Base (CF-01)", 40],
    ],
  ],
  [
    "Chocolate Cream Espresso",
    "ချောကလက် ကရင်မ် အက်စပရက်ဆို",
    "coffee",
    [
      ["Chocolate Sauce", 15],
      ["နို့အေး", 110],
      ["Espresso", 32],
      ["ရေခဲ", 180],
      ["Chocolate Cold Foam Base (CF-02)", 40],
    ],
  ],
  [
    "Taro Oreo Milk",
    "ပိန်းဥ အိုရီယို နို့အအေး",
    "matcha-taro",
    [
      ["Taro Powder (အချိုပါ premix)", 25],
      ["ရေနွေး", 40],
      ["နို့အေး", 130],
      ["Oreo Biscuit (cream ပါ)", 15],
      ["ရေခဲ", 180],
    ],
  ],
  [
    "Taro Matcha Latte",
    "ပိန်းဥ မတ်ချာ လာတေး",
    "matcha-taro",
    [
      ["Taro Powder (အချိုပါ premix)", 20],
      ["ရေနွေး (Taro အတွက်)", 30],
      ["နို့အေး", 130],
      ["Matcha Powder (အချိုမပါ)", 3],
      ["ရေနွေး 75–80°C (Matcha အတွက်)", 40],
      ["ရေခဲ", 180],
    ],
  ],
  [
    "Mixed Berry Matcha Latte",
    "ဘယ်ရီစုံ မတ်ချာ လာတေး",
    "matcha-taro",
    [
      ["Mixed Berry Purée", 30],
      ["နို့အေး", 140],
      ["Matcha Powder (အချိုမပါ)", 3],
      ["ရေနွေး 75–80°C", 40],
      ["Vanilla Syrup", 8],
      ["ရေခဲ", 180],
    ],
  ],
  [
    "Matcha Oreo Latte",
    "မတ်ချာ အိုရီယို လာတေး",
    "matcha-taro",
    [
      ["Oreo Biscuit (cream ပါ)", 20],
      ["နို့အေး", 150],
      ["Matcha Powder (အချိုမပါ)", 3],
      ["ရေနွေး 75–80°C", 40],
      ["ရေခဲ", 180],
    ],
  ],
  [
    "Strawberry Matcha Cream",
    "စတော်ဘယ်ရီ မတ်ချာ ကရင်မ်",
    "matcha-taro",
    [
      ["Strawberry Fruit Concentrate", 20],
      ["နို့အေး", 120],
      ["Matcha Powder (အချိုမပါ)", 3],
      ["ရေနွေး 75–80°C", 40],
      ["ရေခဲ", 180],
      ["Vanilla Cold Foam Base (CF-01)", 40],
    ],
  ],
  [
    "Vanilla Taro Milk",
    "ဗနီလာ ပိန်းဥ နို့အအေး",
    "matcha-taro",
    [
      ["Taro Powder (အချိုပါ premix)", 25],
      ["ရေနွေး", 40],
      ["Vanilla Syrup", 8],
      ["နို့အေး", 140],
      ["ရေခဲ", 180],
    ],
  ],
  [
    "Passion Lychee Soda",
    "ပက်ရှင် လိုင်ချီး ဆိုဒါ",
    "soda",
    [
      ["Passion Fruit Concentrate", 15],
      ["Lychee Fruit Concentrate", 15],
    ],
  ],
  [
    "Strawberry Lychee Soda",
    "စတော်ဘယ်ရီ လိုင်ချီး ဆိုဒါ",
    "soda",
    [
      ["Strawberry Fruit Concentrate", 15],
      ["Lychee Fruit Concentrate", 15],
    ],
  ],
  ["Mixed Berry Soda", "ဘယ်ရီစုံ ဆိုဒါ", "soda", [["Mixed Berry Purée", 35]]],
  [
    "Blue Passion Soda",
    "ဘလူး ပက်ရှင် ဆိုဒါ",
    "soda",
    [
      ["Blue Fruit Concentrate (အရက်မပါ၊ label စစ်ရန်)", 12],
      ["Passion Fruit Concentrate", 18],
    ],
  ],
  [
    "Blue Lychee Soda",
    "ဘလူး လိုင်ချီး ဆိုဒါ",
    "soda",
    [
      ["Blue Fruit Concentrate (အရက်မပါ၊ label စစ်ရန်)", 12],
      ["Lychee Fruit Concentrate", 18],
    ],
  ],
  [
    "Strawberry Passion Soda",
    "စတော်ဘယ်ရီ ပက်ရှင် ဆိုဒါ",
    "soda",
    [
      ["Strawberry Fruit Concentrate", 15],
      ["Passion Fruit Concentrate", 15],
    ],
  ],
  [
    "Mixed Berry Lychee Soda",
    "ဘယ်ရီစုံ လိုင်ချီး ဆိုဒါ",
    "soda",
    [
      ["Mixed Berry Purée", 25],
      ["Lychee Fruit Concentrate", 12],
    ],
  ],
  [
    "Iced Chocolate Oreo Milk",
    "ချောကလက် အိုရီယို နို့အအေး",
    "milk",
    [
      ["Chocolate Sauce", 20],
      ["Oreo Biscuit (cream ပါ)", 20],
      ["နို့အေး", 150],
      ["ရေခဲ", 180],
    ],
  ],
  [
    "Vanilla Oreo Milk",
    "ဗနီလာ အိုရီယို နို့အအေး",
    "milk",
    [
      ["Vanilla Syrup", 10],
      ["Oreo Biscuit (cream ပါ)", 20],
      ["နို့အေး", 150],
      ["ရေခဲ", 180],
    ],
  ],
  [
    "Strawberry Cream Milk",
    "စတော်ဘယ်ရီ ကရင်မ် နို့အအေး",
    "milk",
    [
      ["Strawberry Fruit Concentrate", 20],
      ["နို့အေး", 140],
      ["ရေခဲ", 180],
      ["Vanilla Cold Foam Base (CF-01)", 40],
    ],
  ],
  [
    "Mixed Berry Cream Milk",
    "ဘယ်ရီစုံ ကရင်မ် နို့အအေး",
    "milk",
    [
      ["Mixed Berry Purée", 30],
      ["နို့အေး", 140],
      ["ရေခဲ", 180],
      ["Vanilla Cold Foam Base (CF-01)", 40],
    ],
  ],
  [
    "Vanilla Cold Foam Base",
    "ဗနီလာ နို့အမြှုပ်အခြေခံ",
    "foam",
    [
      ["Pasteurized whipping cream (30–35% fat)", 60],
      ["နို့အေး", 35],
      ["Vanilla Syrup", 5],
    ],
  ],
  [
    "Chocolate Cold Foam Base",
    "ချောကလက် နို့အမြှုပ်အခြေခံ",
    "foam",
    [
      ["Pasteurized whipping cream (30–35% fat)", 55],
      ["နို့အေး", 30],
      ["Chocolate Sauce", 15],
    ],
  ],
];
const normalized = (s) =>
  s
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, "");
const groupNames = {
  coffee: "Oreo & Cream Coffee",
  "matcha-taro": "Matcha & Taro အထူးများ",
  soda: "Fruit Soda & Refreshers",
  milk: "Milk & Chocolate အထူးများ",
  foam: "Cold Foam & Cream ပြင်ဆင်မှု",
};
if (catalog.recipes.some((r) => r.id === "upgrade-iced-oreo-latte"))
  throw Error("Expansion already applied");
fs.mkdirSync("tests/fixtures", { recursive: true });
if (!fs.existsSync("tests/fixtures/before-upgrade-283.json"))
  fs.writeFileSync(
    "tests/fixtures/before-upgrade-283.json",
    JSON.stringify(catalog, null, 2) + "\n",
  );
const report = {
  originalCount: catalog.recipes.length,
  originalSha256: crypto
    .createHash("sha256")
    .update(fs.readFileSync("tests/fixtures/before-upgrade-283.json"))
    .digest("hex"),
  requests: [],
};
for (const [index, [name, mm, group, raw]] of specs.entries()) {
  const existing = catalog.recipes.find(
    (r) => normalized(r.englishName) === normalized(name),
  );
  if (existing) {
    report.requests.push({ name, action: "existing", id: existing.id });
    continue;
  }
  const id = "upgrade-" + name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const menuNumber =
    group === "foam"
      ? `CF-0${index - 21}`
      : `NEW-${String(index + 1).padStart(2, "0")}`;
  if (catalog.recipes.some((r) => r.menuNumber === menuNumber))
    throw Error("Number collision");
  const categoryId = group === "foam" ? "prep-foam" : "upgrade-" + group;
  if (!catalog.categories.some((c) => c.id === categoryId))
    catalog.categories.push({ id: categoryId, name: groupNames[group] });
  const rows = [...raw];
  if (group === "soda") rows.push(["ဆိုဒါရေအေး", 160], ["ရေခဲ", 180]);
  const ingredients = rows.map(([name, g]) => ({
    name,
    quantity: `${g} g${/ရေနွေး|ဆိုဒါ/.test(name) ? ` ≈ ${g} ml` : ""}`,
  }));
  const amounts = rows.map(([n, g]) => `${n} ${g} g`).join("၊ ");
  const steps = [
    `${group === "foam" ? "သန့်ရှင်းခြောက်သွေ့သော 250 ml jug" : "16 oz ခွက် (473 ml ဝန်းကျင် ဆံ့ပမာဏ)"}၊ digital scale၊ ဇွန်း၊ သန့်ရှင်းသော ရေခဲ scoop ပြင်ပါ။ လက်ဆေးပါ။ နို့နှင့် cream ကို 4°C အောက်အေးထားပါ။`,
    `တစ်${group === "foam" ? "batch" : "ခွက်"}စာ ပါဝင်ပစ္စည်းများကို စစ်ပါ — ${amounts}။ ပစ္စည်းတစ်မျိုးထည့်တိုင်း TARE နှိပ်၍ 0 g ပြန်ထားပါ။ g ပမာဏကို အဓိကထားပြီး pump အချက်ရေဖြင့် မခန့်မှန်းပါနှင့်။`,
  ];
  if (group === "coffee")
    steps.push(
      "CRM3605 58 mm basket ကို သန့်ရှင်းခြောက်သွေ့အောင်လုပ်ပြီး basket ဆံ့ပမာဏစစ်ပါ။ ကော်ဖီ 16 g ကို ညီအောင်ဖြန့်၊ တည့်တည့် tamp လုပ်ပါ။ ခွက်ကို scale ပေါ် TARE လုပ်ပြီး pump စချိန်မှ 25–30 s ဝန်းကျင်တွင် espresso 32 g ထုတ်ယူပါ။ 18 g သို့မတိုးမီ basket capacity/headspace ကိုစစ်ပါ။",
    );
  if (/Oreo/.test(name))
    steps.push(
      "Oreo ကို အဖြူ cream ပါအပါအဝင် ချိန်ပြီး သန့်ရှင်းသောအိတ်/ခွက်တွင် 2–4 mm အစိတ်လေးများဖြစ်အောင် ခွဲပါ။ ရေခဲနှင့် blender ထဲ မထည့်ပါနှင့်။ မုန့်၏ အလေးချိန်က brand/size အလိုက်ကွာသောကြောင့် အချပ်ရေဖြင့် မအစားထိုးပါနှင့်။",
    );
  if (/Taro/.test(name))
    steps.push(
      "Taro premix ကို သီးခြားခွက်တွင် သတ်မှတ်ရေနွေးနှင့် ဇွန်းဖြင့် 30–45 s မွှေ၍ အဖုအခဲမရှိအောင် ပျော်ပါ။ ချက်ပြုတ်ရန်လိုသော taro flour အစိမ်းကို ဒီ premix အစား မသုံးပါနှင့်။ label က အချိုပါ/မပါနှင့် ဖျော်အချိုးကို စစ်၍ စမ်းသပ်မှတ်တမ်းရေးပါ။",
    );
  if (/Matcha/.test(name))
    steps.push(
      "အချိုမပါ matcha 3 g ကို စစ်ဇကာချပါ။ သီးခြားခွက်ထဲ 75–80°C ရေ 40 g နှင့် အရင် paste လုပ်၊ လက်ကိုင် frother ကို အရည်အောက်မြှုပ်ပြီး 15–20 s ဖျော်ပါ။ Taro ပါလျှင် ရေနွေးနှစ်ပိုင်းကို သီးခြားချိန်ပါ။ ဒီအချိုးက trial latte အတွက်ဖြစ်ပြီး Ippodo usucha recipe အတိုင်းမဟုတ်ပါ။",
    );
  if (group === "foam")
    steps.push(
      "Cream နှင့်နို့ကို သတ်မှတ် g အတိုင်း အေးထားသော jug ထဲ ချိန်ပါ။ Syrup/sauce ထည့်၍ 10 s မွှေပါ။ သန့်ရှင်းသော handheld frother ကို အရည်အောက်ထားပြီး 15–25 s လည်ပါ။ စက္ကန့်တိုင်းထက် texture ကိုအဓိကကြည့်ပါ။",
    );
  else if (group === "soda")
    steps.push(
      "Fruit concentrate/purée ကို ခွက်အောက်ခြေတွင် ချိန်ထည့်ပါ။ သတ်မှတ်ဆိုဒါထဲမှ 20 g ဖြင့် ဖြည်းဖြည်းပျော်အောင် မွှေပါ။ ပူသောရေ၊ နို့၊ cream မထည့်ပါနှင့်။ Blue ၏ အရသာကို label မှ စစ်ပါ — blueberry သို့မဟုတ် citrus ဟု မသတ်မှတ်ထားပါ။",
    );
  else
    steps.push(
      "Syrup သို့မဟုတ် sauce ပါလျှင် ချိန်ထည့်၍ နို့အနည်းငယ်ဖြင့် ပျော်အောင်မွှေပါ။ Coffee recipe တွင် sauce ကို လတ်ဆတ်သော espresso အနည်းငယ်နှင့် အရင်ပျော်ပါ။ နို့စုစုပေါင်း g ကို မပိုစေပါနှင့်။",
    );
  if (group !== "foam")
    steps.push(
      "ခွက်ထဲ purée/concentrate/Oreo/Taro base ရှိလျှင် အောက်ခြေတွင်ထားပါ။ နို့ပါ recipe ဆို နို့ကို ဖြည်းဖြည်းထည့်ပါ။ အချဉ်ပါ concentrate ကို နို့အများထဲ ရုတ်တရက်မမွှေပါနှင့် — အဖတ်ဖြစ်ပါက မဆက်ရောင်းဘဲ pH/ပစ္စည်းလိုက်ဖက်မှုကို စမ်းသပ်ပါ။",
    );
  if (group !== "foam")
    steps.push(
      "ခွက်ကို scale ပေါ်ပြန်တင်၊ TARE နှိပ်ပြီး သန့်ရှင်းသော scoop ဖြင့် ရေခဲ 180 g ချိန်ထည့်ပါ။ ခွက်မှာ အနည်းဆုံး 10–15 mm အဖုံးလွတ်နေရာထားပါ။ မဆံ့လျှင် ဖိထည့်ခြင်း၊ ပမာဏလျှို့ဝှက်လျှော့ခြင်းမလုပ်ဘဲ ခွက်ပုံစံနှင့် ice displacement ကို trial တွင်စစ်ပါ။",
    );
  if (group === "soda")
    steps.push(
      "ကျန်ဆိုဒါ 140 g ကို ခွက်ဘေးမှ ဖြည်းဖြည်းလောင်းပါ။ ဇွန်းရှည်ဖြင့် အောက်မှအပေါ် 2–3 ချက်သာ မွှေပါ။ ဆိုဒါပါပြီးမှ shaker ပိတ်လှုပ်ခြင်း/ဖျော်စက်လည်ခြင်း မလုပ်ပါနှင့်။",
    );
  else if (group !== "foam")
    steps.push(
      `${/Matcha/.test(name) ? "ဖျော်ထားသော matcha" : "coffee" === group ? "Espresso 32 g" : "ကျန်နို့/base"} ကို ဇွန်းနောက်ကျောပေါ်မှ ဖြည်းဖြည်းလောင်းပါ။ Layer သည် အလှပြခြင်းအတွက်သာဖြစ်ပြီး မသောက်မီ မွှေသောက်ရန် ပြောပါ။`,
    );
  if (/Cream|Foam/.test(name) && group !== "foam")
    steps.push(
      "CF-01 / CF-02 ဖျော်နည်းအတိုင်း လတ်လတ်ဆတ်ဆတ် foam ပြုလုပ်၍ 40 g ကို အပေါ်တင်ပါ။ Base recipe 100 g နှင့် topping 40 g ကို ထပ်မပေါင်းချိန်ပါနှင့်။ အမြှုပ် 10–15 mm ဝန်းကျင်က trial ရည်မှန်းချက်ဖြစ်ပြီး အလေးချိန်ကို ဦးစားပေးပါ။",
    );
  if (group === "foam")
    steps.push(
      "ဇွန်းဖြင့် မကြာမီစီးကျသော ပျော့ပျောင်းသည့် အမြှုပ်ရသည်အထိသာလည်ပါ။ တောင့်တင်းသော whipped cream / butter အဖြစ်မဖြစ်စေပါနှင့်။ မတက်လျှင် ပစ္စည်းအပူချိန်နှင့် cream fat label စစ်ပါ။ သုံးမည့် portion 40 g ကို ထုတ်ချိန်ပါ။",
    );
  steps.push(
    "ပစ္စည်းတစ်ခုချင်း g စာရင်းနှင့် ရောစပ်ပြီး စုစုပေါင်း g ကို နှိုင်းပါ။ ပုံမှန်ထက်ကွာလျှင် tare၊ spill၊ topping double-count ဖြစ်မဖြစ် စစ်ပါ။ ခွက်ဆံ့ ml ကို finished drink g ဟု မသတ်မှတ်ပါနှင့်။",
  );
  steps.push(
    "သန့်ရှင်းသော ဇွန်းအသစ်ဖြင့် အရသာတစ်ကြိမ်စစ်ပါ။ Concentrate/premix/sauce brand၊ batch၊ bean/roast၊ ခွက်အရွယ်၊ ချိန်ထားသော g၊ အချို/အချဉ်/အခါးနှင့် ရေခဲပျော်ပြီး 5 min အရသာကို မှတ်တမ်းရေးပါ။ အချိုကို 2 g အဆင့်ဖြင့် တစ်မျိုးချင်းသာပြင်ပါ။",
  );
  steps.push(
    group === "foam"
      ? "Batch 100 g သည် အရောအစပ် input mass ဖြစ်သည်။ လည်ပြီး ရရှိသော g ကို ပြန်ချိန်မှ actual yield သိနိုင်သည်။ ရောင်းချသည့် topping 40 g/ခွက်ဖြင့် theoretical 2.5 portions ရနိုင်ပြီး jug loss ရှိနိုင်သည်။"
      : "ခွက်အပြင်ဘက်သန့်ရှင်းမှု၊ အဖုံးလွတ်နေရာ၊ layer နှင့် foam စစ်ပြီး ချက်ချင်းတည်ခင်းပါ။ Oreo ပါလျှင် ကျယ်သောစုပ်တံ/ဇွန်းပေးပြီး အပို Oreo garnish မထည့်ပါနှင့် — recipe ထဲက 20/15 g သာ သုံးထားသည်။",
  );
  steps.push(
    "နို့/cream/အသီးပါဖျော်ရည်ကို ကြိုဖျော်သိမ်းမထားပါနှင့်။ Base ကို small batch ပြုလုပ်၊ ချက်ချင်း ≤4°C တွင် ဖုံးအုပ်၊ အချိန်ရေးပြီး ထိုနေ့အတွင်းသာသုံးရန် ဆိုင်၏ conservative trial rule ထားပါ။ Label ၏ ပိုတိုသောကန့်သတ်ချက်ကို လိုက်ပါ။ အပြင်တွင် စုစုပေါင်း 2 h ကျော် (ပတ်ဝန်းကျင် >32°C ဆို 1 h ကျော်) နေလျှင် စွန့်ပစ်ပါ။",
  );
  catalog.recipes.push({
    id,
    menuNumber,
    sourceTitle: name,
    englishName: name,
    burmeseName: mm,
    categoryId,
    line: group === "coffee" ? "barista" : "cold",
    image: null,
    cupSizes: group === "foam" ? [] : [16],
    ingredients,
    steps,
    notes: [
      "Professional Trial Recipe — ပစ္စည်း brand အတည်မသိသေးသောကြောင့် ဆိုင်ရောင်းမီ taste test လုပ်ရမည်။ နိုင်ငံတကာတရားဝင် recipe standard ဟု မဆိုလိုပါ။",
      "ပါဝင်ပစ္စည်း g အားလုံးသည် input mass ဖြစ်သည်။ Coffee dose 16 g သည် espresso ထုတ်ရန်သီးခြားသုံးပြီး finished drink total ထဲ မပေါင်းပါ။",
      "နို့ ml ≈ g ÷ 1.03 ဟု ကနဦးခန့်မှန်းနိုင်သော်လည်း လက်ရှိ brand ကို 100 ml ချိန်တိုင်းပြီး converter သုံးပါ။ Syrup/sauce/concentrate/purée/foam နှင့် powder ၏ ml ကို သိပ်သည်းဆမတိုင်းမီ မခန့်မှန်းပါ။",
      "ပုံအစစ် မရရှိသေး — အခြားဖျော်ရည်ပုံဖြင့် ကိုယ်စားမပြထားပါ။",
    ],
    espressoDose: group === "coffee" ? "16 g" : null,
    espressoYield: group === "coffee" ? "32 g" : null,
    iceQuantity: group === "foam" ? null : "180 g",
    milkQuantity: rows.find(([n]) => n === "နို့အေး")?.[1] + " g",
    waterQuantity: null,
    sweetnessLevel: "brand အလိုက် စမ်းသပ်ညှိရန်",
    version: 1,
    updatedAt: "2026-11-06T18:30:00.000Z",
    verification: "source-unverified",
  });
  const last = catalog.recipes.at(-1);
  if (last.milkQuantity === "undefined g") last.milkQuantity = null;
  last.sourceIngredients = structuredClone(last.ingredients);
  if (group === "foam")
    last.steps.splice(
      5,
      0,
      "လည်ပြီး jug ကို scale ပေါ်ပြန်တင်၍ foam actual yield ကို မှတ်ပါ။ Foam ထဲလေဝင်ခြင်းက volume တိုးစေသော်လည်း အလေးချိန်ကို မတိုးစေပါ။",
      "သုံးမည့် beverage တွင် foam 40 g ထည့်လျှင် ထို 40 g ကိုသာ ingredient total ထဲပေါင်းပါ။ CF-01/02 batch 100 g ကို ခွက်တစ်ခုစာ total ထဲ ထပ်မပေါင်းပါနှင့်။",
    );
  report.requests.push({ name, action: "added", id, menuNumber });
}
catalog.seedVersion = (catalog.seedVersion || 0) + 1;
report.newCount = report.requests.filter((x) => x.action === "added").length;
report.finalCount = catalog.recipes.length;
fs.writeFileSync(file, JSON.stringify(catalog, null, 2) + "\n");
fs.writeFileSync(
  "docs/menu-expansion-audit.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify(report, null, 2));
