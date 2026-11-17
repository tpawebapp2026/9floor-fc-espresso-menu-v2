import { Ingredients } from "./Ingredients";
import { ingredients, ingredientForName } from "./ingredients";
import { phaseNames } from "./assembly";
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
import { countries, coldStyles, internationalRecipes } from "./international";
import { preparationGroups, isPreparation } from "./preparations";
import DensityConverter from "./DensityConverter";
import RecipePhoto, { PhotoCredit } from "./RecipePhoto";
import {
  posterImageForName,
  posterGroups,
  posterGroupForName,
} from "./posterPhotos";
import {
  getProcedure,
  relatedStyles,
  familyNames,
  recipeFamily,
} from "./procedure";
import { isMatcha, matchaStyles, matchaStyle } from "./matcha";
import Admin from "./Admin";
import "@fontsource/noto-sans-myanmar/myanmar-400.css";
import "@fontsource/noto-sans-myanmar/myanmar-700.css";
import "./style.css";
import { STATIC_READER, readRoute, routeURL, asset } from "./platform";
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
    [worldLine, setWorldLine] = useState(""),
    [worldStyle, setWorldStyle] = useState(""),
    [matchaCountry, setMatchaCountry] = useState(""),
    [view, setView] = useState("menu"),
    [family, setFamily] = useState(""),
    [path, setPath] = useState(readRoute()),
    [fav, setFav] = useState<string[]>(() => stored("9floor-v2-favorites", [])),
    [recent, setRecent] = useState<string[]>(() =>
      stored("9floor-v2-recent", []),
    ),
    [theme, setTheme] = useState(() => stored("9floor-v2-theme", "light")),
    [update, setUpdate] = useState<null | (() => void)>(null),
    [install, setInstall] = useState<any>(null),
    [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = menuRef.current;
    if (!dialog) return;
    if (menuOpen && !dialog.open) dialog.showModal();
    if (!menuOpen && dialog.open) dialog.close();
    const previous = document.body.style.overflow;
    if (menuOpen) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);
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
    setMenuOpen(false);
    history.pushState({ from: readRoute() }, "", routeURL(p));
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
    setFamily("");
    setQuery("");
    setCategory("");
    setCountry("");
    setWorldLine("");
    setWorldStyle("");
    setMatchaCountry("");
    navigate("/");
  };
  const selected = path.startsWith("/recipe/")
    ? catalog?.recipes.find((r) => r.id === decodeURIComponent(path.slice(8)))
    : null;
  const source = catalog?.recipes || [];
  const currentRecipes =
    view === "album"
      ? source.filter(
          (r) => !isPreparation(r) && !!posterImageForName(r.englishName),
        )
      : view === "styles"
        ? source.filter((r) => !family || recipeFamily(r) === family)
        : view === "preparations"
          ? source.filter(isPreparation)
          : view === "matcha"
            ? source.filter(
                (r) =>
                  isMatcha(r) &&
                  (!matchaCountry || matchaStyle(r)?.id === matchaCountry),
              )
            : view === "world"
              ? internationalRecipes(source, worldLine, country, worldStyle)
              : view === "favorites"
                ? source.filter((r) => fav.includes(r.id))
                : view === "recent"
                  ? recent
                      .map((id) => source.find((r) => r.id === id))
                      .filter((r): r is Recipe => !!r)
                  : source.filter(
                      (r) =>
                        !isPreparation(r) &&
                        (query.trim() ? true : r.line === line),
                    );
  const results = searchRecipes(currentRecipes, query).filter(
    (r) =>
      !category ||
      (view === "album"
        ? posterGroupForName(r.englishName) === category
        : r.categoryId === category),
  );
  return (
    <>
      <header className="topbar">
        <button className="brand" onClick={() => selectView("menu")}>
          <span className="brand-logo-icon">
            <img
              src={asset("brand/9floor-coffee-logo.jpg")}
              alt=""
              width="48"
              height="48"
            />
          </span>
          <span>
            9 FLOOR COFFEE<small>COFFEE & COLD DRINKS</small>
          </span>
        </button>

        <button
          className="icon-button menu-trigger"
          aria-label="Menu ဖွင့်ရန်"
          aria-expanded={menuOpen}
          aria-controls="app-menu"
          onClick={() => setMenuOpen(true)}
        >
          ☰
        </button>
      </header>
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

      <dialog
        id="app-menu"
        ref={menuRef}
        className="side-menu"
        aria-labelledby="side-menu-title"
        onCancel={() => setMenuOpen(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setMenuOpen(false);
        }}
      >
        <div className="side-menu-content">
          <div className="side-menu-heading">
            <h2 id="side-menu-title">Menu</h2>
            <button
              className="icon-button"
              aria-label="Menu ပိတ်ရန်"
              onClick={() => setMenuOpen(false)}
            >
              ×
            </button>
          </div>
          <nav className="desktop-nav" aria-label="အဓိကမီနူး">
            <button
              className={path.startsWith("/ingredient") ? "active" : ""}
              onClick={() => navigate("/ingredients")}
            >
              ကုန်ကြမ်းများ
            </button>
            <button
              className={view === "menu" ? "active" : ""}
              onClick={() => selectView("menu")}
            >
              မီနူးစာအုပ်
            </button>
            <button
              className={view === "album" ? "active" : ""}
              onClick={() => selectView("album")}
            >
              9 FLOOR Album
            </button>
            <button
              className={view === "world" ? "active" : ""}
              onClick={() => selectView("world")}
            >
              နိုင်ငံတကာစတိုင်
            </button>
            <button onClick={() => selectView("favorites")}>
              အကြိုက်ဆုံး ♡
            </button>
            <button
              className={view === "preparations" ? "active" : ""}
              onClick={() => selectView("preparations")}
            >
              အခြေခံပြင်ဆင်မှု
            </button>
          </nav>
          <div className="drawer-category">
            <label htmlFor="recipe-category">အမျိုးအစား</label>{" "}
            <select
              id="recipe-category"
              aria-label="အမျိုးအစား ရွေးရန်"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setMenuOpen(false);
              }}
            >
              <option value="">အမျိုးအစား အားလုံး</option>
              {(view === "album" ? posterGroups : catalog?.categories || [])
                .filter((c) =>
                  currentRecipes.some((r) =>
                    view === "album"
                      ? posterGroupForName(r.englishName) === c.id
                      : r.categoryId === c.id,
                  ),
                )
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>
          <div
            className="drawer-filters"
            onClick={(e) => {
              const target = e.target as HTMLElement;
              if (target.closest("button") && !target.closest(".world-lines"))
                setMenuOpen(false);
            }}
          >
            {" "}
            <div className="section-intro">
              <div>
                <span className="eyebrow">YOUR RECIPE LIBRARY</span>
                <h2>
                  {view === "album"
                    ? "9 FLOOR COFFEE — Menu Album"
                    : view === "styles"
                      ? "အမျိုးအစားအလိုက် စတိုင်စုံ"
                      : view === "matcha"
                        ? "Matcha — နိုင်ငံတကာစတိုင်များ"
                        : view === "preparations"
                          ? "ဖျော်ရည်၏ အခြေခံလက်ရာများ"
                          : view === "world"
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
              <>
                <button
                  className="video-recipes-shortcut"
                  onClick={() => {
                    setLine("cold");
                    setCategory("video-tea-refreshing");
                    setQuery("");
                  }}
                >
                  ▶ Video Recipe · Part 01–20{" "}
                  <small>ဖျော်နည်း ၂၂ မျိုး · Video မူရင်းခွက်ပုံများ</small>
                </button>
                {[
                  [
                    "coffee",
                    "Coffee · Part 01–21",
                    "ကော်ဖီနှင့် အမြှုပ် · ၂၂ မျိုး",
                    "barista",
                  ],
                  [
                    "berry",
                    "Berry Series · Part 01–16",
                    "စတော်ဘယ်ရီနှင့် မစ်စ်ဘယ်ရီ · ၁၇ မျိုး",
                    "cold",
                  ],
                  [
                    "twotone",
                    "Two Tone · Part 01–14",
                    "အလွှာဖျော်ရည် · ၁၆ မျိုး",
                    "cold",
                  ],
                  [
                    "matcha",
                    "Matcha · Part 01–18",
                    "မတ်ချာစတိုင် · ၂၀ မျိုး",
                    "cold",
                  ],
                ].map(([id, title, description, recipeLine]) => (
                  <button
                    key={id}
                    className="video-recipes-shortcut"
                    onClick={() => {
                      setLine(recipeLine);
                      setCategory("video-series-" + id);
                      setQuery("");
                    }}
                  >
                    ▶ Video {title}
                    <small>{description} · 9 Floor ပုံအသစ်များ</small>
                  </button>
                ))}
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
                      {
                        source.filter(
                          (r) => r.line === "barista" && !isPreparation(r),
                        ).length
                      }
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
                      {
                        source.filter(
                          (r) => r.line === "cold" && !isPreparation(r),
                        ).length
                      }
                    </span>
                  </button>
                </div>
                <button
                  className="matcha-shortcut"
                  onClick={() => selectView("album")}
                >
                  📸 9 FLOOR COFFEE Poster Album မီနူးများ ကြည့်ရန် ↗
                </button>
                <button
                  className="matcha-shortcut"
                  onClick={() => selectView("matcha")}
                >
                  🍵 Matcha သီးသန့်ကြည့်ရန် · {source.filter(isMatcha).length}{" "}
                  မျိုး <span>ထိုင်းနှင့် နိုင်ငံတကာစတိုင်များ ↗</span>
                </button>
                <button
                  className="matcha-shortcut"
                  onClick={() => selectView("styles")}
                >
                  အမျိုးအစားအားလုံး၏ စတိုင်စုံ ကြည့်ရန် ↗
                </button>
                {query.trim() && (
                  <p className="muted search-scope">
                    ကော်ဖီနှင့် အအေးစုံ နှစ်လိုင်းလုံးမှ ရှာဖွေထားသည်။
                  </p>
                )}
              </>
            )}
            {view === "album" && (
              <p className="muted">
                Menu Album ထဲက ပုံများကို မီနူးအမည်အတိုင်း ချိတ်ထားသည်။
                ပုံများသည် Poster ဒီဇိုင်းနမူနာများ ဖြစ်ပြီး Recipe များကို
                ဆိုင်မရောင်းမီ စမ်းသပ်အတည်ပြုပါ။
              </p>
            )}
            {view === "styles" && (
              <div className="matcha-styles" aria-label="စတိုင်အုပ်စုများ">
                {Object.entries(familyNames).map(([id, name]) => (
                  <button
                    key={id}
                    onClick={() => {
                      setQuery("");
                      setCategory("");
                      setFamily(id);
                    }}
                  >
                    {name}
                    <small>
                      {source.filter((r) => recipeFamily(r) === id).length}{" "}
                      မျိုး
                    </small>
                  </button>
                ))}
              </div>
            )}
            {view === "styles" &&
              Object.entries(familyNames).map(([id, name]) => (
                <details className="detail-panel" id={"family-" + id} key={id}>
                  <summary>{name}</summary>
                  <div className="related-styles">
                    {source
                      .filter((r) => recipeFamily(r) === id)
                      .map((r) => (
                        <button
                          key={r.id}
                          onClick={() => navigate("/recipe/" + r.id)}
                        >
                          {r.menuNumber || ""} {r.englishName}
                        </button>
                      ))}
                  </div>
                </details>
              ))}
            {view === "matcha" && (
              <>
                <p className="muted">
                  Pure matcha နှင့် premix ကို ပမာဏတူ အစားမထိုးပါနှင့်။
                  နိုင်ငံအမည်များသည် စတိုင်ရည်ညွှန်းချက်ဖြစ်ပြီး အသစ်များကို
                  ဆိုင်မရောင်းမီ အရသာစမ်းပါ။
                </p>
                <div
                  className="matcha-styles"
                  aria-label="Matcha စတိုင်ရွေးရန်"
                >
                  <button
                    className={!matchaCountry ? "selected" : ""}
                    onClick={() => {
                      setMatchaCountry("");
                      setCategory("");
                      setQuery("");
                    }}
                  >
                    စတိုင်အားလုံး
                  </button>
                  {matchaStyles.map((s) => (
                    <button
                      key={s.id}
                      className={matchaCountry === s.id ? "selected" : ""}
                      onClick={() => {
                        setMatchaCountry(s.id);
                        setCategory("");
                        setQuery("");
                      }}
                    >
                      {s.flag} {s.name}
                      <small>
                        {
                          source.filter((r) => matchaStyle(r)?.id === s.id)
                            .length
                        }{" "}
                        မျိုး
                      </small>
                    </button>
                  ))}
                </div>
              </>
            )}
            {view === "preparations" && (
              <>
                <p className="muted">
                  Syrup · Sauce · Fruit Concentrate · Fruit Purée —
                  မူရင်းဖျော်ရည်များနှင့် သီးခြား။ အသစ်ရေးဆွဲထားသော စမ်းသပ်
                  batch များဖြစ်ပြီး ဆိုင်မရောင်းမီ အရသာနှင့် လုပ်ငန်းစဉ်ကို
                  အတည်ပြုပါ။
                </p>
                <div className="preparation-groups">
                  <button
                    className={!category ? "selected" : ""}
                    onClick={() => {
                      setCategory("");
                      setQuery("");
                    }}
                  >
                    အားလုံး
                  </button>
                  {preparationGroups.map((g) => (
                    <button
                      key={g.id}
                      className={category === g.id ? "selected" : ""}
                      onClick={() => {
                        setCategory(g.id);
                        setQuery("");
                      }}
                    >
                      <span aria-hidden="true">{g.icon}</span>
                      <b>{g.name}</b>
                      <small>
                        {g.mm} ·{" "}
                        {source.filter((r) => r.categoryId === g.id).length}{" "}
                        မျိုး
                      </small>
                    </button>
                  ))}
                </div>
              </>
            )}
            {view === "world" && (
              <>
                <p className="muted">
                  လက်ရှိကော်ဖီနှင့် အအေးမီနူးများကို ပြန်လည်စုစည်းထားသည်။
                  နိုင်ငံအမည်များသည် စတိုင်ရည်ညွှန်းချက်ဖြစ်ပြီး
                  ဒေသမူရင်းစစ်မှန်မှုကို အတည်ပြုထားခြင်း မရှိသေးပါ။
                </p>
                <div
                  className="world-lines"
                  aria-label="နိုင်ငံတကာ မီနူးလိုင်းရွေးရန်"
                >
                  {[
                    ["", "အစုံ"],
                    ["barista", "Barista ကော်ဖီ"],
                    ["cold", "အအေးစုံ"],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      aria-pressed={worldLine === value}
                      onClick={() => {
                        setWorldLine(value);
                        setWorldStyle("");
                        setCountry("");
                        setCategory("");
                        setQuery("");
                      }}
                    >
                      {label}
                      <small>
                        {internationalRecipes(source, value).length} မီနူး
                      </small>
                    </button>
                  ))}
                </div>
                {worldLine === "cold" && (
                  <div
                    className="cold-style-grid"
                    aria-label="နိုင်ငံတကာ အအေးစတိုင်များ"
                  >
                    <button
                      className={!worldStyle ? "selected" : ""}
                      onClick={() => {
                        setWorldStyle("");
                        setCountry("");
                        setCategory("");
                        setQuery("");
                      }}
                    >
                      အအေးစုံ အားလုံး ·{" "}
                      {internationalRecipes(source, "cold").length}
                    </button>
                    {coldStyles.map((s) => (
                      <button
                        key={s.id}
                        className={worldStyle === s.id ? "selected" : ""}
                        onClick={() => {
                          setWorldStyle(s.id);
                          setCountry("");
                          setCategory("");
                          setQuery("");
                        }}
                      >
                        <b>{s.name}</b>
                        <span>{s.mm}</span>
                        <small>
                          {
                            internationalRecipes(source, "cold", "", s.id)
                              .length
                          }{" "}
                          မီနူး
                        </small>
                      </button>
                    ))}
                  </div>
                )}
                <div className="country-grid">
                  <button
                    className={!country ? "selected" : ""}
                    onClick={() => {
                      setCountry("");
                      setWorldStyle("");
                      setCategory("");
                      setQuery("");
                    }}
                  >
                    🌐 အားလုံး
                  </button>
                  {countries.map((c) => (
                    <button
                      key={c.name}
                      disabled={
                        !internationalRecipes(source, worldLine, c.name).length
                      }
                      className={country === c.name ? "selected" : ""}
                      onClick={() => {
                        setCountry(c.name);
                        setWorldStyle("");
                        setCategory("");
                        setQuery("");
                      }}
                    >
                      <span>{c.flag}</span>
                      <b>{c.name}</b>
                      <small>
                        {internationalRecipes(source, worldLine, c.name).length}{" "}
                        မီနူး
                      </small>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>{" "}
          <div className="list-meta">
            <span>{results.length} မီနူး တွေ့ရှိသည်</span>
            <button
              className="text-button"
              onClick={() => selectView("recent")}
            >
              မကြာသေးမီက ကြည့်ထားသည် ↗
            </button>
          </div>
          <div className="drawer-tools">
            {" "}
            <button
              className="icon-button"
              aria-label="အလင်းအမှောင် ပြောင်းရန်"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            >
              {theme === "light" ? "☾" : "☀"}
            </button>
            <button className="text-button" onClick={() => void sync()}>
              မီနူးများ Update စစ်ရန် ↻
            </button>
          </div>{" "}
          <div className="connection">
            <span className={online ? "dot" : "dot offline"} />
            {online ? "အွန်လိုင်း" : "အော့ဖ်လိုင်း · သိမ်းထားသော မီနူးများ"}
            <span className="status">
              {status} {catalog && `· R${catalog.revision}`}
            </span>
          </div>
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
              ကြည့်ပါ။ အော့ဖ်လိုင်းဖုန်းများ အင်တာနက်ပြန်ရမှ Update ရနိုင်ပါသည်။{" "}
              <a
                href={asset("photo-credits.html")}
                target="_blank"
                rel="noreferrer"
              >
                ဓာတ်ပုံရှင်များနှင့် အသုံးပြုခွင့်
              </a>
            </small>
          </footer>
          <div className="drawer-apply">
            <button className="primary" onClick={() => setMenuOpen(false)}>
              မီနူးပုံများ ကြည့်မည် →
            </button>
          </div>
        </div>
      </dialog>
      {path === "/admin" && !STATIC_READER ? (
        <Admin
          catalog={catalog}
          onPublished={() => void sync()}
          onExit={() => navigate("/")}
        />
      ) : path === "/ingredients" || path.startsWith("/ingredient/") ? (
        <Ingredients
          key={path}
          recipes={source}
          id={
            path.startsWith("/ingredient/")
              ? path.slice("/ingredient/".length)
              : undefined
          }
          navigate={navigate}
        />
      ) : selected ? (
        <RecipeDetail
          key={selected.id}
          recipe={selected}
          related={relatedStyles(selected, source)}
          openIngredient={(id) => navigate("/ingredient/" + id)}
          backLabel={
            typeof history.state?.from === "string" &&
            history.state.from.startsWith("/ingredient/")
              ? "← ကုန်ကြမ်းသို့ ပြန်ရန်"
              : undefined
          }
          open={(id) => navigate("/recipe/" + id)}
          favorite={fav.includes(selected.id)}
          toggle={() => toggle(selected.id)}
          back={() =>
            navigate(
              typeof history.state?.from === "string" &&
                history.state.from.startsWith("/ingredient/")
                ? history.state.from
                : "/",
            )
          }
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
        <main className="photo-gallery">
          <div className="search-row">
            <label className="search">
              <span>⌕</span>
              <input
                type="search"
                aria-label="မီနူးရှာရန်"
                placeholder="မီနူးအမည် / နံပါတ်ဖြင့် ရှာမယ်…"
                value={query}
                onChange={(e) => {
                  const value = e.target.value;
                  setQuery(value);
                  if (
                    value.trim() &&
                    !["favorites", "recent", "preparations"].includes(view)
                  ) {
                    setView("menu");
                    setCategory("");
                    setCountry("");
                    setWorldLine("");
                    setWorldStyle("");
                    setMatchaCountry("");
                    setFamily("");
                  }
                }}
              />
            </label>
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
                  <div
                    className={
                      "card-image " +
                      r.line +
                      (posterImageForName(r.englishName) ? " poster-image" : "")
                    }
                  >
                    <RecipePhoto recipe={r} />
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
                    <h3>{r.englishName.replace(/\s*·\s*Video.*$/i, "")}</h3>
                    {r.burmeseName && <p>{r.burmeseName}</p>}
                    <div className="card-bottom">
                      <span>
                        {isPreparation(r)
                          ? "Batch recipe · g / ml"
                          : r.cupSizes.length
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
        </main>
      )}
    </>
  );
}
function RecipeDetail({
  recipe: r,
  favorite,
  toggle,
  back,
  categoryName,
  related,
  open,
  openIngredient,
  backLabel = "← မီနူးများသို့ ပြန်ရန်",
}: {
  backLabel?: string;
  openIngredient: (id: string) => void;
  recipe: Recipe;
  favorite: boolean;
  toggle: () => void;
  back: () => void;
  categoryName: string;
  related: Recipe[];
  open: (id: string) => void;
}) {
  const procedure = getProcedure(r);
  const [servings, setServings] = useState(1);
  const [checks, setChecks] = useState<number[]>([]);
  const egg = /egg|ကြက်ဥ/i.test(
    r.englishName + " " + r.ingredients.map((i) => i.name).join(" "),
  );
  return (
    <main className="detail">
      <button className="text-button" onClick={back}>
        {backLabel}
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
            <RecipePhoto recipe={r} detail />
          </div>
          <PhotoCredit recipe={r} />
          <div className="notice">
            {r.verification === "owner-tested"
              ? "ပိုင်ရှင် စမ်းသပ်အတည်ပြုထားသည်"
              : isPreparation(r)
                ? "V2 အတွက် အသစ်ရေးဆွဲထားသော စမ်းသပ်ဖျော်နည်း။ လက်တွေ့ဖျော်စမ်းပြီးဟု မအတည်ပြုရသေးပါ။"
                : "လက်တွေ့ စမ်းသပ်အတည်ပြုရန် ကျန်သော ဖျော်နည်း။ ဆိုင်ရောင်းမီ စမ်းသပ်အတည်ပြုပါ။"}
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
                {isPreparation(r) ? "Batch အရေအတွက်" : "ခွက်အရေအတွက်"}{" "}
                <select
                  aria-label={
                    isPreparation(r) ? "Batch အရေအတွက်" : "ခွက်အရေအတွက်"
                  }
                  value={servings}
                  onChange={(e) => setServings(Number(e.target.value))}
                >
                  {[1, 2, 3, 4, 5, 10].map((n) => (
                    <option key={n}>{n}</option>
                  ))}
                </select>
              </label>
            </div>
            {isPreparation(r) ? (
              <p className="muted">
                ပမာဏသည် batch တစ်ခုစာ။ g ကို အဓိကချိန်ပါ။ ≈ ml သည် အနီးစပ်ဆုံး၊
                တိုင်းမထားသော အသီး/မှုန့်၏ ml ကို မခန့်မှန်းထားပါ။ Batch
                အချောရည်အတွက် အောက်ပါ converter ဖြင့် တိုင်းတာပြောင်းနိုင်သည်။
              </p>
            ) : (
              <p className="muted">
                မူရင်းအရွယ်:{" "}
                {r.cupSizes.length
                  ? r.cupSizes.map((s) => s + " oz").join(" / ")
                  : "မသတ်မှတ်ရသေး"}
                ။ ခွက်အရွယ်အသစ်အတွက် အချိုး မခန့်မှန်းထားပါ။
              </p>
            )}
            {(procedure.assembly?.ingredients || r.ingredients).map((i, n) => (
              <div className="ingredient" key={n}>
                <span>{i.name}</span>
                <b>
                  {i.quantity
                    ? scaleQuantity(i.quantity, servings)
                    : "မူရင်းတွင် ပမာဏမပါ"}
                </b>
              </div>
            ))}
            <details>
              <summary>ကုန်ကြမ်းပုံအစစ်နှင့် အသုံးပြုပုံ ကြည့်ရန်</summary>
              <div className="ingredient-profile-links">
                {ingredients
                  .filter((p) =>
                    r.ingredients.some((i) =>
                      ingredientForName(i.name).some((m) => m.id === p.id),
                    ),
                  )
                  .map((p) => (
                    <button key={p.id} onClick={() => openIngredient(p.id)}>
                      {p.name} →
                    </button>
                  ))}
              </div>
            </details>
            {servings > 1 && (
              <p className="notice">
                {isPreparation(r) ? (
                  "အောက်ပါအဆင့်များသည် batch တစ်ခုစာ ဖြစ်သည်။ အထက်ပါပမာဏသာ batch အရေအတွက်အလိုက် တိုးထားသည်။ အစပြုသူအတွက် batch တစ်ခုချင်း ပြုလုပ်ပါ။"
                ) : (
                  <>
                    တစ်ခွက်စာ ဖျော်နည်းအဆင့်များကို အောက်တွင် မူရင်းအတိုင်း
                    ပြထားသည်။ ခွက်တစ်ခွက်စီအလိုက် ဖျော်ပါ။ အထက်ပါပမာဏသည်
                    စုစုပေါင်းပြင်ဆင်ရန် ဖြစ်သည်။
                  </>
                )}
              </p>
            )}
          </section>
          {isPreparation(r) ? (
            <DensityConverter />
          ) : (
            <details className="detail-panel">
              <summary>မိမိပစ္စည်း၏ သိပ်သည်းဆဖြင့် g ↔ ml တွက်ရန်</summary>
              <DensityConverter />
            </details>
          )}
          <section className="detail-panel assembly-procedure">
            {procedure.assembly && (
              <div className="assembly-summary">
                <span className="eyebrow">
                  {procedure.assembly.kind === "batch"
                    ? "BATCH ORDER"
                    : "CUP ORDER"}
                </span>
                <h2>
                  {procedure.assembly.kind === "batch"
                    ? "အိုး / Blender ထဲ ပထမဘာထည့်မလဲ"
                    : "သောက်ခွက်ထဲ ပထမဘာထည့်မလဲ"}
                </h2>
                {procedure.assembly.kind === "drink" ? (
                  <ol className="cup-order">
                    {procedure.assembly.cupOrder.map((text, i) => (
                      <li key={i}>{text}</li>
                    ))}
                  </ol>
                ) : (
                  <p>
                    ဤမီနူးသည် အခြေခံရည် တစ် batch ဖြစ်သည်။ အောက်က အိုး / Blender
                    အဆင့်များကို အစဉ်လိုက် လိုက်လုပ်ပါ။
                  </p>
                )}
                <p>
                  အောက်ပါ အသေးစိတ်အဆင့်များတွင် ကြိုဖျော်ခွက်ကို အရင်ပြင်ပြီးမှ
                  သောက်ခွက်ထဲ ထည့်ပါ။ ပစ္စည်းတစ်ခုကို နှစ်ခါထည့်ရန် မဟုတ်ပါ။
                </p>
              </div>
            )}
            <div className="panel-heading">
              <h2>ဖျော်နည်း အဆင့်လိုက်</h2>
              <small>
                {checks.length}/{procedure.steps.length}
              </small>
            </div>
            <p className="muted">
              အဆင့်တိုင်း၏ ခွက်အမည်ကို အရင်ကြည့်ပါ။ ဤပမာဏများသည် တစ်ခွက်စာ / တစ်
              batch စာ ဖြစ်သည်။
            </p>
            {procedure.assembly &&
              procedure.assembly.adjustments.length > 0 && (
                <details className="assembly-choices">
                  <summary>
                    ဤလိုက်ဖျော်အစဉ်အတွက် ရွေးထားသောပစ္စည်း / ပမာဏ
                  </summary>
                  {procedure.assembly.adjustments.map((text, i) => (
                    <p key={i}>{text}</p>
                  ))}
                </details>
              )}
            {procedure.warnings.map((w, i) => (
              <p className="notice" key={i}>
                {w}
              </p>
            ))}
            {procedure.steps.map((s, i) => (
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
                <span className="step-copy">
                  {procedure.assembly && (
                    <b className="step-vessel">
                      {phaseNames[procedure.assembly.steps[i].phase]} ·{" "}
                      {procedure.assembly.steps[i].vessel}
                      {procedure.assembly.steps[i].cupNumber
                        ? ` · ခွက်ထဲ အဆင့် ${procedure.assembly.steps[i].cupNumber}`
                        : ""}
                    </b>
                  )}
                  <span>{s.replace(/^\d+\.\s*/, "")}</span>
                </span>
              </label>
            ))}
            <button className="text-button" onClick={() => setChecks([])}>
              အဆင့်များ ပြန်စရန် ↻
            </button>
            <details className="original-procedure">
              <summary>ယခင်ဖျော်နည်း (ကိုးကားရန်)</summary>
              <ol>
                {r.steps.map((s, i) => (
                  <li key={i}>{s.replace(/^\d+\.\s*/, "")}</li>
                ))}
              </ol>
            </details>
            <details className="related-procedure">
              <summary>
                {familyNames[recipeFamily(r)]} · ဆက်စပ် {related.length} မျိုး
              </summary>
              <div className="related-styles">
                {related.map((item) => (
                  <button key={item.id} onClick={() => open(item.id)}>
                    {item.menuNumber || ""} {item.englishName}
                  </button>
                ))}
              </div>
            </details>
          </section>
        </div>
      </div>
    </main>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
