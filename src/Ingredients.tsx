import { useState } from "react";
import type { Recipe } from "./model";
import { asset } from "./platform";
import {
  ingredients,
  ingredientCategories,
  ingredientUses,
  findIngredients,
} from "./ingredients";
import { isPreparation } from "./preparations";
import { productsFor, readyForms, productKinds } from "./readyProducts";
import "./ingredients.css";

export function Ingredients({
  recipes,
  id,
  navigate,
}: {
  recipes: Recipe[];
  id?: string;
  navigate: (path: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [variant, setVariant] = useState("");
  const [kind, setKind] = useState("");
  const [recipeQuery, setRecipeQuery] = useState("");
  const p = ingredients.find((p) => p.id === id);
  const products = p ? productsFor(p.id) : [];
  const forms = p ? readyForms(p) : [];
  const photo = products.find(
    (product) => !variant || product.forms.includes(variant),
  );
  if (id && !p)
    return (
      <main className="ingredient-library">
        <h1>ကုန်ကြမ်းမတွေ့ပါ</h1>
        <button onClick={() => navigate("/ingredients")}>
          ကုန်ကြမ်းအားလုံးသို့
        </button>
      </main>
    );
  if (p) {
    const uses = ingredientUses(p, recipes, variant)
      .filter(
        (u) => !forms.length || u.items.some((i) => forms.includes(i.name)),
      )
      .map((u) => ({
        ...u,
        items: forms.length
          ? u.items.filter((i) => forms.includes(i.name))
          : u.items,
      }))
      .filter((u) =>
        [u.recipe.englishName, u.recipe.burmeseName || ""].some((s) =>
          s
            .toLocaleLowerCase()
            .includes(recipeQuery.trim().toLocaleLowerCase()),
        ),
      );
    const drinks = uses.filter((u) => !isPreparation(u.recipe));
    const preparations = uses.filter((u) => isPreparation(u.recipe));
    return (
      <main className="ingredient-library ingredient-profile">
        <button
          className="text-button"
          onClick={() => navigate("/ingredients")}
        >
          ← ကုန်ကြမ်းအားလုံး
        </button>
        <header className="ingredient-intro">
          {photo && (
            <figure>
              <img
                src={asset(photo.file)}
                alt={photo.caption}
                width="640"
                height="480"
              />
              <figcaption>{photo.caption}</figcaption>
            </figure>
          )}
          <div>
            <p className="ingredient-eyebrow">
              {ingredientCategories[p.category]}
            </p>
            <h1>{p.name}</h1>
            <p lang="en">{p.englishName}</p>
            <h2>ဘာအတွက်သုံးသလဲ</h2>
            <p>{p.guide}</p>
            <p className="ingredient-form-note">
              ဘူး / အထုပ်ပုံများသည် ဝယ်ယူရာတွင် ပုံစံခွဲသိရန်
              နမူနာတံဆိပ်များဖြစ်သည်။ Recipe ထဲက တံဆိပ်နှင့် ကွာနိုင်သည်။ အချို၊
              အနှစ်ပါဝင်မှုကို စစ်ပြီး အသေးစားစမ်းဖျော်ပါ။ ဆီရပ်၊ အသီးအနှစ်၊
              ဆော့စ်နှင့် ဖျော်မှုန့်ကို ပမာဏတူ အစားမထိုးပါနှင့်။
            </p>
          </div>
        </header>
        {!!products.length && (
          <section aria-label="အသင့်သုံးကုန်ကြမ်း နမူနာများ">
            <h2>ဝယ်သုံးနိုင်သော ဘူး / အထုပ်ပုံစံ</h2>
            <div className="ready-product-list">
              {products.map((product) => (
                <article key={product.id}>
                  <img
                    src={asset(product.file)}
                    alt={product.caption}
                    width="240"
                    height="240"
                  />
                  <div>
                    <small>{productKinds[product.kind]}</small>
                    <h3>{product.name}</h3>
                    <p>သုံးရမည့်ပုံစံ — {product.forms.join(" / ")}</p>
                    <button onClick={() => setVariant(product.forms[0])}>
                      ဒီပုံစံနဲ့ ဖျော်မည့် မီနူးများ ↓
                    </button>
                    <a
                      href={product.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      မူရင်းပစ္စည်း ကြည့်ရန် ↗
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
        <section aria-labelledby="ingredient-uses">
          <h2 id="ingredient-uses">ဘာတွေဖျော်လို့ရလဲ</h2>
          <div className="ingredient-controls">
            <label>
              သုံးရမည့် ကုန်ကြမ်းပုံစံ
              <select
                aria-label="ကုန်ကြမ်းပုံစံ ရွေးရန်"
                value={variant}
                onChange={(e) => setVariant(e.target.value)}
              >
                <option value="">
                  ပုံစံအားလုံး ({forms.length || p.aliases.length})
                </option>
                {(forms.length ? forms : p.aliases).map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </label>
            <label>
              မီနူးရှာရန်
              <input
                type="search"
                value={recipeQuery}
                placeholder="ဥပမာ Latte"
                onChange={(e) => setRecipeQuery(e.target.value)}
              />
            </label>
          </div>
          {!recipes.length ? (
            <p role="status">Recipe များ တင်နေသည်…</p>
          ) : (
            <>
              <p role="status">
                ဖျော်ရည် {drinks.length} မျိုး · အခြေခံပြင်ဆင်မှု{" "}
                {preparations.length} မျိုး
              </p>
              <p className="muted">
                ပမာဏသည် မူရင်း Recipe တစ်ခွက် / batch အတွက်ဖြစ်သည်။ “/” ပါသော
                အစားထိုးရွေးချယ်မှုနှင့် အလှဆင်ပစ္စည်းတို့ကို
                မူရင်းဖျော်နည်းထဲတွင် ပြန်စစ်ပါ။
              </p>
              {[
                ["ဖျော်ရည်များ", drinks],
                ["အခြေခံပြင်ဆင်မှုများ", preparations],
              ].map(([heading, group]) => {
                const list = group as typeof uses;
                return list.length ? (
                  <section key={heading as string}>
                    <h3>{heading as string}</h3>
                    <div className="ingredient-recipe-list">
                      {list.map(({ recipe: r, items }) => (
                        <article key={r.id}>
                          <button
                            className="ingredient-recipe-link"
                            onClick={() => navigate("/recipe/" + r.id)}
                          >
                            <span>
                              {r.menuNumber ? `#${r.menuNumber} · ` : ""}
                              {r.englishName}
                            </span>
                            {r.burmeseName && <small>{r.burmeseName}</small>}
                            <small>
                              {r.cupSizes.map((s) => s + " oz").join(" / ")} ·
                              ဖျော်နည်းကြည့်ရန် →
                            </small>
                          </button>
                          <dl>
                            {items.map((i, n) => (
                              <div key={n}>
                                <dt>{i.name}</dt>
                                <dd>{i.quantity || "မူရင်းတွင် ပမာဏမပါ"}</dd>
                              </div>
                            ))}
                          </dl>
                        </article>
                      ))}
                    </div>
                  </section>
                ) : null;
              })}
              {!uses.length && (
                <p>
                  ဤရွေးချယ်မှုနှင့် ကိုက်ညီသော မီနူးမရှိပါ။ ရှာဖွေမှု သို့မဟုတ်
                  ကုန်ကြမ်းပုံစံကို ပြောင်းရွေးပါ။
                </p>
              )}
            </>
          )}
        </section>
        {photo && (
          <details className="ingredient-credit">
            <summary>ပုံအစစ်၏ မူရင်းနှင့် အသုံးပြုခွင့်</summary>
            <p>
              {photo.author} ·{" "}
              <a href={photo.sourceUrl} target="_blank" rel="noreferrer">
                မူရင်းဓာတ်ပုံ
              </a>{" "}
              ·{" "}
              <a
                href={photo.licenseUrl || photo.sourceUrl}
                target="_blank"
                rel="noreferrer"
              >
                {photo.license}
              </a>
            </p>
            <p>{photo.changes}</p>
          </details>
        )}
      </main>
    );
  }
  const results = findIngredients(recipes, "", category).filter((p) => {
    const samples = productsFor(p.id);
    const q = query.trim().normalize("NFKC").toLocaleLowerCase();
    return (
      samples.length &&
      (!kind || samples.some((s) => s.kind === kind)) &&
      (!q ||
        [
          p.name,
          p.englishName,
          ...p.aliases,
          ...samples.map((s) => s.name),
          ...ingredientUses(p, recipes).flatMap((u) => [
            u.recipe.englishName,
            u.recipe.burmeseName || "",
          ]),
        ].some((s) => s.normalize("NFKC").toLocaleLowerCase().includes(q)))
    );
  });
  return (
    <main className="ingredient-library">
      <header>
        <p className="ingredient-eyebrow">9 FLOOR · INGREDIENT GUIDE</p>
        <h1>အသင့်သုံးကုန်ကြမ်းများ</h1>
        <p>
          ဆိုင်မှာဝယ်သုံးမည့် ဆီရပ်ဘူး၊ အသီးအနှစ်ဘူး၊ ဆော့စ်နှင့်
          ဖျော်မှုန့်အထုပ်များကို ရွေးပါ။ ဘူးပုံအစစ်၊ အသုံးပြုပုံနှင့်
          သက်ဆိုင်ရာ မီနူးဖျော်နည်းကို တွဲကြည့်နိုင်သည်။
        </p>
      </header>
      <div className="ingredient-controls">
        <label>
          ကုန်ကြမ်း / မီနူးရှာရန်
          <input
            type="search"
            aria-label="ကုန်ကြမ်းရှာရန်"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="နို့၊ Matcha၊ Nature Taste၊ Latte…"
          />
        </label>
        <label>
          အမျိုးအစား
          <select
            aria-label="ကုန်ကြမ်းအမျိုးအစား"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">အမျိုးအစားအားလုံး</option>
            {Object.entries(ingredientCategories).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="ready-kind-filters" aria-label="အသင့်သုံးပုံစံ">
        {[["", "အားလုံး"], ...Object.entries(productKinds)].map(
          ([value, label]) => (
            <button
              key={value}
              aria-pressed={kind === value}
              onClick={() => setKind(value)}
            >
              {label}
            </button>
          ),
        )}
      </div>
      <p role="status">အသင့်သုံးကုန်ကြမ်းအုပ်စု {results.length} ခု</p>
      <div className="ingredient-cards">
        {results.map((p) => {
          const samples = productsFor(p.id);
          const photo = samples.find((s) => !kind || s.kind === kind)!;
          const availableForms = readyForms(p);
          const count = ingredientUses(p, recipes).filter((u) =>
            u.items.some((i) => availableForms.includes(i.name)),
          ).length;
          return (
            <button
              className="ingredient-card"
              key={p.id}
              onClick={() => navigate("/ingredient/" + p.id)}
            >
              {photo && (
                <img
                  src={asset(photo.file)}
                  width="480"
                  height="360"
                  loading="lazy"
                  alt={photo.caption}
                />
              )}
              <span>
                <small>
                  {[...new Set(samples.map((s) => productKinds[s.kind]))].join(
                    " · ",
                  )}
                </small>
                <strong>{p.name}</strong>
                <span lang="en">{p.englishName}</span>
                <small>{samples.map((s) => s.name).join(" / ")}</small>
                <small>Recipe {count} မျိုး · အသေးစိတ် →</small>
              </span>
            </button>
          );
        })}
      </div>
      {!results.length && (
        <p>မတွေ့ပါ။ မြန်မာ / English နာမည်ဖြင့် ပြန်ရှာကြည့်ပါ။</p>
      )}
      <p className="muted">
        ဘူး / အထုပ်ပုံများသည် ထုတ်လုပ်သူ၏ ပစ္စည်းပုံအစစ်များဖြစ်သည်။
        နမူနာတံဆိပ်သည် Recipe ထဲကတံဆိပ်နှင့် ကွာနိုင်သည်။ ဘူးတံဆိပ်ပါ
        ပစ္စည်းအမျိုးအစား၊ အချိုနှင့် ရောစပ်အချိုးကို စစ်ပါ။
      </p>
    </main>
  );
}
