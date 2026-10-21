# 9Floor Fc Espresso Menu V2 — တည်ဆောက်ပုံ

အသစ်သီးသန့် project ဖြစ်သည်။ မူရင်း app၊ repository၊ database နှင့် Cloudflare ကို ပြောင်းလဲမထားပါ။ ဤမိတ္တူသည် local development အဆင့်ဖြစ်ပြီး Preview / Production URL မရှိသေးပါ။

## ရွေးချယ်ထားသော စနစ်

| အပိုင်း   | နည်းပညာနှင့် ရည်ရွယ်ချက်                                                |
| --------- | ----------------------------------------------------------------------- |
| UI        | React + TypeScript + Vite၊ မြန်မာစာ၊ mobile-first CSS                   |
| Hosting   | Vercel၊ HTTPS၊ preview deployment၊ Node API                             |
| Auth / DB | အသစ်သီးသန့် Supabase Auth / PostgreSQL                                  |
| Photos    | Supabase Storage၊ server-side decode/re-encode၊ immutable WebP URLs     |
| Offline   | Service worker app shell၊ IndexedDB recipe snapshot၊ viewed-image cache |
| Source    | အသစ်သီးသန့် GitHub repo; မဖန်တီး/မချိတ်ဆက်ရသေး                          |

ဤ app သည် SEO marketing site မဟုတ်ဘဲ ဖျော်နည်း tool ဖြစ်သောကြောင့် React/Vite ကို သုံးထားသည်။ Framework ရှုပ်ထွေးမှုနည်းပြီး immutable asset filenames ရရှိသည်။ Tailwind အစား ပြင်ရလွယ်သော CSS design tokens ကို အသုံးပြုထားသည်။

## မီနူးဒေတာ

V8 မှ မူရင်း 259 ခုကို မပြောင်းဘဲ V9 မှ Iced Cappuccino တစ်ခု ထပ်ထည့်ထားသည်။ စုစုပေါင်း 260 ခု၊ category 28 ခု၊ Barista 161 ခု၊ အအေးစုံ 99 ခု ဖြစ်သည်။ နိုင်ငံတကာအပိုင်းသည် မူရင်း recipe ID တူကိုပင် ပြန်ညွှန်းသော discovery view ဖြစ်သည်။ သီးခြားမိတ္တူမပွားပါ။ နိုင်ငံခွဲခြားမှုမှာ editorial grouping ဖြစ်ပြီး စစ်မှန်သောရိုးရာဖျော်နည်းအဖြစ် အတည်ပြုထားခြင်းမရှိ။

နာမည်ထပ်မရှိ။ 160 ခုတွင် မီနူးနံပါတ် မပါ၍ null ထားသည်။ အားလုံးတွင် မူရင်း detail / ingredients / steps ရှိသည်။ ဓာတ်ပုံ 260 ခုလုံးသည် မူရင်းဖိုင်၌ အတည်မပြုရသေး၍ blank / illustration placeholder ဖြစ်သည်။ ဓာတ်ပုံအစစ်ဟု မခေါ်ထားပါ။ မြန်မာမီနူးအမည် သီးခြားမပါလျှင် null ဖြစ်သည်။ ပမာဏ၊ ဖျော်နည်းကို မခန့်မှန်းထားပါ။

မူရင်းအချို့ ingredient row တွင် ပမာဏကို အမည်ထဲ တစ်ပါတည်းရေးထားသည်။ သေချာခွဲနိုင်သော ကိန်းဂဏန်းနှင့် unit များကို သီးခြားထုတ်ထားပြီး sourceIngredients တွင် မူရင်းနှစ်ကော်လံလုံးကို သိမ်းထားသည်။ Moka pot ပမာဏကဲ့သို့ မသတ်မှတ်ထားသည်များကို မခန့်မှန်းပါ။ မူရင်းထဲရှိ အများစုကို source-unverified အဖြစ် ထိန်းထားသည်။

SQL သည် field schema ဖြင့် validate လုပ်ထားသော JSONB catalog snapshot ကို သိမ်းသည်။ ပထမဗားရှင်းတွင် မီနူးရာဂဏန်းအတွက် atomic publish / rollback လွယ်ကူစေရန် သုံးထားသည်။ public.catalog_releases တွင် immutable published versions၊ catalog_drafts တွင် owner draft ရှိသည်။ အနာဂတ်မီနူးအရေအတွက်၊ bandwidth အလွန်များလာလျှင် normalized per-recipe tables/delta API သို့ ရွှေ့နိုင်သည်။

## ဖုန်း Update စနစ်

