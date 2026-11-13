import data from "./assemblyCatalog.json";
import type { Recipe } from "./model";
export type AssemblyStep = {
  phase: "prepare" | "cup" | "finish" | "serve" | "batch";
  vessel: string;
  text: string;
  uses: { index: number; part: number }[];
  take: string[];
  produce?: string;
  label?: string;
  into?: string;
  cupNumber?: number;
};
export type AssemblyPlan = {
  name: string;
  sourceIngredients: Recipe["ingredients"];
  ingredients: Recipe["ingredients"];
  kind: "batch" | "drink";
  adjustments: string[];
  warnings: string[];
  steps: AssemblyStep[];
  cupOrder: string[];
};
export const assemblyPlans = data as Record<string, AssemblyPlan>;
export function assemblyFor(recipe: Recipe): AssemblyPlan | null {
  const plan = assemblyPlans[recipe.id];
  // An owner's later ingredient edit must never inherit a stale row allocation.
  return plan &&
    plan.name === recipe.englishName &&
    JSON.stringify(plan.sourceIngredients) ===
      JSON.stringify(recipe.ingredients)
    ? plan
    : null;
}
export const phaseNames: Record<AssemblyStep["phase"], string> = {
  prepare: "ကြိုပြင်ရန်",
  cup: "သောက်ခွက်ထဲထည့်ရန်",
  finish: "နောက်ဆုံးအပေါ်တင်ရန်",
  serve: "ရောမွှေ / စစ်ဆေးရန်",
  batch: "အခြေခံရည်ပြင်ရန်",
};
