# GitHub Pages Recipe Reader

ဤမိတ္တူသည် မီနူး 272 မျိုးကို ဖုန်း/ကွန်ပျူတာတွင် ကြည့်ရန် ရည်ရွယ်သော Pages reader ဖြစ်သည်။ GitHub Pages တွင် Node API မ run နိုင်၍ server-backed Admin ကို reader build တွင် မပြထားပါ။ Full Admin/Supabase source ကို ဆက်ထိန်းထားသည်။ Hosting ကို Cloudflare သို့ မပြောင်းထားပါ။

## တည်ဆောက်ပြီးသောအရာများ

- Repo path အောက်မှ JS/CSS၊ icon၊ manifest၊ service worker၊ recipe JSON ကို မှန်ကန်စွာယူသည်။
- Hash-based recipe links သုံးသဖြင့် deep link / reload အတွက် server rewrite မလို။
- PWA start URL နှင့် scope သည် repo path အတွင်းသာ ဖြစ်သည်။ Cache/IndexedDB သည် app path အလိုက် ခွဲထားသည်။
- Pages reader တွင် Admin entry မပါ။ Full Admin ကို အသုံးပြုရန် မူလ backend deployment လိုသည်။
- version.json နှင့် recipe JSON ကို cache-busting query ဖြင့် စစ်သည်။ deployment manifest အသစ်တွေ့လျှင် version ပါသော SW URL ကို register လုပ်သည်။ အသုံးပြုသူ လက်ခံမှ worker အသစ် activate / reload ပြုလုပ်သည်။
- Static build တစ်ခုစီတွင် seedVersion ကို build timestamp ဖြင့် တိုးသတ်မှတ်သည်။ Published database revision အဟောင်းသို့ ပြန်ဆင်းစေခြင်း မရှိ။
- GitHub Pages cache headers ကို Vercel နည်းအတိုင်း configure မလုပ်နိုင်သဖြင့် ဤ client-side version/revalidation နည်းကို သုံးထားသည်။ အမှန်တကယ် remote deployment A → B နှင့် physical devices ကို ထပ်စမ်းရမည်။

## Approved deployment workflow

`.github/workflows/pages.yml` သည် manual Run workflow သို့မဟုတ် `main` branch push မှသာ Pages တင်သည်။ Branch သို့ code တင်ခြင်းကို owner-approved change အဖြစ် ကိုင်တွယ်ရမည်။ Repo protection ကို remote setting မှ configure မပြီးသေးသဖြင့် protection အလိုအလျောက် ရှိပြီးဟု မယူဆရ။

workflow သည် dependency install၊ unit/API tests၊ Pages build နှင့် Pages browser tests ကို run ပြီးမှ upload/deploy လုပ်သည်။ Pages enablement ကို ကြိုးစားဖွင့်ပေးမည်ဖြစ်သော်လည်း token/organization policy က ခွင့်မပြုလျှင် repository Settings → Pages → GitHub Actions ကို အကောင့်ပိုင်ရှင်က configure ပေးရနိုင်သည်။

မူရင်း project/repo များပေါ်တွင် workflow ကို မထည့်ရ။ New V2 repo တွင်သာ အသုံးပြုရမည်။ GitHub sign-in ပြီးစီး၍ tpawebapp2026/9floor-fc-espresso-menu-v2 repo အသစ်ကို ဖန်တီးထားပြီ။ Source upload နှင့် Pages deployment မပြီးသေး၍ live URL မရသေးပါ။

## Local commands

```sh
npm ci
npm run build:pages
npx playwright install chromium
npm run test:pages
```

Repo နာမည်က default `9floor-fc-espresso-menu-v2` နှင့် မတူလျှင် build နှင့် test နှစ်ခုလုံးတွင် `VITE_BASE_PATH=/actual-repo-name/` သတ်မှတ်ပါ။ `VITE_STATIC_READER=true` သည် Pages reader mode ဖြစ်သည်။

## အတည်ပြုထားသော local tests

Root/full-app browser suite 7 ခု၊ Pages-specific browser suite 4 ခုနှင့် unit/API tests 20 ခု အောင်မြင်သည်။ Pages-specific tests တွင် manifest scope၊ 161/99 recipe departments၊ Admin ဖျောက်ထားခြင်း၊ deep-link/offline reload၊ recipe cache invalidation နှင့် actual worker activation / reload / favorites retention စမ်းထားသည်။ Live GitHub deployment test မဟုတ်ပါ။

## မီနူးကို နောက်ပိုင်း update လုပ်ရန်

မီနူးပြင်ဆင်ချက်ကို JSON schema အတိုင်း source repo သို့ သိမ်းပြီး စမ်းသပ်မှုအောင်မြင်မှ approved branch / manual workflow ဖြင့် deploy လုပ်ပါ။ Deployment အောင်မြင်ပြီး တူညီသော Pages URL ကို online ဖုန်းတွင် ပြန်ဖွင့်မှ အသစ်ရယူနိုင်သည်။ Offline ဖုန်းသည် ပြန်ချိတ်မှ ရနိုင်သည်။

ဤနည်းတွင် Owner က app အတွင်းမှ login ဝင်ပြီး recipe Publish လုပ်ခြင်း မပါဝင်ပါ။ အဲဒီအဆင့်အတွက် Full Admin/Supabase deployment ကို သီးခြားဆက်တင်ရန် လိုသည်။


## Preparation expansion

လက်ရှိ repo ကိုပင် ထပ်တိုးထားသည်။ မူရင်း 260 မီနူးကို မပြောင်းဘဲ Syrup / Sauce / Fruit Concentrate / Fruit Purée တစ်ကဏ္ဍ 3 မျိုးစီ ထပ်ထည့်သည်။ [အသုံးပြုနည်း](PREPARATIONS_MM.md) ကို ဖတ်ပါ။ ယခင် status စာသားများထက် root README နှင့် Actions run အမှန်တကယ်ရလဒ်ကို ဦးစားပေးပါ။ GitHub Pages environment က main ကိုသာ ခွင့်ပြု၍ အခြား branch deployment attempt တစ်ခု ပိတ်ခံခဲ့ရသည်။ Security rules ကို မလျှော့ဘဲ ခွင့်ပြုထားသော main မှသာ deploy လုပ်သည်။
