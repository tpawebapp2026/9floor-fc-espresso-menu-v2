import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import {
  type Catalog,
  type Recipe,
  searchRecipes,
  scaleQuantity,
  newer,
} from "./model";
import { fetchPublished, loadLocal, saveLocal, db } from "./data";
import { registerUpdates } from "./pwa";
import { countries, countryRecipes } from "./international";
import Admin from "./Admin";
import "@fontsource/noto-sans-myanmar/myanmar-400.css";
import "@fontsource/noto-sans-myanmar/myanmar-700.css";
import "./style.css";
import { STATIC_READER, readRoute, routeURL } from "./platform";
function stored<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") ?? fallback;
  } catch {
    return fallback;
  }
}
function persist(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}
function App() {
  const [catalog, setCatalog] = useState<Catalog | null>(null),
    [error, setError] = useState(""),
    [status, setStatus] = useState("မီနူးများ ဖွင့်နေသည်…"),
    [online, setOnline] = useState(navigator.onLine),
    [line, setLine] = useState("barista"),
    [query, setQuery] = useState(""),
    [category, setCategory] = useState(""),
    [country, setCountry] = useState(""),
    [view, setView] = useState("menu"),
    [path, setPath] = useState(readRoute()),
    [fav, setFav] = useState<string[]>(() => stored("9floor-v2-favorites", [])),
    [recent, setRecent] = useState<string[]>(() =>
      stored("9floor-v2-recent", []),
    ),
    [theme, setTheme] = useState(() => stored("9floor-v2-theme", "light")),
    [update, setUpdate] = useState<null | (() => void)>(null),
    [install, setInstall] = useState<any>(null);
  const ref = useRef<Catalog | null>(null);
  const busy = useRef(false);
  const navigate = (p: string) => {
    if (
      readRoute() === "/admin" &&
      p !== "/admin" &&
      document.querySelector('[data-dirty="true"]') &&
      !confirm("မသိမ်းရသေးသော ပြင်ဆင်မှုများ ရှိပါသည်။ ထွက်မလား။")
    )
      return;
    history.pushState({}, "", routeURL(p));
    setPath(p);
    window.scrollTo({ top: 0 });
  };
  async function sync() {
    if (busy.current) return;
    busy.current = true;
    try {
      const incoming = await fetchPublished(ref.current?.revision ?? -1);
      if (incoming && newer(ref.current, incoming)) {
        let winner = incoming;
        let offlineSaved = true;
        try {
          winner = await saveLocal(incoming);
        } catch {
          offlineSaved = false;
        }
        ref.current = winner;
        setCatalog(winner);
        setStatus(
          offlineSaved
            ? "နောက်ဆုံးမီနူးများ သိမ်းပြီးပါပြီ"
            : "မီနူးရရှိပြီး · Offline သိမ်းမရပါ",
        );
      } else setStatus("နောက်ဆုံးမီနူးများ ဖြစ်သည်");
      setError("");
    } catch {
      setStatus("သိမ်းထားသောမီနူးများ");
      if (!ref.current)
        setError("မီနူးများ မရရှိသေးပါ။ အင်တာနက်ချိတ်ပြီး ပြန်စမ်းပါ။");
    } finally {
      busy.current = false;
    }
  }
  useEffect(() => {
    let alive = true;
    loadLocal().then((local) => {
      if (!alive) return;
      if (local) {
        ref.current = local;
        setCatalog(local);
      }
      void sync();
    });
    const foreground = () => {
      if (document.visibilityState === "visible") void sync();
    };
    const network = () => {
      setOnline(navigator.onLine);
      if (navigator.onLine) void sync();
    };
    const pop = () => setPath(readRoute());
    const installer = (e: Event) => {
      e.preventDefault();
      setInstall(e);
    };
    document.addEventListener("visibilitychange", foreground);
    window.addEventListener("focus", foreground);
    window.addEventListener("online", network);
    window.addEventListener("offline", network);
    window.addEventListener("popstate", pop);
    window.addEventListener("hashchange", pop);
    window.addEventListener("beforeinstallprompt", installer);
    void registerUpdates((fn) => setUpdate(() => fn));
    const timer = setInterval(() => {
      if (navigator.onLine && document.visibilityState === "visible")
        void sync();
    }, 60000);
    return () => {
      alive = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", foreground);
      window.removeEventListener("focus", foreground);
      window.removeEventListener("online", network);
      window.removeEventListener("offline", network);
      window.removeEventListener("popstate", pop);
      window.removeEventListener("hashchange", pop);
      window.removeEventListener("beforeinstallprompt", installer);
    };
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    persist("9floor-v2-theme", theme);
  }, [theme]);
  useEffect(() => {
    const listener = () => {
      if (
        !document.querySelector('[data-dirty="true"]') ||
        confirm(
          "မသိမ်းရသေးသော ပြင်ဆင်မှုများ ရှိပါသည်။ Update လုပ်ရန် ပြန်ဖွင့်မလား။",
        )
      )
        location.reload();
      else setUpdate(() => () => location.reload());
    };
    window.addEventListener("app-update-activated", listener);
    return () => window.removeEventListener("app-update-activated", listener);
  }, []);
  const open = (r: Recipe) => {
    const list = [r.id, ...recent.filter((x) => x !== r.id)].slice(0, 20);
    setRecent(list);
    persist("9floor-v2-recent", list);
    navigate("/recipe/" + r.id);
  };
  const toggle = (id: string) => {
    const list = fav.includes(id) ? fav.filter((x) => x !== id) : [...fav, id];
    setFav(list);
    persist("9floor-v2-favorites", list);
  };
  const selectView = (v: string) => {
    setView(v);
    setQuery("");
    setCategory("");
    setCountry("");
    navigate("/");
  };
  const selected = path.startsWith("/recipe/")
    ? catalog?.recipes.find((r) => r.id === decodeURIComponent(path.slice(8)))
    : null;
  const source = catalog?.recipes || [];
  const currentRecipes =
    view === "world"
      ? country
        ? countryRecipes(source, country)
        : source.filter((r) =>
            countries.some((c) => c.pattern.test(r.englishName)),
          )
      : view === "favorites"
        ? source.filter((r) => fav.includes(r.id))
        : view === "recent"
          ? recent
              .map((id) => source.find((r) => r.id === id))
              .filter((r): r is Recipe => !!r)
          : source.filter((r) => r.line === line);
  const results = searchRecipes(currentRecipes, query).filter(
    (r) => !category || r.categoryId === category,
  );
  return (
    <>
      <header className="topbar">
        <button className="brand" onClick={() => selectView("menu")}>
          <span className="brand-icon">
            9<span>F</span>
          </span>
          <span>
            9FLOOR FC<small>ESPRESSO MENU · V2</small>
          </span>
        </button>
        <nav className="desktop-nav">
          <button
            className={view === "menu" ? "active" : ""}
            onClick={() => selectView("menu")}
          >
            မီနူးစာအုပ်
          </button>
          <button
            className={view === "world" ? "active" : ""}
            onClick={() => selectView("world")}
          >
            နိုင်ငံတကာစတိုင်
          </button>
          <button onClick={() => selectView("favorites")}>အကြိုက်ဆုံး ♡</button>
        </nav>
        <button
          className="icon-button"
          aria-label="အလင်းအမှောင် ပြောင်းရန်"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        >
          {theme === "light" ? "☾" : "☀"}
        </button>
      </header>
      <div className="connection">
        <span className={online ? "dot" : "dot offline"} />
        {online ? "အွန်လိုင်း" : "အော့ဖ်လိုင်း · သိမ်းထားသော မီနူးများ"}
        <span className="status">
          {status} {catalog && `· R${catalog.revision}`}
        </span>
      </div>
      {update && (
        <div className="update" role="status">
          ဗားရှင်းအသစ် ရရှိပါပြီ။ ပြန်တင်ရန် မလိုပါ။
          <button
            onClick={() => {
              if (
                document.querySelector('[data-dirty="true"]') &&
                !confirm("မသိမ်းရသေးသော ပြင်ဆင်မှုများ ရှိပါသည်။ ဆက်လုပ်မလား။")
              )
                return;
              update();
            }}
          >
            ယခု Update လုပ်မည် ↻
          </button>
        </div>
      )}
      {path === "/admin" && !STATIC_READER ? (
        <Admin
          catalog={catalog}
          onPublished={() => void sync()}
          onExit={() => navigate("/")}
        />
      ) : selected ? (
        <RecipeDetail
          key={selected.id}
          recipe={selected}
          favorite={fav.includes(selected.id)}
          toggle={() => toggle(selected.id)}
          back={() => navigate("/")}
          categoryName={
            catalog?.categories.find((c) => c.id === selected.categoryId)
              ?.name || ""
          }
        />
      ) : path.startsWith("/recipe/") && catalog ? (
        <main>
          <h1>မီနူးမတွေ့ပါ</h1>
          <button onClick={() => navigate("/")}>မီနူးများသို့</button>
        </main>
      ) : (
        <main>
          <section className="hero">
            <div className="hero-copy">
              <span className="eyebrow">BREW WITH CONFIDENCE</span>
              <h1>
                တစ်ခွက်ချင်းစီမှာ
                <br />
                <em>သင့်လက်ရာ ပါစေ။</em>
              </h1>
              <p>
                ကော်ဖီနဲ့ အအေးဖျော်နည်းတွေကို တစ်နေရာတည်းမှာ။
                <br />
                ပါဝင်ပစ္စည်းမှ ဖျော်နည်းအဆင့်တိုင်းအထိ လွယ်လွယ်ကူကူ။
              </p>
              <div className="hero-stats">
                <span>
                  <strong>{catalog?.recipes.length || "—"}</strong>{" "}
                  ဖျော်နည်းများ
                </span>
                <span>
                  <strong>{catalog?.categories.length || "—"}</strong>{" "}
                  အမျိုးအစားများ
                </span>
                <span>
                  <strong>16 → 32g</strong> Espresso အခြေခံ
                </span>
              </div>
            </div>
            <div className="hero-art" aria-hidden="true">
              <div className="orbit" />
              <div className="beans">✦</div>
              <div className="cup-art">
                <span>9F</span>
                <i />
              </div>
              <div className="art-caption">
                THE DAILY RITUAL<span>16g · 32g · 25–30 sec</span>
              </div>
            </div>
          </section>
          <div className="section-intro">
            <div>
              <span className="eyebrow">YOUR RECIPE LIBRARY</span>
              <h2>
                {view === "world"
                  ? "နိုင်ငံတကာ နာမည်ကြီးစတိုင်များ"
                  : view === "favorites"
                    ? "အကြိုက်ဆုံး မီနူးများ"
                    : view === "recent"
                      ? "မကြာသေးမီက ကြည့်ထားသောမီနူးများ"
                      : "ဒီနေ့ ဘာဖျော်မလဲ။"}
              </h2>
            </div>
            <span className="muted">သင်ယူ · စမ်းသပ် · ဖန်တီး</span>
          </div>
          {view === "menu" && (
            <div className="line-tabs">
              <button
                className={line === "barista" ? "selected" : ""}
                onClick={() => {
                  setLine("barista");
                  setCategory("");
                  setQuery("");
                }}
              >
                <span className="tab-icon">☕</span>
                <span>
                  <b>Barista ကော်ဖီလိုင်း</b>
                  <small>Espresso · Brew · Signature</small>
                </span>
                <span className="tab-count">
                  {source.filter((r) => r.line === "barista").length}
                </span>
              </button>
              <button
                className={line === "cold" ? "selected cold" : ""}
                onClick={() => {
                  setLine("cold");
                  setCategory("");
                  setQuery("");
                }}
              >
                <span className="tab-icon">◒</span>
                <span>
                  <b>အအေးစုံလိုင်း</b>
                  <small>Tea · Soda · Smoothie · Milk</small>
                </span>
                <span className="tab-count">
                  {source.filter((r) => r.line === "cold").length}
                </span>
              </button>
            </div>
          )}
          {view === "world" && (
            <>
              <p className="muted">
                မူရင်းမီနူးများမှ နိုင်ငံစတိုင်အလိုက် ပြန်လည်စုစည်းထားသည်။
                ဒေသမူရင်းစစ်မှန်မှုကို အတည်ပြုထားခြင်း မရှိသေးပါ။
              </p>
              <div className="country-grid">
                <button
                  className={!country ? "selected" : ""}
                  onClick={() => setCountry("")}
                >
                  🌐 အားလုံး
                </button>
                {countries.map((c) => (
                  <button
                    key={c.name}
                    className={country === c.name ? "selected" : ""}
                    onClick={() => setCountry(c.name)}
                  >
                    <span>{c.flag}</span>
                    <b>{c.name}</b>
                    <small>{countryRecipes(source, c.name).length} မီနူး</small>
                  </button>
                ))}
              </div>
            </>
          )}
          <div className="search-row">
            <label className="search">
              <span>⌕</span>
              <input
                type="search"
                aria-label="မီနူးရှာရန်"
                placeholder="မီနူးအမည် / နံပါတ်ဖြင့် ရှာမယ်…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <select
              aria-label="အမျိုးအစား ရွေးရန်"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">အမျိုးအစား အားလုံး</option>
              {catalog?.categories
                .filter((c) =>
                  currentRecipes.some((r) => r.categoryId === c.id),
                )
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>
          <div className="list-meta">
            <span>{results.length} မီနူး တွေ့ရှိသည်</span>
            <button
              className="text-button"
              onClick={() => selectView("recent")}
            >
              မကြာသေးမီက ကြည့်ထားသည် ↗
            </button>
          </div>
          {error && (
            <div className="notice">
              {error}
              <button onClick={() => void sync()}>ပြန်စမ်းမည်</button>
            </div>
          )}
          <div className="recipe-grid">
            {results.map((r) => (
              <article className="recipe-card" key={r.id}>
                <button
                  className="card-open"
                  onClick={() => open(r)}
                  aria-label={`${r.englishName} ဖျော်နည်းကြည့်ရန်`}
                >
                  <div className={"card-image " + r.line}>
                    {r.image ? (
                      <img src={r.image} alt={r.englishName} loading="lazy" />
                    ) : (
                      <>
                        <span className="illustration" aria-hidden="true">
                          {r.line === "barista" ? "☕" : "◒"}
                        </span>
                        <span className="photo-label">
                          ဓာတ်ပုံအတည်ပြုရန် ကျန်ရှိ
                        </span>
                      </>
                    )}
                    <span className="number">
                      {r.menuNumber || r.id.toUpperCase()}
                    </span>
                  </div>
                  <div className="card-copy">
                    <span className="card-category">
                      {
                        catalog?.categories
                          .find((c) => c.id === r.categoryId)
                          ?.name.split(" — ")[0]
                      }
                    </span>
                    <h3>{r.englishName}</h3>
                    {r.burmeseName && <p>{r.burmeseName}</p>}
                    <div className="card-bottom">
                      <span>
                        {r.cupSizes.length
                          ? r.cupSizes.map((s) => s + " oz").join(" · ")
                          : "ခွက်အရွယ် မသတ်မှတ်ရသေး"}
                      </span>
                      <span className="arrow">↗</span>
                    </div>
                  </div>
                </button>
                <button
                  className="favorite"
                  aria-label={`${r.englishName} အကြိုက်ဆုံး`}
                  aria-pressed={fav.includes(r.id)}
                  onClick={() => toggle(r.id)}
                >
                  {fav.includes(r.id) ? "♥" : "♡"}
                </button>
              </article>
            ))}
          </div>
          {!results.length && !error && (
            <div className="empty">
              မီနူး မတွေ့ပါ။ အခြားနာမည်ဖြင့် ရှာကြည့်ပါ။
            </div>
          )}
          {view === "world" && (
            <aside className="proposal">
              <span className="eyebrow">COMING TO THE RECIPE BOOK</span>
              <h3>Vietnamese Egg Coffee · Hot & Iced</h3>
              <p>
                မူရင်း Egg Coffee ကို ထိန်းသိမ်းထားပါသည်။ အပူ/အအေး
                ဖျော်နည်းအသစ်နှစ်မျိုးကို ပိုင်ရှင်အတည်ပြုမှ ထည့်ပါမည်။
              </p>
            </aside>
          )}
          <footer>
            <div>
              <b>9FLOOR FC</b>
              <p>ကော်ဖီတစ်ခွက်။ လက်ရာတစ်ခု။</p>
            </div>
            <div>
              {!STATIC_READER && (
                <button
                  className="text-button"
                  onClick={() => navigate("/admin")}
                >
                  စီမံခန့်ခွဲသူ ဝင်ရန် ↗
                </button>
              )}
              <button
                className="text-button"
                onClick={() =>
                  install
                    ? install.prompt()
                    : alert(
                        "iPhone: Safari → Share → Add to Home Screen။ Android: Chrome menu → Add to Home Screen / Install app။",
                      )
                }
              >
                ဖုန်း Home Screen တွင် ထည့်ရန် ＋
              </button>
            </div>
            <small>
              မူရင်းဖိုင်ပါ ဖျော်နည်းများ၏ အတည်ပြုအဆင့်ကို မီနူးတစ်ခုချင်းစီတွင်
              ကြည့်ပါ။ အော့ဖ်လိုင်းဖုန်းများ အင်တာနက်ပြန်ရမှ Update ရနိုင်ပါသည်။
            </small>
          </footer>
        </main>
      )}
      <nav className="bottom-nav">
        <button onClick={() => selectView("menu")}>
          ☕<span>မီနူး</span>
        </button>
        <button onClick={() => selectView("world")}>
          ◎<span>နိုင်ငံတကာ</span>
        </button>
        <button onClick={() => selectView("favorites")}>
          ♡<span>အကြိုက်ဆုံး</span>
        </button>
        <button onClick={() => selectView("recent")}>
          ◷<span>ကြည့်ပြီး</span>
        </button>
      </nav>
    </>
  );
}
function RecipeDetail({
  recipe: r,
  favorite,
  toggle,
  back,
  categoryName,
}: {
  recipe: Recipe;
  favorite: boolean;
  toggle: () => void;
  back: () => void;
  categoryName: string;
}) {
  const [servings, setServings] = useState(1);
  const [checks, setChecks] = useState<number[]>([]);
  const egg = /egg|ကြက်ဥ/i.test(
    r.englishName + " " + r.ingredients.map((i) => i.name).join(" "),
  );
  return (
    <main className="detail">
      <button className="text-button" onClick={back}>
        ← မီနူးများသို့ ပြန်ရန်
      </button>
      <div className="detail-heading">
        <div>
          <span className="eyebrow">
            {r.menuNumber || r.id} · {categoryName}
          </span>
          <h1>{r.englishName}</h1>
          {r.burmeseName && <p>{r.burmeseName}</p>}
        </div>
        <button
          className="icon-button"
          aria-label="အကြိုက်ဆုံး"
          onClick={toggle}
        >
          {favorite ? "♥" : "♡"}
        </button>
      </div>
      <div className="detail-layout">
        <div>
          <div className="detail-photo">
            {r.image ? (
              <img alt={r.englishName} src={r.image} />
            ) : (
              <div className="no-photo">
                <span>☕</span>
                <p>ဓာတ်ပုံအစစ်ကို အတည်ပြုမပြီးသေးပါ။</p>
              </div>
            )}
          </div>
          <div className="notice">
            {r.verification === "owner-tested"
              ? "ပိုင်ရှင် စမ်းသပ်အတည်ပြုထားသည်"
              : "မူရင်းဖိုင်မှ ကူးယူထားသော စမ်းသပ်ဖျော်နည်း။ ဆိုင်ရောင်းမီ စမ်းသပ်အတည်ပြုပါ။"}
          </div>
          {egg && (
            <div className="notice safety">
              <b>ကြက်ဥပါဝင်သော ဖျော်ရည်</b>
              <p>
                ပိုးသတ်ထားသော (pasteurized) ကြက်ဥ/ကြက်ဥအနှစ်ကိုသာ အသုံးပြုပါ။
                ရိုးရိုးကြက်ဥအစိမ်းဖြင့် မဖျော်ပါနှင့်။ အအေးထိန်း၍
                ဖျော်ပြီးချက်ချင်း သုံးဆောင်ပါ။ ပူသောကော်ဖီလောင်းရုံဖြင့်
                ပိုးသတ်ပြီးဟု မယူဆပါနှင့်။
              </p>
            </div>
          )}
          <section className="detail-panel">
            <h3>မှတ်ချက်များ</h3>
            {r.notes.map((n, i) => (
              <p key={i}>{n}</p>
            ))}
            <small>
              Recipe V{r.version} ·{" "}
              {r.updatedAt
                ? new Date(r.updatedAt).toLocaleDateString()
                : "မူရင်းပြင်ဆင်ရက် မပါရှိ"}
            </small>
          </section>
        </div>
        <div>
          <section className="detail-panel">
            <div className="panel-heading">
              <h2>ပါဝင်ပစ္စည်းများ</h2>
              <label>
                ခွက်အရေအတွက်{" "}
                <select
                  aria-label="ခွက်အရေအတွက်"
                  value={servings}
                  onChange={(e) => setServings(Number(e.target.value))}
                >
                  {[1, 2, 3, 4, 5, 10].map((n) => (
                    <option key={n}>{n}</option>
                  ))}
                </select>
              </label>
            </div>
            <p className="muted">
              မူရင်းအရွယ်:{" "}
              {r.cupSizes.length
                ? r.cupSizes.map((s) => s + " oz").join(" / ")
                : "မသတ်မှတ်ရသေး"}
              ။ ခွက်အရွယ်အသစ်အတွက် အချိုး မခန့်မှန်းထားပါ။
            </p>
            {r.ingredients.map((i, n) => (
              <div className="ingredient" key={n}>
                <span>{i.name}</span>
                <b>
                  {i.quantity
                    ? scaleQuantity(i.quantity, servings)
                    : "မူရင်းတွင် ပမာဏမပါ"}
                </b>
              </div>
            ))}
            {servings > 1 && (
              <p className="notice">
                တစ်ခွက်စာ ဖျော်နည်းအဆင့်များကို အောက်တွင် မူရင်းအတိုင်း
                ပြထားသည်။ ခွက်တစ်ခွက်စီအလိုက် ဖျော်ပါ။ အထက်ပါပမာဏသည်
                စုစုပေါင်းပြင်ဆင်ရန် ဖြစ်သည်။
              </p>
            )}
          </section>
          <section className="detail-panel">
            <div className="panel-heading">
              <h2>ဖျော်နည်း အဆင့်လိုက်</h2>
              <small>
                {checks.length}/{r.steps.length}
              </small>
            </div>
            {r.steps.map((s, i) => (
              <label
                className={"step " + (checks.includes(i) ? "done" : "")}
                key={i}
              >
                <input
                  type="checkbox"
                  checked={checks.includes(i)}
                  onChange={() =>
                    setChecks(
                      checks.includes(i)
                        ? checks.filter((x) => x !== i)
                        : [...checks, i],
                    )
                  }
                />
                <span className="step-num">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{s.replace(/^\d+\.\s*/, "")}</span>
              </label>
            ))}
            <button className="text-button" onClick={() => setChecks([])}>
              အဆင့်များ ပြန်စရန် ↻
            </button>
          </section>
        </div>
      </div>
    </main>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
