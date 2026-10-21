import { readdir, readFile, writeFile } from "node:fs/promises";
const base = process.env.VITE_BASE_PATH || "/";
if (!/^\/(?:[a-zA-Z0-9_-]+\/)*$/.test(base)) throw Error("Invalid base path");
const { version } = JSON.parse(await readFile("dist/version.json", "utf8"));
const assets = (await readdir("dist/assets")).map((n) => base + "assets/" + n);
const precache = [
  base,
  base + "index.html",
  base + "manifest.webmanifest",
  base + "icon-192.png",
  base + "icon-512.png",
  ...assets,
];
const manifest = JSON.parse(
  await readFile("dist/manifest.webmanifest", "utf8"),
);
manifest.id = base;
manifest.scope = base;
manifest.start_url = base;
manifest.icons = manifest.icons.map((i) => ({
  ...i,
  src: base + i.src.split("/").pop(),
}));
await writeFile("dist/manifest.webmanifest", JSON.stringify(manifest));
if (process.env.VITE_STATIC_READER === "true") {
  const data = JSON.parse(await readFile("dist/recipes.json", "utf8"));
  data.seedVersion = Date.now();
  await writeFile("dist/recipes.json", JSON.stringify(data));
  await writeFile("dist/.nojekyll", "");
}
await writeFile(
  "dist/sw.js",
  `
const VERSION=${JSON.stringify(version)}, BASE=${JSON.stringify(base)}, SHELL='9floor-v2-shell-'+BASE+VERSION, IMAGES='9floor-v2-images-'+BASE;
const PRECACHE=${JSON.stringify(precache)};
self.addEventListener('install',event=>event.waitUntil(caches.open(SHELL).then(c=>c.addAll(PRECACHE))));
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.pathname.startsWith(BASE+'api/')||['version.json','sw.js','recipes.json'].some(name=>url.pathname===BASE+name))return;
 if(request.mode==='navigate'&&url.origin===self.location.origin&&url.pathname.startsWith(BASE)){
  const fresh=new URL(request.url);fresh.searchParams.set('__app_version',VERSION);
  event.respondWith(fetch(fresh,{cache:'no-store'}).catch(()=>caches.open(SHELL).then(c=>c.match(BASE+'index.html',{ignoreVary:true}))));return;
 }
 if(url.origin===self.location.origin&&PRECACHE.includes(url.pathname)){event.respondWith(caches.open(SHELL).then(async c=>(await c.match(url.pathname,{ignoreVary:true}))||fetch(request)));return;}
 if(request.destination==='image'&&(url.origin===self.location.origin||url.hostname.endsWith('.supabase.co'))){event.respondWith(caches.open(IMAGES).then(async c=>{const cached=await c.match(request);if(cached)return cached;const response=await fetch(request);if(response.ok){await c.put(request,response.clone());const keys=await c.keys();while(keys.length>150)await c.delete(keys.shift());}return response;}));}
});
`,
);
console.log("Build version:", version, "Base:", base);
