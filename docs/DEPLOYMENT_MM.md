# Vercel / Supabase တင်သွင်းခြင်းနှင့် ထိန်းသိမ်းခြင်း

## လက်ရှိအဆင့်

Source နှင့် local build အဆင့်ဖြစ်သည်။ GitHub repository၊ Supabase project၊ Vercel preview တို့ မဖန်တီးရသေး။ Production မတင်ရသေးပါ။ မည်သည့် existing project ကိုမျှ မချိတ်ဆက်ပါနှင့်။

## သီးခြား project အသစ်များ

1. GitHub တွင် `9floor-fc-espresso-menu-v2` ဆိုသော empty repository အသစ် ဖန်တီးပါ။ အမည်ယူပြီးသားရှိလျှင် suffix ထည့်ပါ။ Existing app repo မသုံးပါနှင့်။
2. Supabase တွင် V2 အတွက် project အသစ် ဖန်တီးပါ။ Paid plan/စရိတ်ကို ပိုင်ရှင်နှင့် စစ်ဆေးပြီးမှ activate လုပ်ပါ။
3. `supabase/migrations/001_initial.sql` ကို project အသစ်တွင်သာ run ပါ။ Migration သည် ပထမအကြိမ်အတွက် ဖြစ်၍ existing schema ပေါ် အတင်းထပ်မသုံးပါနှင့်။
4. Supabase Auth တွင် owner account ဖန်တီးပါ။ Public sign-up ကို ပိတ်ပါ။ owner UUID ကို private.admin_users ထဲ SQL ဖြင့် ထည့်ပါ။ User-editable metadata ကို admin permission အဖြစ် မသုံးပါနှင့်။
5. Auth rate limits / password policy ကို configure လုပ်ပါ။ Password ကို Chat ထဲ မပို့ပါနှင့်။ Secure account connection/provider console မှ သာ ထည့်ပါ။
6. Preview နှင့် Production အတွက် ဖြစ်နိုင်လျှင် Supabase project နှစ်ခုခွဲသုံးပါ။ Preview data ကို production DB ပေါ် မစမ်းပါနှင့်။

## Environment variables

`.env.example` ကို ကြည့်ပါ။ VITE_SUPABASE_URL နှင့် VITE_SUPABASE_ANON_KEY သည် browser တွင် ပါဝင်မည့် public project URL/key ဖြစ်သည်။ လုံခြုံရေးသည် RLS/Auth ပေါ် အခြေခံထားသည်။ Service-role key ကို VITE_ prefix နှင့် မထည့်ရ။

Server မှ SUPABASE_URL၊ SUPABASE_ANON_KEY သုံးပြီး user bearer JWT ဖြင့် အလုပ်လုပ်သည်။ Service-role key မလိုပါ။ Preview variables ကို preview project၊ Production variables ကို production project ဖြင့် ခွဲသတ်မှတ်ပါ။ .env ကို commit မလုပ်ပါနှင့်။

## Local commands

```bash
npm ci
npm run dev -- --host 127.0.0.1
npm run build
npx tsc -p tsconfig.server.json
npm test
npx playwright install chromium
npm run test:e2e
```

Vite dev/preview သည် Vercel API functions ကို မ run ပေးပါ။ Admin online integration ကို စမ်းရန် `vercel dev` သို့မဟုတ် Vercel Preview လိုသည်။ DB မချိတ်ဆက်ထားသည့် local mode သည် `public/recipes.json` ကိုသာ ပြပြီး Admin ဝင်မရအောင် ပိတ်ထားသည်။

## GitHub နှင့် approved code deployment

Local source ကို repo အသစ်တွင်သာ push ပါ။ New repo တွင် preview အတွက် development branch နှင့် code review အတွက် PR ကို သုံးပါ။ မူရင်း repo အမည်/remote ကို မသုံးပါနှင့်။

Production approval မရမချင်း production branch သို့ merge မလုပ်ပါနှင့်။ Vercel import လုပ်ခြင်း၏ ပထမ deployment သည် production ဖြစ်နိုင်သောကြောင့် default import flow ကို preview ဟု မယူဆပါနှင့်။ ပထမအဆင့်တွင် new Vercel project ကို production deployment မပြုဘဲ ဖန်တီး၍ `vercel deploy` preview target ဖြင့်သာ တင်ပါ။ `--prod` မသုံးပါနှင့်။

Production branch ကို protected `production` branch သတ်မှတ်ပြီး owner review အတည်ပြုချက်မရှိဘဲ merge မရအောင် GitHub protection ချိန်ပါ။ Preview အတွက် `development` branch သုံးပါ။ Git integration ဖွင့်ပြီးနောက် PR / development branch push က preview deployment ပြုလုပ်မည်။ Production branch merge သည် explicit approval ရပြီးမှသာ ပြုလုပ်ရမည်။ Git integration တစ်ခုတည်းရှိခြင်းကို approval gate ဟု မယူဆပါနှင့်။ Branch protection ကို အမှန်တကယ် configure စစ်ဆေးရမည်။

