// Manually transcribed from the user's 310.13-second recording.
// No guessed ice weights, brewing times, temperatures or 16oz conversions.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
const video = process.argv[2];
if (!video) throw Error("Pass the source recording path");
const sha256 = createHash("sha256").update(readFileSync(video)).digest("hex");
const file = "ScreenRecording_11-15-2026 08-48-32_1-compressed(1).mp4";
const categoryId = "video-tea-refreshing";
const entries = [];
const add = (name, quantity, text, extra = {}) => ({
  name,
  quantity,
  text,
  ...extra,
});
const stir = (text = "ဇွန်းဖြင့် အောက်ခြေက အရည်များ ရောသွားအောင် မွှေပါ။") => ({
  text,
  phase: "serve",
});
const ice = () =>
  add(
    "ရေခဲ",
    "ခွက်ပြည့် (Video တွင် g မဖော်ပြ)",
    "ယခုမှ ရေခဲကို ခွက်ပြည့်အောင် ဖြည့်ပါ။",
  );
const soda = (ml, first = false) =>
  add(
    first ? "ဆိုဒါရည် — အောက်ခံရောရန်" : "ဆိုဒါရည် — ရေခဲပေါ်ဖြည့်ရန်",
    `${ml} ml`,
    `ဆိုဒါရည် ${ml} ml ကို ${first ? "ခွက်အောက်ခံထဲ" : "ရေခဲပေါ်မှ ဖြည်းဖြည်း"} လောင်းထည့်ပါ။`,
  );
const water = (ml) =>
  add("ရိုးရိုးရေ", `${ml} ml`, `ရိုးရိုးရေ ${ml} ml ထည့်ပါ။`);
const syrup = (ml) =>
  add("သကြားရည် (Cane syrup)", `${ml} ml`, `သကြားရည် ${ml} ml ထည့်ပါ။`);
const lime = (ml) =>
  add(
    "သံပုရာရည် (Lime juice)",
    `${ml} ml`,
    `သံပုရာရည် ${ml} ml ကို စစ်ဇကာမှတစ်ဆင့် ခွက်ထဲစစ်ထည့်ပါ။`,
  );
const honey = (ml) =>
  add(
    "ပျားရည်",
    `${ml} ml`,
    `ပျားရည် ${ml} ml ကို အရင်ဆုံး ခွက်အောက်ခြေထဲထည့်ပါ။`,
  );
const red = (ml) =>
  add(
    "Thai Red Syrup (Sala)",
    `${ml} ml`,
    `Sala အနံ့ Thai Red Syrup ${ml} ml ထည့်ပါ။`,
  );
const plum = () =>
  add(
    "ဆားစိမ်ဇီးသီး (Pickled plum)",
    "3 လုံး",
    "ဆားစိမ်ဇီးသီး 3 လုံးကို ခွက်အောက်ခြေထဲ အရင်ထည့်ပါ။",
  );
const plumJuice = () =>
  add("ဇီးသီးစိမ်ရည်", "20 ml", "ဇီးသီးစိမ်ရည် 20 ml ထည့်ပါ။");
const crush = () => stir("ဇွန်းဖြင့် ဇီးသီးအသားကို ခွက်အောက်ခြေမှာ ဖိချေပါ။");
const tea = (ml, green = false) =>
  add(
    green ? "စစ်ပြီး Thai Green Tea အရည်" : "စစ်ပြီး Thai Tea အရည်",
    `${ml} ml`,
    `${green ? "Thai Green Tea" : "Thai Tea"} အရည် ${ml} ml ကို ${ml === 70 ? "ရေခဲပေါ် နောက်ဆုံးမှ ဖြည်းဖြည်း" : "ခွက်ထဲ"} လောင်းထည့်ပါ။`,
  );
const garnish = () =>
  add(
    "သံပုရာအဝိုင်း — အလှဆင်",
    "Video တွင် အရေအတွက်မသတ်မှတ်",
    "Video အတိုင်း သံပုရာအဝိုင်းတင်၍ အလှဆင်ပါ။",
    { phase: "finish" },
  );
