# 9Floor Fc Espresso Menu V2

မြန်မာဘာသာ Coffee Recipe PWA — သီးခြား project အသစ်။ Cloudflare မပါ။ မူရင်း app ကို မပြောင်းထားပါ။

**Status:** GitHub Pages reader implementation tested locally; new dedicated GitHub repository created; source upload and Pages publication in progress. Full Admin still requires Supabase + a server host. Do not deploy production without the owner's explicit approval. This is not yet certified production-ready.

- Barista 161 recipes / Cold drinks 99 recipes: 259 preserved from V8 plus verified Iced Cappuccino from V9.
- International discovery view, search, recipe details, servings, favorites, recent, light/dark.
- Admin draft/preview/publish/restore, JSON import/export; requires configured Supabase + Vercel API.
- Versioned service worker, online revalidation, atomic monotonic recipe cache in IndexedDB.
- PostgreSQL RLS + JWT authorization + JSON schema validation; migration needs execution/testing in a NEW Supabase project.
- Real photos pending verification. Illustration placeholders are not photographs.

See [GitHub Pages reader](docs/GITHUB_PAGES_MM.md) for the current deployment target.

## Local

```sh
npm ci
npm run dev -- --host 127.0.0.1
npm run build
npx tsc -p tsconfig.server.json
npm test
npx playwright install chromium
npm run test:e2e
```

Use Node 22+. Vite itself serves the public recipe reader; server APIs need Vercel dev or preview. Copy `.env.example` to a local ignored `.env` and supply only a NEW V2 project's values. Never use existing app project credentials.

`public/recipes.json` contains the migration dataset. `migration_source/v8.html` is an unchanged source reference, never executed. Reproduce with `python3 scripts/migrate.py` followed by `python3 scripts/import-v9.py`. The entire original source is retained for ingredient and step audit. Most original recipes were marked experimental by the original file; no missing quantities, numbers, names, photos or cup-size variants were fabricated.

## Documents

- [အသုံးပြုနည်း](docs/USER_GUIDE_MM.md)
- [တည်ဆောက်ပုံ](docs/ARCHITECTURE_MM.md)
- [Deployment နှင့် Maintenance](docs/DEPLOYMENT_MM.md)
- [Function checklist / QA](docs/CHECKLIST_QA_MM.md)
- [Migration audit](docs/migration-audit.json)

## Deployment boundary

Create a dedicated empty GitHub repository and new Supabase / Vercel projects. Preview only until the owner explicitly approves production. Do not assume a first Vercel Git import is a preview; it may create a production deployment. Protect the production branch, configure environment separation, and verify service plan suitability/costs before activation.

The `.github/workflows/quality.yml` is supplied source, not an active remote workflow. Account connection and repository provisioning are still required. No automatic remote deployment has been enabled.
