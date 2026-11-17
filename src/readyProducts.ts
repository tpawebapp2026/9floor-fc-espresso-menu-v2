import data from "./readyProducts.json";
import type { IngredientProfile } from "./ingredients";
export type ReadyProduct = {
  id: string;
  profileId: string;
  name: string;
  brand: string;
  kind: string;
  forms: string[];
  file: string;
  caption: string;
  sourceUrl: string;
  author: string;
  license: string;
  licenseUrl: string;
  changes: string;
};
export const readyProducts: ReadyProduct[] = data;
export const productKinds: Record<string, string> = {
  syrup: "ဆီရပ်ဘူး",
  puree: "အသီးအနှစ်ဘူး",
  sauce: "ဆော့စ် / Topping",
  powder: "အသင့်သုံးဖျော်မှုန့်",
  tea: "ထုပ်ပိုးလက်ဖက်ခြောက်",
};
export const productsFor = (id: string) =>
  readyProducts.filter((p) => p.profileId === id);
export const readyForms = (profile: IngredientProfile) => [
  ...new Set(productsFor(profile.id).flatMap((p) => p.forms)),
];
