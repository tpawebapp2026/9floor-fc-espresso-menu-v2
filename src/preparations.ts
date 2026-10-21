import type { Recipe } from "./model";

export const preparationGroups = [
  { id: "prep-syrup", name: "Syrup", mm: "အချိုရည်အခြေခံ", icon: "◈" },
  { id: "prep-sauce", name: "Sauce", mm: "ဆော့စ်များ", icon: "◒" },
  {
    id: "prep-concentrate",
    name: "Fruit Concentrate",
    mm: "အသီးဖျော်ရည်အပြင်း",
    icon: "◇",
  },
  { id: "prep-puree", name: "Fruit Purée", mm: "အသီးအနှစ်", icon: "✦" },
] as const;
export function isPreparation(recipe: Pick<Recipe, "categoryId">) {
  return preparationGroups.some((group) => group.id === recipe.categoryId);
}
export function densityFromSample(massG: number, volumeMl: number) {
  const density = massG / volumeMl;
  return Number.isFinite(density) &&
    Number.isFinite(massG) &&
    Number.isFinite(volumeMl) &&
    massG > 0 &&
    volumeMl > 0
    ? density
    : null;
}
export function convertMetric(
  amount: number,
  density: number | null,
  direction: "g-to-ml" | "ml-to-g",
) {
  if (
    !Number.isFinite(amount) ||
    amount < 0 ||
    density === null ||
    !Number.isFinite(density) ||
    density <= 0
  )
    return null;
  const result = direction === "g-to-ml" ? amount / density : amount * density;
  return Number.isFinite(result) ? result : null;
}