1. Build တစ်ခါစီတွင် unique version ရရှိသည်။ assets တွင် content-hashed filenames ပါသည်။
2. HTML / SW / version.json တွင် cache revalidation headers ရှိသည်။ navigation သည် network-first၊ offline မှသာ saved shell ကို သုံးသည်။
3. App စဖွင့်ချိန်၊ foreground ပြန်ရောက်ချိန်၊ internet ပြန်ရချိန်၊ မြင်နေရင်း 60 seconds တစ်ခါ SW ကို စစ်သည်။ Browser/OS နောက်ခံကန့်သတ်ချက်များကြောင့် background တွင် ချက်ချင်း update မအာမခံနိုင်။
4. SW အသစ် install ပြီး waiting ဖြစ်လျှင် မြန်မာစာ Update notification ပြသည်။ ခလုတ်နှိပ်ပြီး activation / reload လုပ်သည်။ Admin မသိမ်းရသေးသော ပြင်ဆင်မှုများအတွက် confirmation ပါသည်။ Favorites နှင့် recipe IndexedDB မဖျက်ပါ။
5. Recipe publish သည် code deployment မလို။ DB revision metadata ကို စစ်ပြီး အသစ်ရှိမှ catalog snapshot ကို download လုပ်သည်။ ဖွင့်ထားသော online app အတွက် 60 seconds poll ရှိသည်။
6. IndexedDB read/write transaction ထဲတွင် revision နှိုင်း၍ သိမ်းသည်။ tab အဟောင်းနှင့် bundled R0 က newer published data ကို မဖုံးနိုင်။ Restore သည် revision အဟောင်းသို့ မဆင်းဘဲ release အသစ်တစ်ခု ထုတ်သည်။
7. Offline တွင် နောက်ဆုံးအောင်မြင်စွာ download လုပ်ထားသော မီနူးများကို ပြသည်။ ပုံများသည် ကြည့်ဖူး၍ cache ရှိမှ offline ရနိုင်သည်။
8. Offline ဖုန်းများသည် အင်တာနက်ပြန်ချိတ်ပြီး app ကို ပြန်ဖွင့်/foreground ရောက်မှ update ရနိုင်သည်။ ဖုန်းထဲ reinstall မလိုရန် ရည်ရွယ်တည်ဆောက်ထားသော်လည်း အမှန်တကယ် deployment နှင့် physical devices ဖြင့် QA လိုသေးသည်။
9. OS က site storage ဖျက်ခြင်း သို့မဟုတ် storage မလုံလောက်ခြင်း ဖြစ်နိုင်သည်။ Offline cache ကို အမြဲတမ်း backup အဖြစ် မယူဆပါနှင့်။

## လုံခြုံရေး

Password ကို Supabase Auth က စစ်သည်။ browser UI hidden ဖြစ်ရုံကို security အဖြစ် မယူပါ။ API မှ bearer JWT ကို server ပေါ်တွင် getUser ဖြင့်စစ်ပြီး is_admin ကို ထပ်စစ်သည်။ DB RLS၊ private admin membership နှင့် publish RPC permission ထပ်ပါသည်။ Browser သို့ service-role secret မပေးပါ။

Publish သည် database transaction / advisory lock / expected revision ဖြင့် concurrent update ကို ကာကွယ်သည်။ API Zod + PostgreSQL pg_jsonschema နှစ်နေရာ validate လုပ်သည်။ duplicate ID / menu number / English name၊ category reference၊ unsafe image URL များကို တားသည်။ Draft API နှင့် history ကို admin သာ ကြည့်နိုင်သည်။ Public သည် နောက်ဆုံးထုတ်ပြန်ထားသော snapshot တစ်ခုသာ ကြည့်နိုင်သည်။

Image API သည် Admin စစ်ပြီး JPEG/PNG/WebP ဖိုင် 4 MB အောက်ကိုသာ လက်ခံသည်။ Sharp က decode လုပ်ကာ pixel limit၊ resize၊ metadata strip၊ WebP re-encode ပြုလုပ်သည်။ Storage bucket သည် WebP သာ လက်ခံပြီး upload ကို admin သာ ခွင့်ပြုသည်။ ပုံတစ်ပုံချင်းစီ filename အသစ်အသုံးပြု၍ cache အဟောင်းကြောင့် ပုံမပြောင်းခြင်းကို ရှောင်သည်။ Direct bucket client upload ကို admin အတွက် RLS က ခွင့်ပြုသဖြင့် server re-encode အာမခံသည်မှာ app upload လမ်းကြောင်းပေါ်တွင်သာ ဖြစ်သည်။ Public ပုံ bucket တွင် sensitive files မတင်ရ။

API အလုပ်လုပ်မှု၊ SQL migration / RLS စမ်းသပ်မှုများကို Supabase/Vercel project အသစ်အပေါ် ထပ်စမ်းပြီးမှ production အဆင့်အဖြစ် သတ်မှတ်ရမည်။

## Account၊ စရိတ်နှင့် deployment

ဤလုပ်ဆောင်မှုတွင် paid service မဖွင့်ထားပါ။ Vercel/Supabase account ချိတ်ဆက်မှု မပြီးသေးပါ။ အသုံးပြုမည့် plan၊ commercial-use terms၊ storage/egress/function limits နှင့် အမှန်တကယ် စရိတ်ကို activation မတိုင်မီ official plan အရ ပြန်စစ်ရမည်။ စရိတ်သက်သာရေးအတွက် image resize၊ metadata-only poll၊ offline cache ပါသည်။ Free plan ကို commercial deployment အတွက် အလိုအလျောက် သင့်တော်သည်ဟု မယူဆရ။

မူရင်း source များ: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)၊ [JSON schema](https://supabase.com/docs/guides/database/extensions/pg_jsonschema)၊ [Vercel previews](https://vercel.com/docs/deployments/overview)။

## Database မချိတ်ဆက်ထားသော မိတ္တူ၏ Update

Bundled seed dataset တွင် seedVersion ပါဝင်သည်။ Published revision မရှိသေးသော R0 မိတ္တူများအကြား seedVersion အသစ်ကိုသာ ရွေးသိမ်းသည်။ Database မှ ထုတ်ပြန်ထားသော R1 နှင့်အထက်ကို seedVersion မည်မျှကြီးစေကာမူ R0 ဖိုင်က မဖုံးနိုင်ပါ။ V8 seed=1၊ V9 seed=2 ဖြစ်ပြီး နောင် bundled seed ပြင်တိုင်း နံပါတ်ကို တိုးရမည်။
