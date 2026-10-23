import type { Recipe } from "./model";
export const matchaStyles = [
  { id: "japanese", country: "ဂျပန်", flag: "🇯🇵", name: "ဂျပန်စတိုင်" },
  { id: "thai", country: "ထိုင်း", flag: "🇹🇭", name: "ထိုင်းစတိုင်" },
  { id: "korean", country: "ကိုရီးယား", flag: "🇰🇷", name: "ကိုရီးယားစတိုင်" },
  { id: "vietnamese", country: "ဗီယက်နမ်", flag: "🇻🇳", name: "ဗီယက်နမ်စတိုင်" },
  { id: "american", country: "အမေရိကန်", flag: "🇺🇸", name: "အမေရိကန်စတိုင်" },
  { id: "taiwanese", country: "ထိုင်ဝမ်", flag: "🇹🇼", name: "ထိုင်ဝမ်စတိုင်" },
];
export function isMatcha(recipe: Recipe) {
  return /matcha/i.test(recipe.englishName);
}
export function matchaStyle(recipe: Recipe) {
  if (!isMatcha(recipe)) return null;
  const id =
    matchaStyles.find((s) => recipe.id.startsWith("matcha-" + s.id + "-"))
      ?.id || (/Dalgona/i.test(recipe.englishName) ? "korean" : "japanese");
  return matchaStyles.find((s) => s.id === id)!;
}