GitHub Actions workflow ထည့်ထားသည်။ TypeScript client/server၊ production build နှင့် model/migration tests ကို run ပေးသည်။ Branch protection နှင့် Vercel Git connection မဖွင့်မချင်း auto-deploy လည်နေပြီဟု မဆိုနိုင်ပါ။

## ပထမဆုံး recipe publish

1. Preview DB/Auth ပြီး Admin ဝင်ပါ။
2. မီနူးဒေတာ မထုတ်ပြန်ရသေးလျှင် public list အလွတ် ဖြစ်နိုင်သည်။ Admin မှ JSON import ကို အသုံးပြုရန် initial UI က local seed ကို admin draft စတင်ဒေတာအဖြစ် သုံးနိုင်အောင် bootstrap လုပ်ထားသည်။
3. `public/recipes.json` ကို JSON import ဖြင့် တင်ပြီး Preview စစ်၍ publish လုပ်ပါ။ Expected revision သည် 0 ဖြစ်ရမည်။
4. ထုတ်ပြန်ပြီးသော catalog R1 ကို private history နှင့် public latest မှာ ခွင့်အလိုက် စမ်းပါ။
5. Phone နှစ်လုံးတွင်ဖွင့်၊ recipe ပြင်၊ Publish၊ နောက်ဆုံးပမာဏ update ရမရ စစ်ပါ။ Offline တစ်လုံး၊ online တစ်လုံးထား၍ sync ကို စမ်းပါ။

## Production မတိုင်မီ မဖြစ်မနေ စစ်ရန်

- Anonymous user က Draft/history အဟောင်းကို မဖတ်နိုင်၊ မရေးနိုင်ခြင်း။
- Sign-in လုပ်ထားသော်လည်း admin မဟုတ်သူက publish/upload မလုပ်နိုင်ခြင်း။
- Admin password login၊ expired JWT၊ draft save/load၊ image upload၊ restore စမ်းခြင်း။
- Concurrent publish conflict သည် အဟောင်းကို မဖုံးခြင်း။
- မီနူး 260 ခုနှင့် ပမာဏများကို မူရင်း/ပိုင်ရှင်နှင့် ပြန်စစ်ခြင်း။
- Photo rights နှင့် recipe-photo match စစ်ခြင်း။ လက်ရှိ placeholder များကို အစစ်ဟု မသတ်မှတ်ရ။
- iPhone Safari / Home Screen၊ Android Chrome / Home Screen အစစ်ဖြင့် စမ်းခြင်း။
- Deployment A → B အမှန်တကယ် တင်၍ waiting SW notification / accept / reload / offline ကို စမ်းခြင်း။
- စရိတ်နှင့် plan commercial-use terms စစ်ခြင်း။
- ပိုင်ရှင်၏ Production approval ရရှိခြင်း။

## Backup / maintenance

Recipe JSON ကို အပြောင်းအလဲကြီးမလုပ်ခင် ထုတ်သိမ်းပါ။ Supabase DB နှင့် Storage ကို သီးခြား backup ချပါ။ JSON သည် ပုံဖိုင်ကို မပါဝင်ပါ။ Release history ကို ပုံမှန်စောင့်ကြည့်ပါ။ Image များ immutable ဖြစ်၍ ပြောင်းတိုင်း အသစ်တင်ပြီး ပုံဟောင်းကို ဗားရှင်းများမှ ညွှန်းထားနိုင်သေးသဖြင့် မဖျက်ပါနှင့်။

Dependency updates ကို PR ဖြင့် preview စမ်းပြီးမှ merge ပါ။ `npm audit`၊ TypeScript၊ test၊ PWA A/B deployment test၊ phone physical test ကို အပြောင်းအလဲနှင့် သင့်လျော်သလို ပြန်လုပ်ပါ။

App code rollback နှင့် recipe rollback သီးခြားဖြစ်သည်။ Recipe rollback ကို Admin version history → Draft restore → Publish ဖြင့် လုပ်ပါ။ Code rollback အတွက် ယခင်စမ်းသပ်အောင်မြင် source ကို build အသစ်ဖြင့် deployment အသစ်တင်၍ SW version အသစ်ဖြစ်စေပါ။ Old deployment URL သို့သာ ပြောင်းခြင်းကို အမှန်တကယ် device test မရှိဘဲ cache-safe rollback ဟု မဆိုပါနှင့်။

## ဖုန်းတွင် သိမ်းမည့် URL

PWA install အတွက် deployment တစ်ခါချင်းသီးသန့် URL ကို မသုံးရ။ Preview စမ်းသပ်ရန် Vercel က အမှန်တကယ်ပေးသော stable branch alias ကို သုံးပြီး deployment တိုင်းတွင် alias အသစ်သို့ ပြောင်းလဲချိတ်ဆက်မှုကို စစ်ရမည်။ Production အတွက် stable project domain/custom domain ကို သုံးပါ။ Deployment A ၏ immutable URL ကို Home Screen ထဲသိမ်းထားလျှင် deployment B URL သို့ အလိုအလျောက် မရွှေ့နိုင်ပါ။ Update စနစ်ကို တူညီသော origin နှင့် stable URL ပေါ်တွင် စမ်းရမည်။
