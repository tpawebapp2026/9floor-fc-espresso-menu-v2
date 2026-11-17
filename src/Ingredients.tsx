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
import photoData from "./ingredientPhotos.json";
import "./ingredients.css";

type Photo = {
  file: string;
  sourceUrl: string;
  license: string;
  licenseUrl: string;
  author: string;
  caption: string;
  changes: string;
};
const photos: Record<string, Photo> = photoData;
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
  const [recipeQuery, setRecipeQuery] = useState("");
  const p = ingredients.find((p) => p.id === id);
  const photo = p ? photos[p.id] : undefined;
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
    const uses = ingredientUses(p, recipes, variant).filter((u) =>
      [u.recipe.englishName, u.recipe.burmeseName || ""].some((s) =>
        s.toLocaleLowerCase().includes(recipeQuery.trim().toLocaleLowerCase()),
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
              အောက်ပါအမည်များက Recipe ထဲတွင် တကယ်သုံးထားသော ပုံစံများဖြစ်သည်။
              တူညီသောအရသာဖြစ်သော်လည်း အသီး၊ အနှစ်၊ ဆီရပ်နှင့် ဖျော်မှုန့်ကို
              ပမာဏတူ အစားမထိုးပါနှင့်။
            </p>
          </div>
        </header>
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
                <option value="">ပုံစံအားလုံး ({p.aliases.length})</option>
                {p.aliases.map((a) => (
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
  const results = findIngredients(recipes, query, category);
  return (
    <main className="ingredient-library">
      <header>
        <p className="ingredient-eyebrow">9 FLOOR · INGREDIENT GUIDE</p>
        <h1>ကုန်ကြမ်းများ</h1>
        <p>
          ကုန်ကြမ်းကို ရွေးပြီး အသုံးပြုပုံ၊ Recipe ထဲက အမျိုးအစားအတိအကျနှင့်
          ဖျော်လို့ရသည့် မီနူးများကို ကြည့်ပါ။
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
      <p role="status">ကုန်ကြမ်းအုပ်စု {results.length} ခု</p>
      <div className="ingredient-cards">
        {results.map((p) => {
          const photo = photos[p.id];
          const count = ingredientUses(p, recipes).length;
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
                <small>{ingredientCategories[p.category]}</small>
                <strong>{p.name}</strong>
                <span lang="en">{p.englishName}</span>
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
        ဓာတ်ပုံများသည် ကုန်ကြမ်း / သဘာဝအရင်းအမြစ်အစစ် နမူနာများဖြစ်သည်။
        ပုံရှင်းလင်းချက်နှင့် Recipe ပါ ပစ္စည်းပုံစံကို တွဲကြည့်ပါ။
        ဘူးတံဆိပ်အတိအကျ၏ ပုံဟု မယူဆပါနှင့်။
      </p>
    </main>
  );
}
