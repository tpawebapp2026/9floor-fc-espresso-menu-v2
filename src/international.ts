import type { Recipe } from "./model";
import { isMatcha, matchaStyle } from "./matcha";
// Editorial discovery links to the same recipe IDs; this is not a separate recipe database.
export const countries = [
  {
    name: "မလေးရှား",
    flag: "🇲🇾",
    pattern: /Malaysian|Teh Tarik/i,
    description: "Teh Tarik နို့လက်ဖက်ရည်စတိုင်",
  },
  {
    name: "ထိုင်ဝမ်",
    flag: "🇹🇼",
    pattern: /Taiwanese/i,
    description: "Brown Sugar Matcha နှင့် Tea Bar စတိုင်",
  },
  {
    name: "ဗီယက်နမ်",
    flag: "🇻🇳",
    pattern: /Vietnamese/i,
    description: "နို့ဆီကော်ဖီနှင့် Egg Coffee",
  },
  {
    name: "အီတလီ",
    flag: "🇮🇹",
    pattern:
      /^(Hot Espresso|Ristretto|Lungo|Shakerato|Espresso Romano|Bicerin|Marocchino|Affogato|Hot Cappuccino|Hot Macchiato)$/i,
    description: "Espresso နှင့် Italian Soda စတိုင်များ",
  },
  {
    name: "ထိုင်း",
    flag: "🇹🇭",
    pattern: /Thai|Oliang|Es Yen/i,
    description: "ထိုင်းကော်ဖီနှင့် လက်ဖက်ရည်",
  },
  {
    name: "ကိုရီးယား",
    flag: "🇰🇷",
    pattern: /Dalgona|Korean/i,
    description: "Dalgona နှင့် Cream Latte",
  },
  {
    name: "အင်ဒိုနီးရှား",
    flag: "🇮🇩",
    pattern: /Kopi Susu Gula Aren|Kopi Tubruk/i,
    description: "Kopi ကော်ဖီစတိုင်များ",
  },
  {
    name: "ဂရိ",
    flag: "🇬🇷",
    pattern: /Greek|Freddo/i,
    description: "Freddo နှင့် Frappé",
  },
  {
    name: "တူရကီ",
    flag: "🇹🇷",
    pattern: /Turkish/i,
    description: "Turkish Coffee",
  },
  { name: "စပိန်", flag: "🇪🇸", pattern: /Bombón/i, description: "Café Bombón" },
  {
    name: "ပြင်သစ်",
    flag: "🇫🇷",
    pattern: /Noisette|Café au Lait/i,
    description: "Café Noisette",
  },
  {
    name: "မက္ကဆီကို",
    flag: "🇲🇽",
    pattern: /Café de Olla/i,
    description: "Café de Olla",
  },
  {
    name: "ကျူးဘား",
    flag: "🇨🇺",
    pattern: /Cubano|Virgin.*Mojito/i,
    description: "Café Cubano နှင့် အရက်မပါ Mojito စတိုင်",
  },
  {
    name: "အမေရိကန်",
    flag: "🇺🇸",
    pattern: /New Orleans/i,
    description: "New Orleans Chicory",
  },
  {
    name: "ဂျပန်",
    flag: "🇯🇵",
    pattern: /Matcha|Hojicha|Genmaicha/i,
    description: "Matcha၊ Hojicha နှင့် Genmaicha စတိုင်များ",
  },
  {
    name: "ပွာတိုရီကို",
    flag: "🇵🇷",
    pattern: /Virgin Piña Colada/i,
    description: "အရက်မပါ Piña Colada စတိုင်",
  },
];
export const coldStyles = [
  {
    id: "tea",
    name: "Tea Bar",
    mm: "လက်ဖက်ရည်နှင့် Fruit Tea",
    categories: [
      "category-04",
      "category-09",
      "category-26",
      "category-28",
      "matcha-styles",
    ],
  },
  {
    id: "soda",
    name: "Soda Bar",
    mm: "Italian Soda နှင့် သစ်သီးဆိုဒါ",
    categories: ["category-07", "category-10"],
  },
  {
    id: "mocktail",
    name: "Mocktail Bar",
    mm: "အရက်မပါ နိုင်ငံတကာစတိုင်",
    categories: ["category-11"],
  },
  {
    id: "blended",
    name: "Smoothie & Frappé",
    mm: "သစ်သီးနှင့် ဖျော်ရေခဲ",
    categories: ["category-05", "category-06"],
  },
  {
    id: "milk",
    name: "Yogurt & Milk",
    mm: "ဒိန်ချဉ်နှင့် နို့ဖျော်ရည်",
    categories: ["category-12"],
  },
  {
    id: "refresher",
    name: "Fruit & Refreshers",
    mm: "သစ်သီးအအေးနှင့် Signature",
    categories: ["category-08", "category-13", "category-27"],
  },
];
export function countryRecipes(recipes: Recipe[], name: string) {
  return recipes.filter((r) =>
    isMatcha(r)
      ? matchaStyle(r)?.country === name
      : countries.find((c) => c.name === name)?.pattern.test(r.englishName) ||
        (name === "အီတလီ" &&
          (r.categoryId === "category-10" ||
            r.id === "style-italian-raspberry-float")),
  );
}
const extraStyles: Record<string, string[]> = {
  tea: [
    "style-thai-coconut-tea",
    "style-taiwanese-lychee-oolong",
    "style-malaysian-teh-tarik",
  ],
  soda: ["style-italian-raspberry-float"],
  mocktail: ["style-cuban-passion-mojito"],
  blended: ["style-japanese-hojicha-frappe"],
};
export function internationalRecipes(
  recipes: Recipe[],
  line = "",
  country = "",
  style = "",
) {
  const candidates = country
    ? countryRecipes(recipes, country)
    : recipes.filter(
        (r) =>
          r.line === "cold" ||
          countries.some((c) => c.pattern.test(r.englishName)),
      );
  const group = coldStyles.find((s) => s.id === style);
  return candidates.filter(
    (r) =>
      !r.categoryId.startsWith("prep-") &&
      (!line || r.line === line) &&
      (!group ||
        (r.line === "cold" &&
          (group.categories.includes(r.categoryId) ||
            extraStyles[group.id]?.includes(r.id)))),
  );
}
