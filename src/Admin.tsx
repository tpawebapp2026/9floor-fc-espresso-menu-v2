import { useEffect, useState, useRef } from "react";
import {
  CatalogSchema,
  RecipeSchema,
  type Catalog,
  type Recipe,
  searchRecipes,
} from "./model";
import { db, isAdmin, adminRequest } from "./data";
const emptyRecipe = (categoryId: string): Recipe => ({
  id: crypto.randomUUID(),
  menuNumber: null,
  sourceTitle: "",
  englishName: "New Recipe",
  burmeseName: null,
  categoryId,
  line: "barista",
  image: null,
  cupSizes: [],
  ingredients: [{ name: "", quantity: "" }],
  steps: [""],
  notes: [],
  espressoDose: null,
  espressoYield: null,
  iceQuantity: null,
  milkQuantity: null,
  waterQuantity: null,
  sweetnessLevel: null,
  version: 1,
  updatedAt: null,
  verification: "source-unverified",
});
export default function Admin({
  catalog,
  onPublished,
  onExit,
}: {
  catalog: Catalog | null;
  onPublished: () => void;
  onExit: () => void;
}) {
  const [allowed, setAllowed] = useState(false),
    [checking, setChecking] = useState(true),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [message, setMessage] = useState(""),
    [draft, setDraft] = useState<Catalog | null>(catalog),
    [selected, setSelected] = useState(""),
    [query, setQuery] = useState(""),
    [busy, setBusy] = useState(false),
    [dirty, setDirty] = useState(false),
    [baseRevision, setBaseRevision] = useState(catalog?.revision || 0),
    [preview, setPreview] = useState(false),
    [versions, setVersions] = useState<any[]>([]);
  const fileInput = useRef<HTMLInputElement>(null),
    previewDialog = useRef<HTMLDialogElement>(null);
  async function check() {
    setChecking(true);
    try {
      setAllowed(await isAdmin());
    } finally {
      setChecking(false);
    }
  }
  useEffect(() => {
    void check();
    const { data } =
      db?.auth.onAuthStateChange(() => {
        setTimeout(() => void check(), 0);
      }) || {};
    return () => data?.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!dirty && catalog) {
      setDraft(catalog);
      setBaseRevision(catalog.revision);
    }
  }, [catalog]);
  useEffect(() => {
    if (allowed && !draft)
      fetch("/recipes.json", { cache: "no-store" })
        .then((r) => r.json())
        .then((json) => {
          setDraft(CatalogSchema.parse(json));
          setBaseRevision(0);
          setMessage(
            "ပထမဆုံးထုတ်ပြန်ရန် မူရင်းဖိုင်ကို Draft အဖြစ် ဖွင့်ထားသည်။ အတည်ပြုပြီးမှ ထုတ်ပြန်ပါ။",
          );
        })
        .catch(() =>
          setMessage("မူရင်း JSON ဖွင့်မရပါ။ ချိတ်ဆက်မှုကို စစ်ပါ။"),
        );
  }, [allowed, draft]);
  useEffect(() => {
    const block = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", block);
    return () => window.removeEventListener("beforeunload", block);
  }, [dirty]);
  useEffect(() => {
    if (preview) previewDialog.current?.showModal();
    else previewDialog.current?.close();
  }, [preview]);
  const recipe = draft?.recipes.find((r) => r.id === selected);
  function change(r: Recipe) {
    if (!draft) return;
    setDraft({
      ...draft,
      recipes: draft.recipes.map((x) => (x.id === r.id ? r : x)),
    });
    setDirty(true);
  }
  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setMessage("လုပ်ဆောင်နေသည်…");
    try {
      await fn();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "လုပ်ဆောင်မှု မအောင်မြင်ပါ");
    } finally {
      setBusy(false);
    }
  }
  async function login(e: React.FormEvent) {
    e.preventDefault();
    if (!db) return;
    await run(async () => {
      const { error } = await db!.auth.signInWithPassword({ email, password });
      setPassword("");
      if (error) throw error;
      await check();
      setMessage("");
    });
  }
  function validated() {
    const result = CatalogSchema.safeParse(draft);
    if (!result.success)
      throw Error(
        result.error.issues
          .map((x) => x.path.join(".") + ": " + x.message)
          .join("\n"),
      );
    return result.data;
  }
  async function publish() {
    await run(async () => {
      const document = validated();
      const result = await adminRequest("publish", {
        document,
        expectedRevision: baseRevision,
      });
      setBaseRevision(result.revision);
      setDraft({ ...document, revision: result.revision });
      setDirty(false);
      setPreview(false);
      setMessage(
        "မီနူးများ ထုတ်ပြန်ပြီးပါပြီ။ အွန်လိုင်းဖုန်းများ အက်ပ်ဖွင့်ချိန် သို့မဟုတ် ၁ မိနစ်အတွင်း စစ်ဆေးရယူမည်။",
      );
      onPublished();
    });
  }
  async function upload(file: File) {
    await run(async () => {
      if (!recipe || !db) return;
      if (
        file.size > 4 * 1024 * 1024 ||
        !["image/jpeg", "image/png", "image/webp"].includes(file.type)
      )
        throw Error("JPEG / PNG / WebP ပုံ 4 MB အောက်သာ တင်ပါ");
      const { data } = await db.auth.getSession();
      const res = await fetch("/api/image", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + data.session?.access_token,
          "Content-Type": file.type,
        },
        body: file,
      });
      const payload = await res.json();
      if (!res.ok) throw Error(payload.error || "ပုံတင်မရပါ");
      change({ ...recipe, image: payload.url });
      setMessage("ပုံတင်ပြီးပါပြီ။ Preview စစ်ပြီး ထုတ်ပြန်ပါ။");
    });
  }
  if (checking) return <main>ဝင်ခွင့် စစ်ဆေးနေသည်…</main>;
  if (!allowed)
    return (
      <main className="admin">
        <form className="login" onSubmit={login}>
          <span className="eyebrow">9FLOOR FC · ADMIN</span>
          <h2>စီမံခန့်ခွဲသူ ဝင်ရန်</h2>
          {!db && (
            <div className="notice">
              ဤမိတ္တူမှာ Supabase မချိတ်ဆက်ရသေးပါ။ စီမံခန့်ခွဲမှုကို
              မဖွင့်ထားပါ။
            </div>
          )}
          <label>
            Email
            <input
              autoComplete="username"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            စကားဝှက်
            <input
              autoComplete="current-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <button className="primary" disabled={!db || busy}>
            ဝင်မည်
          </button>
          {message && (
            <p role="alert" className="notice">
              {message}
            </p>
          )}
          <p className="muted">
            ခွင့်ပြုထားသော Admin အကောင့်များသာ ဝင်ရောက်နိုင်သည်။
          </p>
          <button type="button" className="text-button" onClick={onExit}>
            ← မီနူးများသို့
          </button>
        </form>
      </main>
    );
  if (!draft) return <main>မီနူးဒေတာ အဆင်သင့် မဖြစ်သေးပါ။</main>;
  return (
    <main className="admin" data-dirty={dirty}>
      <span className="eyebrow">OWNER'S WORKSPACE</span>
      <h1>ဖျော်နည်း စီမံခန့်ခွဲမှု</h1>
      <p className="muted">
        Draft ပြင်ဆင်မှုများသည် ထုတ်ပြန်ပြီးမှ ဖုန်းများသို့ ရောက်ရှိမည်။{" "}
        {dirty ? "မသိမ်းရသေးပါ။" : "သိမ်းပြီးပါပြီ။"}
      </p>
      <div className="admin-toolbar">
        <button
          onClick={() => {
            const r = emptyRecipe(draft.categories[0].id);
            setDraft({ ...draft, recipes: [r, ...draft.recipes] });
            setSelected(r.id);
            setDirty(true);
          }}
        >
          ＋ မီနူးအသစ်
        </button>
        <button
          disabled={busy}
          onClick={() =>
            void run(async () => {
              await adminRequest("save-draft", { document: validated() });
              setDirty(false);
              setMessage("Draft သိမ်းပြီးပါပြီ။ မထုတ်ပြန်ရသေးပါ။");
            })
          }
        >
          Draft သိမ်းမည်
        </button>
        <button
          disabled={busy}
          onClick={() =>
            void run(async () => {
              if (
                dirty &&
                !confirm("မသိမ်းရသေးသော ပြင်ဆင်မှုများကို အစားထိုးမလား။")
              )
                return;
              const { document } = await adminRequest("load-draft", {});
              if (!document) throw Error("Draft မရှိသေးပါ");
              const parsed = CatalogSchema.parse(document);
              setDraft(parsed);
              setBaseRevision(parsed.revision);
              setDirty(false);
              setMessage("Draft ဖွင့်ပြီးပါပြီ");
            })
          }
        >
          Draft ပြန်ဖွင့်မည်
        </button>
        <button
          className="primary"
          onClick={() => {
            try {
              validated();
              setPreview(true);
            } catch (e) {
              setMessage(String(e));
            }
          }}
        >
          Preview နှင့် ထုတ်ပြန်ရန်
        </button>
        <button
          onClick={() => {
            const blob = new Blob([JSON.stringify(draft, null, 2)], {
              type: "application/json",
            });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = "9floor-v2-backup.json";
            a.click();
            setTimeout(() => URL.revokeObjectURL(a.href), 1000);
          }}
        >
          JSON ထုတ်မည်
        </button>
        <button onClick={() => fileInput.current?.click()}>
          JSON သွင်းမည်
        </button>
        <input
          hidden
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          onChange={(e) =>
            void run(async () => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (file.size > 4 * 1024 * 1024)
                throw Error("ဖိုင် 4 MB အောက်သာ");
              const document = CatalogSchema.parse(
                JSON.parse(await file.text()),
              );
              if (
                !confirm(
                  "လက်ရှိ Draft ကို JSON ပါမီနူးများဖြင့် အစားထိုးမလား။ ထုတ်ပြန်ထားသောဒေတာ မပြောင်းသေးပါ။",
                )
              )
                return;
              setDraft({ ...document, revision: baseRevision });
              setDirty(true);
              setMessage(
                "JSON ကို Draft အဖြစ် ထည့်ပြီးပါပြီ။ စစ်ဆေးပြီးမှ ထုတ်ပြန်ပါ။",
              );
            })
          }
        />
        <button
          onClick={() =>
            void run(async () => {
              const result = await adminRequest("versions", {});
              setVersions(result.versions);
              setMessage(
                "ဗားရှင်းတစ်ခုကို ရွေးပြီး Draft အဖြစ် ပြန်ယူနိုင်သည်",
              );
            })
          }
        >
          ဗားရှင်းမှတ်တမ်း
        </button>
        <button onClick={() => void db?.auth.signOut()}>ထွက်မည်</button>
      </div>
      {message && (
        <div role="status" className="admin-output">
          {message}
        </div>
      )}
      {versions.length > 0 && (
        <div className="admin-toolbar">
          {versions.map((v) => (
            <button
              key={v.revision}
              onClick={() =>
                void run(async () => {
                  if (!confirm(`R${v.revision} ကို Draft အဖြစ် ပြန်ယူမလား။`))
                    return;
                  const result = await adminRequest("restore", {
                    revision: v.revision,
                  });
                  setDraft({
                    ...CatalogSchema.parse(result.document),
                    revision: baseRevision,
                  });
                  setDirty(true);
                  setVersions([]);
                  setMessage(
                    "မူဟောင်းကို Draft အဖြစ် ပြန်ယူပြီးပါပြီ။ ထုတ်ပြန်လျှင် ဗားရှင်းအသစ်နံပါတ်ဖြင့် ထုတ်ပြန်မည်။",
                  );
                })
              }
            >
              R{v.revision} · {new Date(v.created_at).toLocaleString()}
            </button>
          ))}
        </div>
      )}
      <div className="admin-layout">
        <aside>
          <input
            aria-label="Admin မီနူးရှာရန်"
            placeholder="မီနူးရှာရန်…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="admin-sidebar">
            {searchRecipes(draft.recipes, query).map((r) => (
              <button
                className={r.id === selected ? "selected" : ""}
                key={r.id}
                onClick={() => setSelected(r.id)}
              >
                {r.menuNumber || r.id}
                <br />
                {r.englishName}
              </button>
            ))}
          </div>
          <h3>အမျိုးအစားများ</h3>
          {draft.categories.map((c) => (
            <label key={c.id}>
              <input
                aria-label={c.name}
                value={c.name}
                onChange={(e) => {
                  setDraft({
                    ...draft,
                    categories: draft.categories.map((x) =>
                      x.id === c.id ? { ...x, name: e.target.value } : x,
                    ),
                  });
                  setDirty(true);
                }}
              />
            </label>
          ))}
          <button
            className="secondary"
            onClick={() => {
              setDraft({
                ...draft,
                categories: [
                  ...draft.categories,
                  { id: crypto.randomUUID(), name: "အမျိုးအစားအသစ်" },
                ],
              });
              setDirty(true);
            }}
          >
            ＋ အမျိုးအစား
          </button>
        </aside>
        <section>
          {recipe ? (
            <>
              <div className="form-grid">
                <label>
                  English အမည်
                  <input
                    value={recipe.englishName}
                    onChange={(e) =>
                      change({ ...recipe, englishName: e.target.value })
                    }
                  />
                </label>
                <label>
                  မြန်မာအမည်
                  <input
                    value={recipe.burmeseName || ""}
                    onChange={(e) =>
                      change({ ...recipe, burmeseName: e.target.value || null })
                    }
                  />
                </label>
                <label>
                  မီနူးနံပါတ်
                  <input
                    value={recipe.menuNumber || ""}
                    onChange={(e) =>
                      change({ ...recipe, menuNumber: e.target.value || null })
                    }
                  />
                </label>
                <label>
                  အမျိုးအစား
                  <select
                    value={recipe.categoryId}
                    onChange={(e) =>
                      change({ ...recipe, categoryId: e.target.value })
                    }
                  >
                    {draft.categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  လိုင်း
                  <select
                    value={recipe.line}
                    onChange={(e) =>
                      change({
                        ...recipe,
                        line: e.target.value as Recipe["line"],
                      })
                    }
                  >
                    <option value="barista">Barista ကော်ဖီလိုင်း</option>
                    <option value="cold">အအေးစုံလိုင်း</option>
                  </select>
                </label>
                <label>
                  အတည်ပြုအဆင့်
                  <select
                    value={recipe.verification}
                    onChange={(e) =>
                      change({
                        ...recipe,
                        verification: e.target.value as Recipe["verification"],
                      })
                    }
                  >
                    <option value="source-unverified">စမ်းသပ် Recipe</option>
                    <option value="owner-tested">
                      ပိုင်ရှင် စမ်းသပ်အတည်ပြုပြီး
                    </option>
                  </select>
                </label>
              </div>
              <h3>မူရင်းပမာဏနှင့် ကိုက်ညီသော ခွက်အရွယ်</h3>
              <div className="admin-toolbar">
                {[8, 12, 16, 22].map((size) => (
                  <button
                    key={size}
                    aria-pressed={recipe.cupSizes.includes(size as any)}
                    onClick={() =>
                      change({
                        ...recipe,
                        cupSizes: (recipe.cupSizes.includes(size as any)
                          ? recipe.cupSizes.filter((s) => s !== size)
                          : [...recipe.cupSizes, size]) as Recipe["cupSizes"],
                      })
                    }
                  >
                    {recipe.cupSizes.includes(size as any) ? "✓ " : ""}
                    {size} oz
                  </button>
                ))}
              </div>
              <h3>ပါဝင်ပစ္စည်းများ</h3>
              {recipe.ingredients.map((i, n) => (
                <div className="rows" key={n}>
                  <input
                    aria-label={`ပစ္စည်း ${n + 1}`}
                    value={i.name}
                    onChange={(e) =>
                      change({
                        ...recipe,
                        ingredients: recipe.ingredients.map((x, j) =>
                          j === n ? { ...x, name: e.target.value } : x,
                        ),
                      })
                    }
                  />
                  <input
                    aria-label={`ပမာဏ ${n + 1}`}
                    value={i.quantity}
                    onChange={(e) =>
                      change({
                        ...recipe,
                        ingredients: recipe.ingredients.map((x, j) =>
                          j === n ? { ...x, quantity: e.target.value } : x,
                        ),
                      })
                    }
                  />
                  <button
                    aria-label="ပစ္စည်းဖျက်ရန်"
                    onClick={() =>
                      change({
                        ...recipe,
                        ingredients: recipe.ingredients.filter(
                          (_, j) => j !== n,
                        ),
                      })
                    }
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                className="secondary"
                onClick={() =>
                  change({
                    ...recipe,
                    ingredients: [
                      ...recipe.ingredients,
                      { name: "", quantity: "" },
                    ],
                  })
                }
              >
                ＋ ပစ္စည်းထည့်ရန်
              </button>
              <h3>ဖျော်နည်း အဆင့်များ</h3>
              <label>
                တစ်ကြောင်းလျှင် အဆင့်တစ်ခု
                <textarea
                  value={recipe.steps.join("\n")}
                  onChange={(e) =>
                    change({ ...recipe, steps: e.target.value.split("\n") })
                  }
                />
              </label>
              <label>
                မှတ်ချက်များ (တစ်ကြောင်းလျှင် တစ်ခု)
                <textarea
                  value={recipe.notes.join("\n")}
                  onChange={(e) =>
                    change({
                      ...recipe,
                      notes: e.target.value ? e.target.value.split("\n") : [],
                    })
                  }
                />
              </label>
              <h3>အခြေခံပမာဏ မှတ်တမ်း</h3>
              <div className="form-grid">
                {(
                  [
                    ["espressoDose", "Coffee dose"],
                    ["espressoYield", "Espresso yield"],
                    ["iceQuantity", "ရေခဲ"],
                    ["milkQuantity", "နို့"],
                    ["waterQuantity", "ရေ"],
                    ["sweetnessLevel", "အချိုအဆင့်"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key}>
                    {label}
                    <input
                      value={recipe[key] || ""}
                      onChange={(e) =>
                        change({ ...recipe, [key]: e.target.value || null })
                      }
                    />
                  </label>
                ))}
              </div>
              <h3>အတည်ပြုထားသော ဓာတ်ပုံအစစ်</h3>
              {recipe.image && (
                <img
                  src={recipe.image}
                  alt={recipe.englishName}
                  style={{ maxHeight: 200 }}
                />
              )}
              <label>
                ဓာတ်ပုံရွေးရန်
                <input
                  disabled={busy}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void upload(f);
                  }}
                />
              </label>
              <div className="admin-toolbar">
                <button onClick={() => change({ ...recipe, image: null })}>
                  ပုံဖယ်ရန်
                </button>
                <button
                  className="danger"
                  onClick={() => {
                    if (
                      confirm(
                        `${recipe.englishName} ကို Draft မှ ဖျက်မလား။ ထုတ်ပြန်ပြီးမှ အက်ပ်တွင် ပျောက်မည်။`,
                      )
                    ) {
                      setDraft({
                        ...draft,
                        recipes: draft.recipes.filter(
                          (r) => r.id !== recipe.id,
                        ),
                      });
                      setSelected("");
                      setDirty(true);
                    }
                  }}
                >
                  မီနူးဖျက်ရန်
                </button>
              </div>
              <p className="muted">
                ID: {recipe.id} · မူရင်းခေါင်းစဉ်:{" "}
                {recipe.sourceTitle || "အသစ်"}
              </p>
            </>
          ) : (
            <div className="empty">ပြင်ဆင်ရန် ဘယ်ဘက်မှ မီနူးရွေးပါ။</div>
          )}
        </section>
      </div>
      <dialog ref={previewDialog} onCancel={() => setPreview(false)}>
        <h2>ထုတ်ပြန်မှု မတိုင်မီ စစ်ဆေးရန်</h2>
        <p>
          မီနူး {draft.recipes.length} ခု · အမျိုးအစား {draft.categories.length}{" "}
          ခု · လက်ရှိ R{baseRevision}
        </p>
        {recipe && (
          <div className="admin-preview">
            <h3>{recipe.englishName}</h3>
            {recipe.image && <img src={recipe.image} alt="Preview" />}
            {recipe.ingredients.map((i, n) => (
              <p key={n}>
                {i.name} — {i.quantity}
              </p>
            ))}
            {recipe.steps.map((s, n) => (
              <p key={n}>
                {n + 1}. {s}
              </p>
            ))}
          </div>
        )}
        <p className="notice">
          ထုတ်ပြန်ပါက ဤ Draft ရှိ မီနူးစာရင်းတစ်ခုလုံးကို အက်ပ်က အသုံးပြုမည်။
          မသိမ်းရသေးသော ပြင်ဆင်ချက်များလည်း ပါဝင်မည်။
        </p>
        <div className="admin-toolbar">
          <button
            disabled={busy}
            className="primary"
            onClick={() => void publish()}
          >
            အတည်ပြုပြီး ထုတ်ပြန်မည်
          </button>
          <button onClick={() => setPreview(false)}>ပြန်ပြင်မည်</button>
        </div>
      </dialog>
    </main>
  );
}
