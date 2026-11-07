# လက်ရှိ V2 အတွက် Netlify + Supabase preview

ဤသည် ရှိပြီးသား 9Floor Fc Espresso Menu V2 ကို ဆက်တိုးချဲ့ခြင်းသာ ဖြစ်သည်။ Repository အသစ်၊ app အသစ်၊ Cloudflare project မဖန်တီးရ။ လက်ရှိ Pages preview ကို ဆက်သုံးနိုင်သည်။ Backend ကို live ချိတ်ဆက်ပြီးဟု မဆိုနိုင်သေးပါ။

## ပြင်ဆင်ထားသော source

- `netlify.toml`: root build၊ API rewrites၊ HTML / service worker / recipe cache revalidation နှင့် hashed asset caching။
- `netlify/functions/admin.ts`: ရှိပြီးသား Admin API ကိုပင် အသုံးပြုသည်။
- `netlify/functions/image.ts`: ရှိပြီးသား server-side image decode / resize / re-encode API ကိုပင် အသုံးပြုသည်။
- `server/web-adapter.ts`: Netlify ၏ Request/Response နှင့် လက်ရှိ Node API ကြား bridge ဖြစ်သည်။ JWT နှင့် server-side admin authorization မဖယ်ထားပါ။ Binary image bytes နှင့် 4 MB streaming limit ကို ထိန်းထားသည်။
- Secrets ကို code၊ GitHub၊ chat ထဲ မထည့်ရ။ Service-role key မလိုပါ။

## Account နှင့် စရိတ်

Netlify နှင့် Supabase အကောင့်ပိုင်ရှင်၏ လုံခြုံသော connection / login လိုသည်။ လုပ်ဆောင်ခွင့် / account / plan ကို အတည်မပြုဘဲ ဆက်မဖန်တီးရ။ Login / signup စာမျက်နှာတွင် စည်းမျဉ်းသဘောတူရန်ပါလျှင် ပိုင်ရှင်၏ အတည်ပြုချက် လိုသည်။

2026-10-23 တွင် စစ်ထားသော pricing အရ Netlify Free သည် $0 plan ရှိပြီး commercial projects ကို ခွင့်ပြုသည်။ လက်ရှိ usage credits / limits ကို account console နှင့် pricing မှ ပြန်စစ်ပါ။ အဟောင်း blog ၏ quota ကို လက်ရှိ quota ဟု မကူးယူပါနှင့်။ အပိုငွေ auto recharge / paid upgrade မဖွင့်ရ။ Supabase Free သည် $0 ဖြစ်ပြီး inactive project ကို တစ်ပတ်ခန့်ကြာလျှင် pause လုပ်နိုင်သည်။ Pause ဖြစ်လျှင် online sync / publishing ပြန်မရမီ owner က restore ပြုလုပ်ရန် လိုသည်။ ဤစရိတ်များသည် hosting / database အတွက်သာဖြစ်၍ custom domain / email service စရိတ်ကို မဖုံးပါ။

Vercel Hobby သည် non-commercial personal use သာဖြစ်၍ ဆိုင်လုပ်ငန်းအတွက် အခမဲ့ဟု မယူဆရ။ Vercel ကိုရွေးလျှင် paid-plan စရိတ်နှင့် သီးခြားအတည်ပြုချက်ကို အရင်ယူရမည်။

Sources:
- https://www.netlify.com/pricing/
- https://www.netlify.com/blog/introducing-netlify-free-plan/
- https://supabase.com/pricing
- https://supabase.com/docs/guides/platform/free-project-pausing
- https://vercel.com/docs/limits/fair-use-guidelines

## Database ချိတ်ဆက်ခြင်း

1. Connected Supabase account တွင် V2 အတွက် သီးသန့် project ရှိမရှိ read-only စစ်ပါ။ Unrelated project မသုံးရ။ မရှိမှ V2 အတွက် သီးသန့် resource ကို စရိတ် / authorization အတိုင်း ပြင်ဆင်ပါ။
2. `001_initial.sql` သည် empty dedicated database အတွက်သာဖြစ်သည်။ Table များရှိနေသော database ပေါ် ထပ် run မလုပ်ရ။ Project ID ကို ပြန်စစ်ပါ။
3. Owner email/password account ကို secure provider console မှ ဖန်တီးပြီး public signup ကို ပိတ်ပါ။ Login password / code ကို chat သို့ မပို့ရ။
4. ထို Auth user ၏ UUID ကိုသာ `private.admin_users` ထဲ ထည့်ပါ။ User-editable metadata ဖြင့် admin မဖြစ်စေရ။
5. RLS၊ publish RPC၊ `recipe-images` storage bucket နှင့် storage policies ပါကြောင်း စစ်ပါ။ Schema validation နှင့် expected-revision conflict check မဖယ်ရ။