function entry(
  part,
  name,
  mm,
  size,
  range,
  time,
  actions,
  notes = [],
  suffix = "",
  crop = "420:720:35:190",
) {
  entries.push({
    part,
    name,
    mm,
    size,
    range,
    time,
    actions,
    notes,
    suffix,
    crop,
  });
}
entry(1, "Red Lime Soda", "သံပုရာ အနီဆိုဒါ", 20, "00:00–00:13", 12.2, [
  lime(30),
  red(40),
  stir(),
  ice(),
  soda(150),
  garnish(),
]);
entry(2, "Orange Soda", "လိမ္မော် ဆိုဒါ", 20, "00:13–00:26", 25, [
  water(30),
  syrup(20),
  add(
    "လိမ္မော်ဖျော်ရည်အနှစ် (Orange concentrate)",
    "30 ml",
    "လိမ္မော်ဖျော်ရည်အနှစ် 30 ml ထည့်ပါ။",
  ),
  stir(),
  ice(),
  soda(120),
]);
entry(3, "Honey Lime Soda", "ပျားရည် သံပုရာဆိုဒါ", 20, "00:26–00:38", 36, [
  {
    text: "ခွက်အသေးထဲ ပျားရည် 30 ml နှင့် ရေနွေး 20 ml ကို ရောထားပါ။ Video မှာ ထိုနှစ်မျိုးကို တစ်ခွက်ထဲမှ လောင်းပြထားသည်။",
    phase: "prepare",
    vessel: "ပျားရည်ရောခွက်",
    items: [
      ["ပျားရည်", "30 ml"],
      ["ရေနွေး", "20 ml"],
    ],
    produce: "honey-mix",
  },
  lime(25),
  {
    text: "ပျားရည်နှင့် ရေနွေး ရောထားသောအရည် အားလုံးကို သံပုရာရည်ရှိသော သောက်ခွက်ထဲ လောင်းထည့်ပါ။",
    take: ["honey-mix"],
  },
  stir(),
  ice(),
  soda(120),
  garnish(),
]);
entry(
  4,
  "Lime Black Tea",
  "သံပုရာ ထိုင်းလက်ဖက်ရည်အေး",
  20,
  "00:38–00:52",
  50,
  [
    lime(30),
    syrup(40),
    tea(120),
    water(40),
    stir(),
    ice(),
    stir("ရေခဲထည့်ပြီးနောက် ထပ်မွှေပါ။"),
    garnish(),
  ],
  [
    "ဤ Part တွင် Thai Tea အရည် 120 ml ကိုသာပြထားပြီး လက်ဖက်မှုန့်ပမာဏ၊ နှပ်ချိန်နှင့် ရေအပူချိန် မဖော်ပြပါ။",
  ],
);
entry(
  5,
  "Thai Red Soda 32 oz",
  "ထိုင်း အနီဆိုဒါ ခွက်ကြီး",
  32,
  "00:52–01:04",
  63,
  [soda(90, true), red(90), stir(), ice(), soda(230)],
  [
    "Video ထဲတွင် Hale’s Blue Boy Sala syrup ကိုသုံးထားသည်။ ဆိုဒါရည် စုစုပေါင်း 320 ml ဖြစ်ပြီး အရင် 90 ml၊ နောက် 230 ml ခွဲထည့်ပါ။",
  ],
);
entry(6, "Pineapple Soda 20 oz", "နာနတ်သီးဆိုဒါ 20 oz", 20, "01:04–01:20", 78, [
  add(
    "Ding Fong နာနတ်သီးအနှစ် (Pineapple squash)",
    "50 ml",
    "နာနတ်သီးအနှစ် 50 ml ကို ခွက်အောက်ခြေထဲ အရင်လောင်းပါ။",
  ),
  ice(),
  soda(120),
]);
entry(
  7,
  "Pineapple Soda 16 oz",
  "နာနတ်သီးဆိုဒါ 16 oz",
  16,
  "01:20–01:32",
  90,
  [
    soda(40, true),
    add(
      "Ding Fong နာနတ်သီးအနှစ် (Pineapple squash)",
      "40 ml",
      "နာနတ်သီးအနှစ် 40 ml ထည့်ပါ။",
    ),
    stir(),
    ice(),
    soda(100),
  ],
  [
    "ဆိုဒါရည် စုစုပေါင်း 140 ml ဖြစ်ပြီး အောက်ခံ 40 ml၊ အပေါ်ဖြည့် 100 ml ခွဲထည့်သည်။",
  ],
);
entry(
  8,
  "Thai Black Tea 20 oz",
  "ထိုင်း လက်ဖက်ရည်အေး 20 oz",
  20,
  "01:32–01:45",
  141,
  [
    syrup(40),
    tea(150),
    stir(),
    ice(),
    stir("ရေခဲထည့်ပြီး ထပ်မွှေကာ အဖုံးပိတ်ပါ။"),
  ],
  [
    "လက်ဖက်ရည်အရည် 150 ml အဆင်သင့်ကို သုံးပြထားသည်။ ဤ Part တွင် လက်ဖက်မှုန့်ပမာဏနှင့် နှပ်ချိန် မပါပါ။",
  ],
);
entry(
  9,
  "Thai Red Soda 20 oz",
  "ထိုင်း အနီဆိုဒါ 20 oz",
  20,
  "01:45–02:00",
  158,
  [soda(40, true), red(50), stir(), ice(), soda(120)],
  [
    "ဆိုဒါရည် စုစုပေါင်း 160 ml ဖြစ်သည်။ Part ၅ 32 oz ဖော်မြူလာနှင့် မရောပါနှင့်။",
  ],
);
entry(
  10,
  "Thai Black Tea Lime",
  "သံပုရာ ထိုင်းလက်ဖက်ရည်အေး — Part 10",
  20,
  "02:00–02:16",
  213,
  [
    lime(30),
    syrup(40),
    tea(120),
    water(40),
    stir(),
    ice(),
    stir("ရေခဲထည့်ပြီး ထပ်မွှေပါ။"),
  ],
  [
    "Video စာတန်းတွင် Thai Tea 120 ml (10 g tea mix) ဟုဖော်ပြသည်။ လက်ဖက်နှပ်ရန် ရေပမာဏ၊ အပူချိန်နှင့် နှပ်ချိန် မဖော်ပြပါ။",
    "Part ၄ နှင့် ပါဝင်ပမာဏတူသော်လည်း မူရင်း Part နံပါတ်အတိုင်း သီးသန့်ထားသည်။",
  ],
);
entry(11, "Pickled Plum Soda", "ဆားဇီးသီး ဆိုဒါ", 20, "02:16–02:36", 234, [
  plum(),
  plumJuice(),
  crush(),
  syrup(40),
  stir(),
  ice(),
  soda(140),
]);
entry(12, "Honey Soda", "ပျားရည် ဆိုဒါ", 20, "02:36–02:52", 250, [
  honey(30),
  add("ရေနွေး", "30 ml", "ပျားရည်ရှိသောခွက်ထဲ ရေနွေး 30 ml ထည့်ပါ။"),
  stir("ပျားရည်ပျော်သွားအောင် မွှေပါ။"),
  ice(),
  soda(140),
]);
for (const [suffix, name, mm, x] of [
  ["a", "Strawberry Soda", "စတော်ဘယ်ရီ ဆိုဒါ", 5],
  ["b", "Mixed Berry Soda", "ဘယ်ရီစုံ ဆိုဒါ", 253],
]) {
  const fruit = suffix === "a" ? "Strawberry" : "Mixed Berry";
  entry(
    13,
    name,
    mm,
    20,
    "02:52–03:14",
    193,
    [
      add(
        `Nature Taste ${fruit} Fruit Based Preparation`,
        "40 ml",
        `${fruit} အသီးအနှစ် 40 ml ကို ခွက်အောက်ခြေထဲ အရင်ထည့်ပါ။`,
      ),
      soda(40, true),
      stir(),
      ice(),
      soda(120),
    ],
    [
      "Part ၁၃ တွင် နှစ်ခွက်ကို ယှဉ်ဖျော်ပြထားသည်။ ဤပမာဏသည် ဤမီနူးတစ်ခွက်စာသာ ဖြစ်သည်။",
      "Video မှာ Nature Taste ကိုသုံးထားသည်။ LongBeach နှင့် တံဆိပ်မတူသဖြင့် အရသာတူညီမည်ဟု မအတည်ပြုထားပါ။",
    ],
    suffix,
    `250:620:${x}:280`,
  );
}
entry(
  14,
  "Thai Green Tea Honey",
  "ပျားရည် ထိုင်းဂရင်းတီး",
  20,
  "03:14–03:30",
  208,
  [
    honey(30),
    water(100),
    stir("ပျားရည်နှင့် ရေ ရောသွားအောင် မွှေပါ။"),
    ice(),
    tea(70, true),
  ],
  [
    "Thai Green Tea အမှုန့် 10 g + ရေနွေး 100 ml ဖြင့် ထုတ်ထားသော လက်ဖက်ရည်အရည် 70 ml ကို နောက်ဆုံးအပေါ်မှ လောင်းပြထားသည်။ လက်ဖက်ဖတ်ကို သောက်ခွက်ထဲမထည့်ပါနှင့်။",
    "လက်ဖက်နှပ်ချိန်၊ အပူချိန်ကို Video တွင် မဖော်ပြပါ။",
  ],
);
for (const [suffix, green, x] of [
  ["a", true, 5],
  ["b", false, 254],
]) {
  entry(
    15,
    green ? "Thai Green Tea 16 oz" : "Thai Black Tea 16 oz",
    green ? "ထိုင်းဂရင်းတီးအေး 16 oz" : "ထိုင်းလက်ဖက်ရည်အေး 16 oz",
    16,
    "03:30–03:46",
    224,
    [syrup(30), tea(120, green), water(30), stir(), ice()],
    [
      "တစ်ခွက်စာ လက်ဖက်အမှုန့် 10 g + ရေနွေး 150 ml ဖြင့် ထုတ်ပြီး စစ်ထားသော လက်ဖက်ရည်အရည် 120 ml သုံးသည်။ ထို့အပြင် သောက်ခွက်ထဲ ရိုးရိုးရေ 30 ml ကို သီးသန့်ထည့်သည်။",
      "Video တွင် နှစ်မျိုးယှဉ်ဖျော်ထားခြင်းဖြစ်ပြီး ပမာဏများကို တစ်ခွက်စာစီ ဖော်ပြထားသည်။ နှပ်ချိန်/အပူချိန် မဖော်ပြပါ။",
    ],
    suffix,
    `250:620:${x}:280`,
  );
}
entry(
  16,
  "Mint Soda",
  "ပူဒီနာ ဆိုဒါ",
  20,
  "03:46–03:58",
  237,
  [
    add(
      "LongBeach Mint Syrup",
      "50 ml",
      "LongBeach Mint Syrup 50 ml ကို အရင်ထည့်ပါ။",
    ),
    soda(30, true),
    stir(),
    ice(),
    soda(120),
  ],
  ["ဆိုဒါရည် စုစုပေါင်း 150 ml — အရင် 30 ml၊ နောက် 120 ml ဖြစ်သည်။"],
);
entry(
  17,
  "Thai Black Tea Honey",
  "ပျားရည် ထိုင်းလက်ဖက်ရည်အေး",
  20,
  "03:58–04:16",
  254,
  [
    honey(30),
    water(100),
    stir("ပျားရည်နှင့် ရေကို ရောမွှေပါ။"),
    ice(),
    tea(70),
  ],
  [
    "Thai Tea အမှုန့် 10 g + ရေနွေး 100 ml ဖြင့် ထုတ်ပြီး စစ်ထားသော လက်ဖက်ရည်အရည် 70 ml ကို အပေါ်မှလောင်းသည်။ လက်ဖက်နှပ်ချိန်/အပူချိန် မဖော်ပြပါ။",
  ],
);
entry(
  18,
  "Thai Red and Plum Soda",
  "အနီဆိုဒါ ဆားဇီးသီး",
  20,
  "04:16–04:32",
  271,
  [plum(), plumJuice(), crush(), red(50), stir(), ice(), soda("130–140")],
  [
    "အပေါ်ဖြည့်ဆိုဒါကို Video မှာ 130–140 ml ဟု အပိုင်းအခြားဖြင့် ဖော်ပြထားသည်။",
  ],
);
entry(19, "Yuzu Soda", "ယူဇူ ဆိုဒါ", 20, "04:32–04:46", 284, [
  add(
    "Nature Taste Yuzu Fruit Based Preparation",
    "50 ml",
    "Yuzu အသီးအနှစ် 50 ml ကို ခွက်အောက်ခြေထဲ ထည့်ပါ။",
  ),
  soda(30, true),
  stir(),
  ice(),
  soda(120),
]);
entry(
  20,
  "Chrysanthemum Blue Tea",
  "ဂန္ဓမာ ပဲပန်းပြာ လက်ဖက်ရည်အေး",
  20,
  "04:46–05:10",
  302,
  [
    add(
      "အချိုအသင့်ပါ ဂန္ဓမာအမှုန့် (Chrysanthemum powder)",
      "20 g",
      "Video မှာသုံးထားသော ဂန္ဓမာဖျော်မှုန့် 20 g ကို ခွက်အလွတ်ထဲ အရင်ထည့်ပါ။",
    ),
    water(180),
    stir("အမှုန့်ပျော်သွားအောင် မွှေပါ။"),
    ice(),
    add(
      "စစ်ပြီး ပဲပန်းပြာရည် (Butterfly pea tea)",
      "30 ml",
      "နောက်ဆုံးမှ ပဲပန်းပြာရည် 30 ml ကို ရေခဲပေါ် ဖြည်းဖြည်းလောင်းပြီး အပေါ်အလွှာပြာရောင်ပေါ်အောင်ထားပါ။",
    ),
  ],
  [
    "ဂန္ဓမာဖျော်မှုန့် 20 g သုံးထားခြင်းဖြစ်ပြီး ဂန္ဓမာပန်းခြောက် 20 g ဖြင့် အစားထိုးထားခြင်း မဟုတ်ပါ။",
    "ပဲပန်းပြာရည်ကြိုဖျော်ရာတွင် ပန်းပမာဏ၊ ရေပမာဏနှင့် နှပ်ချိန် မပြထားပါ။",
  ],
);

