import type { Recipe, Catalog } from "./model";
import { countries } from "./international";
import { qualityFor } from "./quality";
export const searchAliases = [
  ["oreo", "အိုရီယို", "အိုရီအို"],
  ["taro", "ပိန်းဥ", "တာရို"],
  ["matcha", "မတ်ချာ", "မက်ချာ", "မတ်ချပ်"],
  ["vanilla", "ဗနီလာ", "ဗန်နီလာ"],
  ["caramel", "ကာရာမယ်", "ကယ်ရာမယ်"],
  ["chocolate", "ချောကလက်", "cocoa", "ကိုကိုး"],
  ["passion", "ပက်ရှင်", "ပက်ရှင်ဖရု"],
  ["lychee", "လိုင်ချီး", "လီချီး"],
  ["strawberry", "စတော်ဘယ်ရီ", "စတော်ဘယ်ရီသီး"],
  ["blue", "ဘလူး"],
  ["mixed berry", "mixedberry", "ဘယ်ရီစုံ", "ဘယ်ရီမစ်"],
  ["milk", "နို့"],
  ["coffee", "ကော်ဖီ"],
  ["soda", "ဆိုဒါ"],
  ["foam", "အမြှုပ်"],
  ["sweet", "အချို"],
  ["sour", "အချဉ်"],
  ["bitter", "အခါး"],
  ["creamy", "နို့ဆန်"],
  ["iced", "အအေး"],
  ["hot", "အပူ"],
];
const documentCache = new WeakMap<
  Recipe,
  { categories: Catalog["categories"]; text: string }
>();
export function normalizeSearch(s: string) {
  return s
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/[၀-၉]/g, (x) => String(x.charCodeAt(0) - 0x1040))
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
const compact = (s: string) =>
  normalizeSearch(s).replace(/[\s\p{P}\p{S}]+/gu, "");
export function recipeSearchText(
  r: Recipe,
  categories: Catalog["categories"] = [],
) {
  const cached = documentCache.get(r);
  if (cached?.categories === categories) return cached.text;
  const q = qualityFor(r);
  const style = countries
    .filter((c) => c.pattern.test(r.englishName))
    .map((c) => c.name)
    .join(" ");
  let text = [
    r.id,
    r.menuNumber,
    r.englishName,
    r.burmeseName,
    r.categoryId,
    categories.find((c) => c.id === r.categoryId)?.name,
    r.ingredients.map((i) => i.name).join(" "),
    q.mode,
    q.aroma,
    q.expected,
    style,
  ]
    .filter(Boolean)
    .join(" ");
  for (const aliases of searchAliases)
    if (aliases.some((a) => compact(text).includes(compact(a))))
      text += " " + aliases.join(" ");
  const normalized = normalizeSearch(text);
  documentCache.set(r, { categories, text: normalized });
  return normalized;
}
function near(a: string, b: string) {
  if (a === b) return true;
  if (a.length < 5 || Math.abs(a.length - b.length) > 1) return false;
  let i = 0,
    j = 0,
    edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
      continue;
    }
    if (++edits > 1) return false;
    if (a.length >= b.length) i++;
    if (b.length >= a.length) j++;
  }
  return edits + (i < a.length || j < b.length ? 1 : 0) <= 1;
}
export function searchRecipes(
  recipes: Recipe[],
  query: string,
  categories: Catalog["categories"] = [],
) {
  const q = normalizeSearch(query);
  if (!q) return recipes;
  if (/^[a-z]*-?\d[\w-]*$/i.test(q)) {
    const exact=recipes.filter(r=>normalizeSearch(r.menuNumber||'')===q||normalizeSearch(r.id)===q);
    if(exact.length)return exact;
  }
  return recipes.filter((r) => {
    const text = recipeSearchText(r, categories);
    if (compact(text).includes(compact(q))) return true;
    return q
      .split(" ")
      .every(
        (t) =>
          text.includes(t) ||
          (/^[a-z]{5,}$/.test(t) &&
            text.split(/[^a-z]+/).some((w) => near(t, w))),
      );
  });
}
