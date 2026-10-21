# Function checklist နှင့် QA မှတ်တမ်း

စစ်ဆေးရက်: 2026-10-21 (မြန်မာအချိန်)။ စမ်းသပ်မှုများသည် local build ပေါ်တွင် ဖြစ်သည်။ Preview/Production deployment မရှိသေး။

## တည်ဆောက်ပြီးသော လုပ်ဆောင်ချက်များ

| လုပ်ဆောင်ချက်                          | အခြေအနေ                                                                                              |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| မြန်မာ UI၊ responsive၊ light/dark      | တည်ဆောက်ပြီး၊ Chromium layout စမ်းပြီး                                                               |
| Barista 161 / အအေးစုံ 99               | မူရင်းဒေတာမှ ခွဲပြီး၊ UI စမ်းပြီး                                                                    |
| နိုင်ငံတကာခေါင်းစဉ် 12 နိုင်ငံ         | မူရင်းမီနူးများသို့ ပြန်ညွှန်းပြီး၊ filter စမ်းပြီး                                                  |
| မီနူး 260 ခု၏ unique ID / detail       | စာမျက်နှာတိုင်းအတွက် actual browser စမ်းပြီး                                                         |
| Search နာမည် / menu number             | unit + mobile browser စမ်းပြီး                                                                       |
| Ingredients / preparation steps        | မူရင်းမှ ရွှေ့ပြီး၊ detail အရေအတွက် စမ်းပြီး                                                         |
| ခွက်အရေအတွက် ပြောင်းခြင်း              | metric/range scaling unit စမ်းပြီး                                                                   |
| ခွက်အရွယ်                              | မူရင်းပံ့ပိုးသော size သာ ပြထား၊ မခန့်မှန်းထား                                                        |
| Favorites / recently viewed            | ပါဝင်ပြီး၊ favorites နှင့် theme browser စမ်းပြီး; recent list ကို သီးခြား exhaustive test မလုပ်ရသေး |
| Admin login / authorization            | code ပြီး၊ backend မချိတ်ဆက်သောအခါ ဝင်မရခြင်း စမ်းပြီး; live login မစမ်းရသေး                         |
| Admin edit / category / number / steps | UI/API code ပြီး၊ live backend integration မစမ်းရသေး                                                 |
| Draft / preview / publish              | code ပြီး၊ DB transaction / optimistic revision ရေးပြီး; live publish မစမ်းရသေး                      |
| Image upload                           | server-side decode/re-encode code ပြီး၊ live upload မစမ်းရသေး                                        |
| JSON import/export                     | validation + JSON roundtrip unit စမ်းပြီး; authenticated UI backup/restore မစမ်းရသေး                 |
| Recipe version history / restore       | code ပြီး၊ live database မစမ်းရသေး                                                                   |
| PWA manifest / icons / SW              | production build ထဲ generate ပြီး                                                                    |
| Offline shell / recipes                | Chromium တွင် network ပိတ်ပြီး reload စမ်းပြီး                                                       |
| Online content sync                    | local recipe endpoint ကို updated revision ဖြင့် ဖြေပြီး sync စမ်းပြီး; Supabase end-to-end မဟုတ်    |
| Stale recipe prevention                | unit test + browser old seed fallback အစားမထိုးနိုင်မှု စမ်းပြီး                                     |
| New app Update Available               | local SW A → B file change ဖြင့် notification / click / actual reload / favorites retention စမ်းပြီး |
| Real deployment A → B                  | Vercel access မရှိသေး၍ မစမ်းရသေး                                                                     |
| GitHub source / approved auto deploy   | workflow/config files ပြီး၊ remote repo / branch protection / Git integration မချိတ်ဆက်ရသေး          |
| Real beverage photos                   | 260 ခုလုံး pending; ပုံတုကို ဓာတ်ပုံအစစ်ဟု မဖော်ပြထား                                                |
| Egg Coffee Hot/Iced additions          | အဆိုပြုထားဆဲ၊ ပိုင်ရှင်အတည်မပြုရသေး၍ မထည့်ထား                                                        |

## အမှန်တကယ် လုပ်ဆောင်ထားသော စစ်ဆေးမှုများ

- `npm run build`: TypeScript client နှင့် Vite production build အောင်မြင်။
- `npx tsc -p tsconfig.server.json`: API/authorization/image handler types အောင်မြင်။
- `npm test`: unit/API tests 20 ခု အောင်မြင်။
- Chromium browser: 260 detail pages တစ်ခုချင်းစီ၏ title / ingredient count / step count စမ်းထားသည်။
- Search, departments, country filter, favorites, dark-mode persistence စမ်းထားသည်။
- Offline reload, offline search/detail, online new revision sync, stale bundled R0 protection စမ်းထားသည်။
- Local SW A/B notification acceptance သည် actual page reload ဖြစ်ပြီး favorites မပျောက်ခြင်း စမ်းထားသည်။ Remote deployment success အဖြစ် မတွက်ထား။
- 390×844၊ 768×1024၊ 1440×1100 viewport များတွင် horizontal overflow မရှိခြင်း စမ်းပြီး screenshot ဖြင့် typography/layout ကို စစ်ထားသည်။
- `npm audit --omit=dev` တွင် production dependencies အတွက် reported vulnerabilities 0 ရရှိသည်။ ဤစစ်ချက်သည် security penetration test မဟုတ်။

