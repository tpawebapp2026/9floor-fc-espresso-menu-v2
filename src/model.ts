import { z } from "zod";
const safeText = z.string().trim().min(1).max(3000);
export const RecipeSchema = z.object({
  id: z.string().regex(/^[a-zA-Z0-9-]{1,80}$/),
  menuNumber: z.string().max(30).nullable(),
  sourceTitle: z.string().max(300),
  englishName: safeText,
  burmeseName: z.string().max(300).nullable(),
  categoryId: z.string().min(1).max(80),
  line: z.enum(["barista", "cold"]),
  image: z
    .string()
    .url()
    .refine((s) => s.startsWith("https://"), "HTTPS လိုအပ်သည်")
    .nullable(),
  cupSizes: z
    .array(z.union([z.literal(8), z.literal(12), z.literal(16), z.literal(22)]))
    .max(4),
  ingredients: z
    .array(z.object({ name: safeText, quantity: z.string().max(3000) }))
    .min(1)
    .max(80),
  sourceIngredients: z
    .array(z.object({ name: z.string(), quantity: z.string() }))
    .optional(),
  steps: z.array(safeText).min(1).max(80),
  notes: z.array(safeText).max(30),
  espressoDose: z.string().max(100).nullable(),
  espressoYield: z.string().max(100).nullable(),
  iceQuantity: z.string().max(100).nullable(),
  milkQuantity: z.string().max(100).nullable(),
  waterQuantity: z.string().max(100).nullable(),
  sweetnessLevel: z.string().max(100).nullable(),
  version: z.number().int().positive(),
  updatedAt: z.string().datetime().nullable(),
  verification: z.enum(["source-unverified", "owner-tested"]),
  source: z
    .object({ file: z.string().max(300), sha256: z.string().max(80) })
    .optional(),
});
export const CatalogSchema = z
  .object({
    schemaVersion: z.literal(1),
    seedVersion: z.number().int().positive().optional(),
    revision: z.number().int().nonnegative(),
    categories: z
      .array(z.object({ id: z.string().min(1).max(80), name: safeText }))
      .min(1)
      .max(200),
    recipes: z.array(RecipeSchema).max(3000),
  })
  .superRefine((d, c) => {
    for (const field of ["id", "englishName", "menuNumber"] as const) {
      const vals = d.recipes
        .map((r) => r[field]?.trim().toLowerCase())
        .filter(Boolean);
      if (new Set(vals).size !== vals.length)
        c.addIssue({ code: "custom", message: `ထပ်နေသော ${field}` });
    }
    const ids = d.categories.map((c) => c.id);
    if (new Set(ids).size !== ids.length)
      c.addIssue({ code: "custom", message: "အမျိုးအစား ID ထပ်နေသည်" });
    if (d.recipes.some((r) => !ids.includes(r.categoryId)))
      c.addIssue({ code: "custom", message: "အမျိုးအစား မတွေ့ပါ" });
  });
export type Recipe = z.infer<typeof RecipeSchema>;
export type Catalog = z.infer<typeof CatalogSchema>;
export function searchRecipes(recipes: Recipe[], query: string) {
  const q = query.toLocaleLowerCase().trim();
  return recipes.filter((r) =>
    [r.englishName, r.burmeseName, r.menuNumber, r.id].some((s) =>
      s?.toLocaleLowerCase().includes(q),
    ),
  );
}
// Scale only ingredient quantities that are unambiguous metric measurements. Preserve original text otherwise.
export function scaleQuantity(value: string, count: number) {
  if (count === 1) return value;
  const dual = value.match(/^(\d+(?:\.\d+)?) g ≈ (\d+(?:\.\d+)?) ml$/);
  if (dual)
    return `${Math.round(Number(dual[1]) * count * 100) / 100} g ≈ ${Math.round(Number(dual[2]) * count * 100) / 100} ml`;
  const m = value.match(
    /^(\d+(?:\.\d+)?)(?:\s*[–-]\s*(\d+(?:\.\d+)?))?\s*(g|ml)(.*)$/i,
  );
  if (!m) return `${value} × ${count}`;
  const n = (s: string) => String(Math.round(Number(s) * count * 100) / 100);
  return `${n(m[1])}${m[2] ? "–" + n(m[2]) : ""} ${m[3]}${m[4]}`;
}
export function newer(current: Catalog | null, incoming: Catalog) {
  return (
    !current ||
    incoming.revision > current.revision ||
    (incoming.revision === 0 &&
      current.revision === 0 &&
      (incoming.seedVersion ?? 0) > (current.seedVersion ?? 0))
  );
}