## Preview environment variables

Netlify ၏ secure environment settings တွင် preview context အတွက်သာ ထည့်ပါ။ Functions runtime နှင့် build scope ကို မှန်အောင် ရွေးပါ။

| Name | Scope | Value |
| --- | --- | --- |
| VITE_SUPABASE_URL | Build | V2 Supabase project URL |
| VITE_SUPABASE_ANON_KEY | Build | Public anon key |
| SUPABASE_URL | Functions | တူညီသော V2 project URL |
| SUPABASE_ANON_KEY | Functions | တူညီသော public anon key |

`VITE_BASE_PATH=/`၊ `VITE_STATIC_READER=false` နှင့် Node 22 ကို Netlify config တွင် သတ်မှတ်ထားသည်။ Browser တွင် public key ပါဝင်ခြင်းကို လုံခြုံရေးနည်းလမ်းဟု မယူဆရ။ Server authorization နှင့် RLS သည် လိုအပ်သည်။ Service-role / database password ကို VITE_ variable အဖြစ် မထည့်ရ။

## Production မတင်ဘဲ စမ်းခြင်း

လက်ရှိ repository ကိုသာ ချိတ်ပါ။ Existing V2 Netlify project ရှိလျှင် ID / domain ကို ထိန်းထားပါ။ UI import သည် production deploy စတင်နိုင်သဖြင့် မစမ်းဘဲ မနှိပ်ရ။ ပထမ deployment ကို CLI / API ၏ draft / preview target ဖြင့်သာ လုပ်ပါ။ Netlify CLI `deploy` ၏ default draft behavior နှင့် မိမိသုံးမည့် version ၏ options ကို official docs ဖြင့် စစ်ပါ။ `--prod` မသုံးရ။ Production approval မရမီ production branch auto-publish မဖွင့်ရ။

Stable preview alias ကို ဤ app အတွက်သီးသန့်ချိတ်ပြီး deployment နှစ်ခုအကြား update ကို တူညီသော URL မှ စမ်းပါ။ Netlify domain အသစ်သည် GitHub Pages နှင့် origin မတူပါ။ ဖုန်းတွင်သိမ်းထားသော Pages Home Screen shortcut / Favorites သည် Netlify origin သို့ အလိုအလျောက် မရွှေ့ပါ။ ထို့ကြောင့် Pages URL ကို မဖျက်၊ shortcut အဟောင်းကို မဖြုတ်၊ domain ရွှေ့ပြောင်းခြင်းကို ပိုင်ရှင်စမ်းပြီး အတည်ပြုမှ လုပ်ပါ။

## Live မဖြစ်မီ လိုအပ်သော စမ်းသပ်မှု

- Missing / invalid JWT နှင့် admin မဟုတ်သူက draft, publish, image upload ကို မလုပ်နိုင်ရ။
- Anonymous user သည် latest published catalog ကိုသာ ဖတ်နိုင်ပြီး drafts / history ကို မဖတ်နိုင်ရ။
- Owner login၊ draft save/load၊ image upload၊ JSON import/export/restore၊ recipe history restore ကို preview DB ဖြင့် စမ်းရ။
- Seed 283 recipes ကို import လုပ်၍ expected revision 0 မှ ပထမ publish ကို စမ်းရ။ Recipe ကို ပြင်ပြီး code deploy မလုပ်ဘဲ connected phone တွင် published revision အသစ် ရမရ စမ်းရ။
- Concurrent publish သည် 409 conflict ဖြစ်ပြီး backup / draft မပျောက်ရ။
- iPhone / Android အစစ်၊ offline / online sync၊ Add to Home Screen နှင့် deployment update စမ်းရ။

Local unit tests နှင့် adapter bundle smoke test သည် live Netlify / Supabase / RLS စမ်းသပ်ချက်ကို မအစားထိုးပါ။ Account ချိတ်ဆက်မှု မပြီးလျှင် live test ကို မအောင်မြင်သေးဟုသာ မှတ်တမ်းတင်ပါ။

## ပြန်ထုတ်ရန်နှင့် ထိန်းသိမ်းရန်

Recipe rollback ကို previous release → draft → publish ဖြင့် version အသစ်ထုတ်ပါ။ Code rollback ကိုလည်း build ID အသစ်ဖြင့် deploy လုပ်ပါ။ Old catalog က new revision ကို မဖုံးစေရ။ Storage ပုံဟောင်းကို history မှ ညွှန်းထားနိုင်၍ မဖျက်ရ။ JSON backup သည် actual image binary မပါသဖြင့် Storage backup ကို သီးခြားထိန်းပါ။

Netlify function references:
- https://docs.netlify.com/build/functions/api/
- https://docs.netlify.com/build/functions/configuration/
- https://docs.netlify.com/build/configure-builds/file-based-configuration/
