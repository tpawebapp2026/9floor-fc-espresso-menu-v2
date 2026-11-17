import data from "./ingredientsCatalog.json";
import type { Recipe } from "./model";
export const ingredientCategories: Record<string, string> = {
  coffee: "ကော်ဖီ",
  milk: "နို့နှင့် ခရင်မ်",
  tea: "လက်ဖက်နှင့် မတ်ချာ",
  powder: "ဖျော်မှုန့်နှင့် အနှစ်",
  sweet: "အချိုနှင့် ဆီရပ်",
  fruit: "အသီးနှင့် အသီးအနှစ်",
  herbs: "အနံ့သာနှင့် ပန်း",
  extras: "ဖြည့်စွက်ပစ္စည်း",
  water: "ရေ၊ ဆိုဒါနှင့် ရေခဲ",
};
export const ingredients = [...data].sort((a, b) =>
  a.englishName.localeCompare(b.englishName),
);
export type IngredientProfile = (typeof ingredients)[number];
export function ingredientForName(name: string) {
  return ingredients.filter((p) => p.aliases.includes(name));
}
export function ingredientUses(
  profile: IngredientProfile,
  recipes: Recipe[],
  variant = "",
) {
  return recipes.flatMap((recipe) => {
    const items = recipe.ingredients.filter(
      (i) =>
        profile.aliases.includes(i.name) && (!variant || variant === i.name),
    );
    return items.length ? [{ recipe, items }] : [];
  });
}
export function findIngredients(
  recipes: Recipe[],
  query: string,
  category: string,
) {
  const q = query.trim().normalize("NFKC").toLocaleLowerCase();
  return ingredients.filter(
    (p) =>
      (!category || p.category === category) &&
      (!q ||
        [
          p.name,
          p.englishName,
          ...p.aliases,
          ...ingredientUses(p, recipes).flatMap((u) => [
            u.recipe.englishName,
            u.recipe.burmeseName || "",
          ]),
        ].some((s) => s.normalize("NFKC").toLocaleLowerCase().includes(q))),
  );
}
