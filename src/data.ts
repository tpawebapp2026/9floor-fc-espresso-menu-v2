import { createClient } from "@supabase/supabase-js";
import { CatalogSchema, newer, type Catalog } from "./model";
import { BASE, STATIC_READER, asset } from "./platform";
export const db =
  !STATIC_READER &&
  import.meta.env.VITE_SUPABASE_URL &&
  import.meta.env.VITE_SUPABASE_ANON_KEY
    ? createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY,
        {
          global: {
            fetch: (input, init) =>
              fetch(input, { ...init, cache: "no-store" }),
          },
        },
      )
    : null;
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open("9floor-v2" + (BASE === "/" ? "" : BASE), 1);
    r.onupgradeneeded = () => r.result.createObjectStore("data");
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
export async function loadLocal(): Promise<Catalog | null> {
  try {
    const d = await openDB();
    return await new Promise((resolve, reject) => {
      const t = d.transaction("data");
      const q = t.objectStore("data").get("catalog");
      q.onsuccess = () =>
        resolve(q.result ? CatalogSchema.parse(q.result) : null);
      q.onerror = () => reject(q.error);
      t.oncomplete = () => d.close();
    });
  } catch {
    return null;
  }
}
// One atomic read/write transaction prevents stale tabs from overwriting a later revision.
export async function saveLocal(incoming: Catalog) {
  const d = await openDB();
  return await new Promise<Catalog>((resolve, reject) => {
    let winner = incoming;
    const t = d.transaction("data", "readwrite");
    const s = t.objectStore("data");
    const q = s.get("catalog");
    q.onsuccess = () => {
      if (!q.result || newer(q.result, incoming)) {
        s.put(incoming, "catalog");
      } else winner = CatalogSchema.parse(q.result);
    };
    t.oncomplete = () => {
      d.close();
      resolve(winner);
    };
    t.onerror = () => {
      d.close();
      reject(t.error);
    };
  });
}
export async function fetchPublished(
  knownRevision = -1,
): Promise<Catalog | null> {
  if (!db) {
    const res = await fetch(
      asset("recipes.json") + (STATIC_READER ? "?check=" + Date.now() : ""),
      { cache: "no-store" },
    );
    if (!res.ok) throw Error("မီနူးဖိုင်မရပါ");
    return CatalogSchema.parse(await res.json());
  }
  const meta = await db
    .from("catalog_releases")
    .select("revision")
    .order("revision", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (meta.error) throw meta.error;
  if (meta.data && meta.data.revision <= knownRevision) return null;
  const { data, error } = await db
    .from("catalog_releases")
    .select("revision,document")
    .order("revision", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw Error("မီနူးမထုတ်ပြန်ရသေးပါ");
  return CatalogSchema.parse({ ...data.document, revision: data.revision });
}
export async function isAdmin() {
  if (!db) return false;
  const { data, error } = await db.rpc("is_admin");
  return !error && data === true;
}
export async function adminRequest(action: string, body: unknown) {
  if (!db) throw Error("Supabase ချိတ်ဆက်ရန် လိုအပ်သည်");
  const { data } = await db.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw Error("ပြန်ဝင်ပါ");
  const r = await fetch("/api/admin", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ action, ...(body as object) }),
  });
  const result = await r.json();
  if (!r.ok) throw Error(result.error || "လုပ်ဆောင်မရပါ");
  return result;
}