// Still times are absolute seconds in this recording, not the phone clock.
for (const e of entries) {
  const corrected = { 8: 102, 9: 118, 10: 133, 11: 154, 12: 170 };
  if (corrected[e.part]) e.time = corrected[e.part];
  if (e.part === 13)
    e.crop = e.suffix === "a" ? "250:620:4:280" : "250:620:252:280";
  if (e.part === 15) {
    e.time = 210.3;
    e.crop = e.suffix === "a" ? "270:460:0:390" : "236:460:276:390";
  }
  if ([14, 15, 17].includes(e.part)) {
    const green = e.part === 14 || (e.part === 15 && e.suffix === "a");
    const waterMl = e.part === 15 ? 150 : 100;
    const output = e.part === 15 ? 120 : 70;
    e.actions.unshift({
      phase: "prepare",
      vessel: "လက်ဖက်နှပ်ခွက်နှင့် စစ်ဇကာ",
      text: `${green ? "Thai Green Tea" : "Thai Tea"} အမှုန့် 10 g ကို ရေနွေး ${waterMl} ml ဖြင့် နှပ်၍ စစ်ပြီး လက်ဖက်ရည်အရည် ${output} ml ကို တိုင်းထားပါ။ Video တွင် နှပ်ချိန်နှင့် ရေအပူချိန် မဖော်ပြပါ။ အောက်က ပါဝင်ပစ္စည်းစာရင်းရှိ လက်ဖက်ရည်အရည်သည် ယခုထုတ်ထားသည့်အရည် ဖြစ်သည်။`,
    });
  }
}
const catalog = JSON.parse(readFileSync("public/recipes.json", "utf8"));
const plans = JSON.parse(readFileSync("src/assemblyCatalog.json", "utf8"));
catalog.recipes = catalog.recipes.filter((r) => !r.id.startsWith("video-tea-"));
catalog.categories = catalog.categories.filter((c) => c.id !== categoryId);
catalog.categories.push({
  id: categoryId,
  name: "Video Recipes · Tea & Refreshing · Part 01–20",
});
catalog.seedVersion = 7;
mkdirSync("public/video-tea", { recursive: true });
const manifest = {};
const mmTime = (t) =>
  `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
for (const e of entries) {
  const key = String(e.part).padStart(2, "0") + e.suffix;
  const id = "video-tea-" + key;
  const ingredients = [];
  let cupNumber = 0;
  const steps = e.actions.map((a) => {
    const uses = [];
    for (const [name, quantity] of a.items ||
      (a.name ? [[a.name, a.quantity]] : [])) {
      uses.push({ index: ingredients.length, part: 1 });
      ingredients.push({ name, quantity });
    }
    const s = {
      phase: a.phase || "cup",
      vessel: a.vessel || `${e.size} oz သောက်ခွက်`,
      text: a.text,
      uses,
      take: a.take || [],
    };
    if (a.produce) s.produce = a.produce;
    if (s.phase === "cup" || s.phase === "finish") s.cupNumber = ++cupNumber;
    return s;
  });
  const title = `${e.name} · Video Part ${key}`;
  const notes = [
    `မူရင်း — Joonyu Coffee House · tea & refreshing · Part ${e.part} · Video ${e.range} (ခန့်မှန်းအချိန်)။`,
    ...e.notes,
    "ရေခဲကို Video အတိုင်း ခွက်ပြည့်ထည့်သည်။ ရေခဲ g မဖော်ပြသဖြင့် အလေးချိန်ကို မခန့်မှန်းထားပါ။",
    "Video မှ ဖော်မြူလာကို ကူးရေးထားခြင်းဖြစ်ပြီး ကိုယ်တိုင်ဖျော်စမ်းအတည်ပြုထားခြင်း မရှိသေးပါ။",
  ];
  const warnings = e.notes.filter((n) => /မဖော်ပြ|မပါပါ|မအတည်ပြု/.test(n));
  const r = {
    id,
    menuNumber: "VDO-" + key,
    sourceTitle: `Joonyu Coffee House · tea & refreshing · Part ${e.part}`,
    englishName: title,
    burmeseName: e.mm,
    categoryId,
    line: "cold",
    image: null,
    cupSizes: [e.size],
    ingredients,
    steps: steps.map((s) => s.text),
    notes,
    espressoDose: null,
    espressoYield: null,
    iceQuantity: "ခွက်ပြည့် — g မဖော်ပြ",
    milkQuantity: null,
    waterQuantity: null,
    sweetnessLevel:
      e.part === 1 || e.part === 19 || e.part === 20
        ? "Video မူရင်းအချိုး"
        : "Video: 100% SWEET",
    version: 1,
    updatedAt: "2026-11-15T00:00:00.000Z",
    verification: "source-unverified",
    source: { file, sha256 },
  };
  r.sourceIngredients = ingredients;
  catalog.recipes.push(r);
  plans[id] = {
    name: title,
    sourceIngredients: ingredients,
    ingredients,
    kind: "drink",
    adjustments: [],
    warnings,
    steps,
    cupOrder: steps.filter((s) => s.cupNumber).map((s) => s.text),
  };
  const photo = `video-tea/part-${key}.webp`;
  execFileSync("ffmpeg", [
    "-hide_banner",
    "-loglevel",
    "error",
    "-y",
    "-ss",
    String(e.time),
    "-i",
    video,
    "-vf",
    `crop=${e.crop}`,
    "-frames:v",
    "1",
    "-c:v",
    "libwebp",
    "-quality",
    "88",
    "public/" + photo,
  ]);
  const photoBytes = readFileSync("public/" + photo);
  manifest[id] = {
    part: e.part,
    variant: e.suffix || null,
    name: e.name,
    range: e.range,
    frameSeconds: e.time,
    frameTime: mmTime(e.time),
    crop: e.crop,
    file: photo,
    sha256: createHash("sha256").update(photoBytes).digest("hex"),
    sourceSha256: sha256,
  };
}
writeFileSync("public/recipes.json", JSON.stringify(catalog, null, 2) + "\n");
writeFileSync(
  "src/assemblyCatalog.json",
  JSON.stringify(plans, null, 2) + "\n",
);
writeFileSync(
  "src/videoTeaPhotos.json",
  JSON.stringify(manifest, null, 2) + "\n",
);
// Reviewable transcript source is kept alongside the app and can be regenerated.
writeFileSync(
  "docs/video-tea-transcript.json",
  JSON.stringify({ file, sha256, duration: 310.133333, entries }, null, 2) +
    "\n",
);
console.log(
  `Added ${entries.length} video recipes; ${catalog.recipes.length} total. Source ${sha256}`,
);
