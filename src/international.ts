import type { Recipe } from "./model";
// Editorial discovery links to the same recipe IDs; this is not a separate recipe database.
export const countries = [
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
    description: "Espresso နှင့် ရိုးရာကော်ဖီစတိုင်များ",
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
    pattern: /Cubano/i,
    description: "Café Cubano",
  },
  {
    name: "အမေရိကန်",
    flag: "🇺🇸",
    pattern: /New Orleans/i,
    description: "New Orleans Chicory",
  },
];
export function countryRecipes(recipes: Recipe[], name: string) {
  return recipes.filter((r) =>
    countries.find((c) => c.name === name)?.pattern.test(r.englishName),
  );
}