Chromium ကို Linux headless တွင် run ထားသည်။ iPhone / Android အစစ်၊ Safari/WebKit engine အောင်မြင်မှုဟု မခေါ်ထားပါ။ Browser download မအောင်မြင်သဖြင့် packaged Chromium binary ကို အသုံးပြု၍ အမှန်တကယ် browser tests ကို run ထားသည်။ Source project တွင် ယင်း binary မပါဝင်ပါ။

နောက်ဆုံး browser suite တွင် **7 ခုလုံး အောင်မြင်**၊ failed/skipped 0 ဖြစ်သည်။ `test-results.json` တွင် စမ်းသပ်အတိုင်းအတာနှင့် ကျန်ရှိသည့်အရာများ ပါသည်။

## ထပ်စမ်းရန် လိုသေးသောအချက်များ

1. Vercel Preview deployment တင်ခြင်းနှင့် URL အမှန်ရရှိခြင်း။
2. Supabase project အသစ်အပေါ် SQL migration၊ pg_jsonschema နှင့် RLS execution။
3. Anonymous၊ non-admin authenticated၊ admin JWT အစုံဖြင့် read/write/publish/upload permissions စမ်းခြင်း။
4. Admin login၊ edit/save/load/publish၊ actual image upload၊ JSON backup/restore၊ concurrent publish conflict စမ်းခြင်း။
5. iPhone Safari နှင့် Home Screen app၊ Android Chrome နှင့် installed PWA ကို ပိုင်ရှင်၏ဖုန်းများတွင် စမ်းခြင်း။
6. Deployed app A → B အမှန်တကယ် update notification နှင့် offline/online sync စမ်းခြင်း။
7. ပိုင်ရှင်က မူရင်းစမ်းသပ်မီနူး ပမာဏများ၊ ခွက်အရွယ်နှင့် ပုံများကို အတည်ပြုခြင်း။

အထက်ပါ ကျန်ရှိသောစစ်ဆေးမှုများ မပြီးသေးသဖြင့် production-ready ဟု မသတ်မှတ်ထားပါ။ Production deployment သည် ပိုင်ရှင်၏ သီးခြားအတည်ပြုချက် ရပြီးမှသာ ဆောင်ရွက်ရမည်။

## ထပ်တိုး API စမ်းသပ်မှု

Supabase client ကို mock လုပ်ထားသော API test 10 ခု ထပ်အောင်မြင်သည်။ JWT မပါခြင်း၊ expired JWT၊ non-admin၊ duplicate recipe၊ expected revision၊ publish conflict၊ oversized JSON၊ unauthenticated image၊ script-disguised image တို့ကို စမ်းထားသည်။ Valid PNG ကို Sharp ဖြင့် အမှန်တကယ် decode / WebP re-encode လုပ်ပြီးမှ mock storage သို့ ပို့ကြောင်းလည်း စမ်းထားသည်။ ဤစစ်ချက်များသည် live Supabase/Vercel integration သို့မဟုတ် RLS execution test မဟုတ်ပါ။ စုစုပေါင်း unit/API tests 20 ခု အောင်မြင်သည်။

## V9 မီနူးအသစ်

V9 export ကို V8 နှင့် တိုက်စစ်ရာ Iced Cappuccino တစ်ခုတည်း ထပ်တိုးပြီး မူရင်း recipe details 259 ခုတွင် ပြောင်းလဲမှု မရှိပါ။ V2 တွင် ID အသစ် v9-iced-cappuccino ဖြင့် ထည့်ပြီး မူရင်း 259 ခု၏ ID များကို ထိန်းထားသည်။ ပါဝင်ပစ္စည်းပမာဏနှင့် ဖျော်နည်းအဆင့် 9 ခုကို မူရင်း V9 အတိုင်း ယူထားသည်။ ဤမီနူးသည် source-unverified အဆင့်ဖြစ်ပြီး မိမိကိုယ်တိုင်အရသာ စမ်းသပ်အတည်ပြုပြီးဟု မဆိုပါ။

Bundled seed version အသစ်က cached R0 အဟောင်းကို ပြောင်းပေးပြီး published database revision ကို မဖုံးနိုင်ခြင်းအတွက် စမ်းသပ်ချက် ထပ်ထည့်ထားသည်။

## GitHub Pages reader ထပ်တိုး QA

မူလ root app browser tests 7 ခုနှင့် Pages repo-path tests 4 ခု အောင်မြင်သည်။ Pages အတွက် hash navigation၊ base URL၊ scoped manifest/SW၊ cache-busting deployment manifest၊ offline deep-link reload နှင့် update activation စမ်းထားသည်။ GitHub browser သည် Google device approval အဆင့်တွင် စောင့်နေ၍ remote repo/create/deploy မပြီးသေးပါ။
