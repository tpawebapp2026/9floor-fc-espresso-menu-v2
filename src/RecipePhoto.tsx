import { useState } from "react";
import type { Recipe } from "./model";
import { asset } from "./platform";
import catalog from "./photos/catalog.json";
type Photo = (typeof catalog.photos)[keyof typeof catalog.photos];
type Mapping = { photo: string; kind: string };
export function referencePhoto(
  recipe: Recipe,
): { photo: Photo; kind: string } | null {
  if (recipe.image) return null;
  const mapping = (catalog.recipes as Record<string, Mapping>)[recipe.id];
  const photo =
    mapping && (catalog.photos as Record<string, Photo>)[mapping.photo];
  return photo ? { photo, kind: mapping.kind } : null;
}
export default function RecipePhoto({
  recipe,
  detail = false,
}: {
  recipe: Recipe;
  detail?: boolean;
}) {
  const reference = referencePhoto(recipe);
  const source =
    recipe.image || (reference && asset(reference.photo.large.file));
  const [failed, setFailed] = useState<string | null>(null);
  const label =
    reference?.kind === "ingredient" ? "ပါဝင်ပစ္စည်းပုံ" : "ကိုးကားဓာတ်ပုံ";
  if (!source || failed === source)
    return (
      <div
        className="photo-unavailable"
        role="img"
        aria-label={`${recipe.englishName} ဓာတ်ပုံမရရှိပါ`}
      >
        ဓာတ်ပုံ မရရှိပါ။ အင်တာနက်ပြန်ရချိန် ပြန်ဖွင့်ပါ။
      </div>
    );
  const p = reference?.photo;
  return (
    <>
      <img
        src={source}
        srcSet={
          p && p.large.width > p.small.width
            ? `${asset(p.small.file)} ${p.small.width}w, ${asset(p.large.file)} ${p.large.width}w`
            : undefined
        }
        sizes={
          detail
            ? "(max-width: 650px) calc(100vw - 34px), 520px"
            : "(max-width: 650px) calc((100vw - 46px) / 2), (max-width: 900px) 30vw, 330px"
        }
        alt={
          p
            ? `${recipe.englishName} — ${label}: ${p.title.replace(/\.[^.]+$/, "")}`
            : recipe.englishName
        }
        loading={detail ? "eager" : "lazy"}
        decoding="async"
        width={p?.large.width}
        height={p?.large.height}
        onError={() => setFailed(source)}
      />
      {reference && <span className="reference-photo-label">{label}</span>}
    </>
  );
}
export function PhotoCredit({ recipe }: { recipe: Recipe }) {
  const reference = referencePhoto(recipe);
  if (!reference) return null;
  const { photo, kind } = reference;
  return (
    <aside className="photo-credit">
      <b>
        {kind === "ingredient"
          ? "ပါဝင်ပစ္စည်း ရည်ညွှန်းဓာတ်ပုံ"
          : "အမျိုးအစားတူ ရည်ညွှန်းဓာတ်ပုံ"}
      </b>
      <p>
        {photo.title.replace(/\.[^.]+$/, "")} · {photo.author}
      </p>
      <a href={photo.sourceUrl} target="_blank" rel="noreferrer">
        မူရင်းဓာတ်ပုံ
      </a>
      {" · "}
      <a href={photo.licenseUrl} target="_blank" rel="noreferrer">
        {photo.license}
      </a>
      <p>
        လူတကယ်ရိုက်ထားသော ကိုးကားပုံဖြစ်ပြီး ဤဖျော်နည်းအတိုင်း
        ဆိုင်တွင်ဖျော်ထားသောပုံ မဟုတ်ပါ။ အရသာ၊ အပူ/အအေး၊ အလှဆင်နှင့် ခွက်အရွယ်
        ကွာနိုင်ပါသည်။ ပမာဏများကို အောက်ပါဖျော်နည်းအတိုင်းသာ ချိန်ပါ။
      </p>
      <small>
        ပုံအရွယ်လျှော့၍ WebP ပြောင်းထားသည်။ မြင်ကွင်းအလိုက်
        ပုံဖြတ်ပြထားနိုင်သည်။
      </small>
    </aside>
  );
}
