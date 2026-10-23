// Offline, deterministic preparation of manually reviewed, openly licensed photographs.
// Usage: node scripts/prepare-photos.mjs /path/to/downloaded-originals
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { createHash } from "node:crypto";
import sharp from "sharp";
const originals = process.argv[2];
if (!originals)
  throw Error("Supply the directory of reviewed source photographs");
const rows = (await readFile("docs/photos/sources.tsv", "utf8"))
  .trim()
  .split("\n")
  .slice(1)
  .map((line) => {
    const [key, title, author, license] = line.split("\t");
    if (!key || !title || !author || !license)
      throw Error("Incomplete source record");
    return { key, title, author, license };
  });
await mkdir("public/photos", { recursive: true });
await mkdir("src/photos", { recursive: true });
const photos = {};
const licenseURL = (license, source) => {
  if (license === "Public domain") return source;
  if (license === "CC0 1.0")
    return "https://creativecommons.org/publicdomain/zero/1.0/";
  const parts = license.match(/^CC (BY(?:-SA)?) (\d\.\d)$/);
  if (!parts) throw Error("Unreviewed license " + license);
  return `https://creativecommons.org/licenses/${parts[1].toLowerCase()}/${parts[2]}/`;
};
for (const r of rows) {
  const input = await readFile(join(originals, r.title.replaceAll(" ", "_")));
  const sourceUrl =
    "https://commons.wikimedia.org/wiki/File:" + r.title.replaceAll(" ", "_");
  const variants = {};
  for (const [size, quality] of [
    [320, 75],
    [800, 82],
  ]) {
    const { data, info } = await sharp(input)
      .rotate()
      .resize({
        width: size,
        height: size,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality })
      .toBuffer({ resolveWithObject: true });
    const hash = createHash("sha256").update(data).digest("hex");
    const file = `photos/${r.key}-${size}-${hash.slice(0, 12)}.webp`;
    await writeFile("public/" + file, data);
    variants[size] = {
      file,
      width: info.width,
      height: info.height,
      bytes: data.length,
      sha256: hash,
    };
  }
  photos[r.key] = {
    title: r.title,
    author: r.author,
    license: r.license,
    sourceUrl,
    licenseUrl: licenseURL(r.license, sourceUrl),
    changes:
      "Resized and re-encoded as WebP. Display uses a crop; no generated content or ingredient edits.",
    sourceSha256: createHash("sha256").update(input).digest("hex"),
    small: variants[320],
    large: variants[800],
  };
}
const catalog = JSON.parse(await readFile("public/recipes.json", "utf8"));
const recipes = {};
const style = (photo) => ({ photo, kind: "style" });
const ingredient = (photo) => ({ photo, kind: "ingredient" });
const prep = {
  "prep-simple-syrup": style("sugar-syrup"),
  "prep-brown-sugar-syrup": ingredient("brown-sugar"),
  "prep-vanilla-bean-syrup": ingredient("vanilla"),
  "prep-cocoa-sauce": style("chocolate-sauce"),
  "prep-caramel-water-sauce": style("caramel-sauce"),
  "prep-strawberry-sauce": style("strawberry-puree"),
  "prep-lemon-cordial": ingredient("citrus"),
  "prep-lime-cordial": ingredient("citrus"),
  "prep-orange-cordial": ingredient("orange-juice"),
  "prep-mango-puree": style("mango-puree"),
  "prep-strawberry-puree": style("strawberry-puree"),
  "prep-pineapple-puree": ingredient("pineapple"),
};
function select(r) {
  if (prep[r.id]) return prep[r.id];
  const n = r.englishName;
  if (/Ube/.test(n)) return style("ube-latte");
  if (/Egg Coffee/.test(n)) return style("egg-coffee");
  if (/Affogato/.test(n)) return style("affogato");
  if (/Turkish/.test(n)) return style("turkish-coffee");
  if (/AeroPress/.test(n)) return style("aeropress");
  if (/French Press/.test(n)) return style("french-press");
  if (/V60|Filter Coffee|Cold Drip/.test(n)) return style("pour-over");
  if (/Dalgona/.test(n))
    return style(/Matcha/.test(n) ? "iced-matcha" : "dalgona");
  if (/Vietnamese/.test(n)) return style("vietnamese-coffee");
  if (/Greek Frappé/.test(n)) return style("greek-frappe");
  if (r.line === "barista") {
    if (/Frappe/.test(n)) return style("coffee-frappe");
    if (/Tonic|Soda|Sparkling|Spritz|Fizz|Ginger Beer/.test(n))
      return style("espresso-tonic");
    if (/Cold Brew/.test(n))
      return style(/Latte/.test(n) ? "iced-latte" : "cold-brew");
    if (/Hot Flat White/.test(n)) return style("flat-white");
    if (/Hot Cappuccino/.test(n)) return style("cappuccino");
    if (
      /^(Hot (Double )?Espresso|Ristretto|Doppio Ristretto|Lungo|Espresso Con Panna|Espresso Macchiato|Hot Macchiato|Kopi Tubruk|Moka Pot Coffee)$/.test(
        n,
      )
    )
      return style("espresso");
    if (
      /Americano|Black Coffee|Long Black|Ristretto Black|Oliang|Shakerato|Freddo Espresso|Mazagran/.test(
        n,
      )
    )
      return style(/Hot/.test(n) ? "espresso" : "iced-americano");
    if (
      /Fruit Espresso/.test(n) ||
      /^(Pineapple|Mango|Strawberry|Apple|Watermelon|Mandarin|Passion Fruit|Grapefruit|Lemon Basil|Lychee).*Espresso/.test(
        n,
      )
    )
      return style("iced-americano");
    return style(
      /Iced|Ice|Yen|Cream|Dirty|Susu/.test(n) ? "iced-latte" : "hot-latte",
    );
  }
  if (/Oreo/.test(n)) return style("oreo-milkshake");
  if (/Butterfly Pea/.test(n)) return style("butterfly-pea");
  if (/Hibiscus|Roselle/.test(n)) return style("hibiscus");
  if (/Black Sesame/.test(n)) return style("sesame-milk");
  if (/Thai Milk Tea|Thai Tea Frappe/.test(n)) return style("thai-tea");
  if (/Taro/.test(n)) return style("taro-milk");
  if (/Matcha|Green Milk Tea/.test(n))
    return style(/^Hot/.test(n) ? "hot-matcha" : "iced-matcha");
  if (/Hojicha|Genmaicha|Earl Grey|London Fog|Milk Tea|Teh Tarik/.test(n))
    return style("milk-tea");
  if (/Cocoa|Chocolate/.test(n))
    return style(/^Hot/.test(n) ? "hot-chocolate" : "chocolate-milk");
  if (/Rose Milk/.test(n)) return style("rose-milk");
  if (/Smoothie/.test(n)) {
    if (/Mango/.test(n)) return style("mango-smoothie");
    if (/Banana/.test(n)) return style("banana-milk");
    if (/Berry/.test(n)) return ingredient("berries");
    return style("strawberry-smoothie");
  }
  if (/Blue Lemon|Blue Lagoon/.test(n)) return style("blue-lemonade");
  if (/Virgin Mojito/.test(n)) return style("mojito");
  if (/Strawberry Soda|Strawberry Mint Cooler/.test(n))
    return style("strawberry-soda");
  if (/Peach Tea/.test(n)) return style("peach-tea");
  if (/Banana Milk/.test(n)) return style("banana-milk");
  if (/Mango/.test(n)) return ingredient("mango");
  if (/Lychee/.test(n)) return ingredient("lychee");
  if (/Passion/.test(n)) return ingredient("passion-fruit");
  if (/Pineapple/.test(n)) return ingredient("pineapple");
  if (/Watermelon/.test(n)) return ingredient("watermelon");
  if (/Kiwi/.test(n)) return ingredient("kiwi");
  if (/Yuzu/.test(n)) return ingredient("yuzu");
  if (/Grapefruit/.test(n)) return ingredient("grapefruit");
  if (/Cucumber/.test(n)) return ingredient("cucumber");
  if (/Coconut|Piña Colada/.test(n)) return ingredient("coconut");
  if (/Apple/.test(n)) return ingredient("apple");
  if (/Peach/.test(n)) return ingredient("peach");
  if (/Berry|Blueberry|Raspberry/.test(n)) return ingredient("berries");
  if (/Strawberry/.test(n)) return style("strawberry-smoothie");
  if (/Brown Sugar/.test(n)) return ingredient("brown-sugar");
  if (/Lemon|Lime|Ginger|Tamarind|Plum|Pomelo/.test(n))
    return style("lemonade");
  if (/Tea|Chamomile|Cascara/.test(n)) return style("fruit-tea");
  if (/Frappe/.test(n)) return style("banana-milk");
  if (/Sunrise|Punch|Orange/.test(n)) return style("orange-juice");
  throw Error("Needs a reviewed photo decision: " + r.id + " " + n);
}
for (const r of catalog.recipes) {
  const selected = select(r);
  if (!photos[selected.photo]) throw Error("Missing photo " + selected.photo);
  recipes[r.id] = selected;
}
const document = {
  schemaVersion: 1,
  reviewedAt: "2026-10-22",
  photos,
  recipes,
};
await writeFile(
  "src/photos/catalog.json",
  JSON.stringify(document, null, 2) + "\n",
);
const credits = [
  "# Photograph credits",
  "",
  "These are reference photographs, not photographs of owner-tested recipe batches. Ingredient photographs are explicitly labelled in the app. Flavours, toppings, brands, glassware, temperatures and proportions may differ. No endorsement is implied.",
  "",
  "All local derivatives are resized/re-encoded WebP versions; the display can crop them. Each derivative remains under the source license listed below. No generated imagery is used. Source files are independently licensed from the application code.",
  "",
  ...Object.entries(photos).flatMap(([key, p]) => [
    `## ${key}`,
    ``,
    `**${p.title}** — ${p.author}. [Source](${p.sourceUrl.replaceAll(" ", "%20")}) · [${p.license}](${p.licenseUrl}).`,
    ``,
    p.changes,
    ``,
    `Local: ${p.small.file}, ${p.large.file}`,
    ``,
  ]),
].join("\n");
await writeFile("docs/photos/CREDITS.md", credits);
const escape = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll('"', "&quot;");
const html = `<!doctype html><html lang="my"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>9Floor V2 · ဓာတ်ပုံရင်းမြစ်</title><style>body{max-width:850px;margin:32px auto;padding:0 20px;font:16px/1.9 system-ui;background:#f8f5ee;color:#193d32}section{padding:20px 0;border-bottom:1px solid #ccc}a{color:inherit}small{display:block}</style><h1>ဓာတ်ပုံရှင်များနှင့် အသုံးပြုခွင့်</h1><p>လူတကယ်ရိုက်ထားသော ကိုးကားဓာတ်ပုံများဖြစ်သည်။ ဆိုင်၏ဖျော်နည်းအတိုင်း ဖျော်ထားသောပုံ မဟုတ်ပါ။ အမျိုးအစားတူပုံကို မီနူးအများအတွက် အသုံးပြုထားနိုင်သည်။ ပုံအရွယ်လျှော့၊ WebP ပြောင်းပြီး မြင်ကွင်းအလိုက် ဖြတ်ပြထားသည်။ သက်ဆိုင်ရာ ပုံလိုင်စင်များအတိုင်း ဆက်လက်အသုံးပြုနိုင်သည်။</p>${Object.entries(
  photos,
)
  .map(
    ([key, p]) =>
      `<section id="${escape(key)}"><h2>${escape(p.title)}</h2><p>${escape(p.author)}</p><a href="${escape(p.sourceUrl)}">မူရင်းဓာတ်ပုံ</a> · <a href="${escape(p.licenseUrl)}">${escape(p.license)}</a><small>${escape(p.changes)}</small></section>`,
  )
  .join("")}</html>`;
await writeFile("public/photo-credits.html", html);
console.log(
  `${rows.length} photographs / ${Object.keys(recipes).length} recipe mappings; original recipe records unchanged`,
);
