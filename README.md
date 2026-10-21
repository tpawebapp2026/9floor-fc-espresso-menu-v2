# 9Floor Fc Espresso Menu V2

မြန်မာဘာသာ Coffee Recipe PWA — သီးခြား project အသစ်။

**လက်ရှိအခြေအနေ — Recipe Reader Preview တင်ပြီးပါပြီ။**

https://tpawebapp2026.github.io/9floor-fc-espresso-menu-v2/

ယခု Pages မိတ္တူတွင် မီနူးကြည့်ခြင်း၊ ရှာခြင်း၊ Favorites နှင့် offline ဖတ်ခြင်းကို အသုံးပြုနိုင်သည်။ Full Admin / Supabase database ကို live မချိတ်ဆက်ရသေးပါ။ Production-ready အဖြစ် မသတ်မှတ်ရသေးပါ။ မူရင်း app၊ အခြား repositories နှင့် Cloudflare project များကို မပြောင်းထားပါ။

## မီနူးများ

[အသစ်ထည့်သော Syrup / Sauce / Fruit Concentrate / Fruit Purée လမ်းညွှန်](docs/PREPARATIONS_MM.md)

- စုစုပေါင်း 272 — Barista 161 / အအေးစုံ 99 / Preparation 12 / အမျိုးအစား 32။
- V8 မှ 259 မီနူးကို ထိန်းသိမ်း၍ V9 ဖိုင်မှ Iced Cappuccino တစ်မျိုး ထည့်ထားသည်။ မူရင်းပါ စမ်းသပ်ဖျော်နည်း အဆင့်သတ်မှတ်ချက်ကို ဆက်ပြထားသည်။
- နိုင်ငံတကာစတိုင် 12 နိုင်ငံအလိုက် မီနူးတူများကို ပြန်စုထားသည်။ ထပ်ပွား recipe ID မဖန်တီးထားပါ။
- Search၊ ingredients၊ အဆင့်လိုက်ဖျော်နည်း၊ ခွက်အရေအတွက်၊ Favorites၊ Recently viewed၊ light/dark ပါသည်။
- ဓာတ်ပုံအစစ်များ အတည်ပြုရန် ကျန်သည်။ Illustration များကို ဓာတ်ပုံအစစ်ဟု မဖော်ပြထားပါ။ မသိသောပမာဏနှင့် ခွက်အရွယ် မခန့်မှန်းထားပါ။

## ဖုန်းတွင် အသုံးပြုရန်

Android Chrome တွင် အထက်ပါ link ကိုဖွင့်၍ menu → Add to Home Screen / Install app ကို ရွေးပါ။ iPhone Safari တွင် Share → Add to Home Screen ကို ရွေးပါ။ တူညီသော link ကိုသာ ဆက်သုံးပါ။

Deployment အသစ်ရရှိလျှင် app ဖွင့်ချိန်၊ foreground ပြန်ရောက်ချိန်နှင့် ဖွင့်ထားစဉ် တစ်မိနစ်ခြား စစ်သည်။ မြန်မာစာ Update အသိပေးချက်မှ **ယခု Update လုပ်မည်** ကို နှိပ်ပါ။ ပြန် install မလိုပါ။ Favorites နှင့် နောက်ဆုံး download မီနူးများကို ထိန်းထားသည်။

**ဤသည် app အတွင်း Update အသိပေးချက်ဖြစ်သည်။ App ပိတ်ထားချိန် ဖုန်း notification tray သို့ ပို့သော push notification မပါ။ Offline ဖုန်းသည် အင်တာနက်ပြန်ရမှ update ရနိုင်သည်။**

## Deployment နှင့် ကန့်သတ်ချက်

အသစ်သီးသန့် repo တွင် Pages → GitHub Actions ကို ဖွင့်ထားသည်။ .github/workflows/pages.yml သည် manual Run workflow သို့မဟုတ် main branch push မှ စတင်သည်။ Unit/API tests နှင့် Pages browser tests အောင်မြင်မှ deploy လုပ်သည်။ GitHub Pages environment က ခွင့်ပြုထားသော main branch မှသာ preview ထုတ်သည်။ pages-approved မှ deploy စမ်းသပ်မှုကို environment rule က ပိတ်ခဲ့၍ security rule ကို မလျှော့ဘဲ main ကို သုံးထားသည်။ Branch protection / reviewer approval enforcement ကို remote တွင် မသတ်မှတ်ရသေးပါ။ Production deployment အတွက် ပိုင်ရှင်၏ သီးခြားအတည်ပြုချက် လိုသည်။ Paid service မဖွင့်ထားပါ။

Static Pages တွင် server API မ run နိုင်၍ Admin login / edit / publish / photo upload / backup restore ကို live အသုံးမပြုနိုင်သေးပါ။ မီနူးပြင်ဆင်ချက်များကို source JSON ပြင်ပြီး deploy လုပ်ရသည်။ App အတွင်းမှ Publish လုပ်ရန် NEW Supabase project နှင့် server host ဆက်တင်ရမည်။ Backend source၊ SQL/RLS နှင့် image validation code ကို repo ထဲ ထိန်းသိမ်းထားသည်။

## စမ်းသပ်မှု

Unit/API tests 23 နှင့် မူရင်း recipe 260 ခု၏ field အားလုံးကို ထိန်းသိမ်းထားကြောင်း regression စမ်းသပ်ချက် ပါသည်။ တိုးချဲ့မှု၏ browser / CI test ရလဒ်ကို Actions run မှ စစ်ပါ။ API tests တွင် mock Supabase သုံးသဖြင့် live DB/RLS စစ်ပြီးဟု မဆိုရ။ GitHub Actions မှ Pages builds / tests / deployments အောင်မြင်ပြီး remote A → B တွင် update အသိပေးချက်၊ activation/reload နှင့် Favorites ကျန်ရှိမှုကို စမ်းထားသည်။ အသိပေးချက် ထပ်ပေါ်မှုကို တွေ့ရှိ၍ worker URL ကို build version နှင့် တသမတ်တည်းဖြစ်အောင် ပြင်ထားသည်။ Physical iPhone / Android / Add to Home Screen tests၊ live Admin၊ DB permissions နှင့် production deployment တို့ ကျန်သည်။

## Developer commands

Node 22+ ဖြင့် npm ci၊ npm test၊ npm run build:pages၊ npx playwright install chromium၊ npm run test:pages ကို အသုံးပြုပါ။ Full app အတွက် npm run build နှင့် npm run test:e2e ရှိသည်။ .env.example သာ public ထည့်ထားပြီး secret မထည့်ရ။ Existing app credentials မသုံးရ။

public/recipes.json သည် dataset ဖြစ်သည်။ migration_source/v8.html နှင့် v9.html တို့သည် မူရင်း audit reference များဖြစ်ပြီး execute မလုပ်ပါ။ scripts/migrate.py ပြီး scripts/import-v9.py ဖြင့် dataset ပြန်တည်ဆောက်နိုင်သည်။ source-bundle.zip သည် bootstrap archive အဟောင်းဖြစ်ပြီး package.json ရှိပြီးနောက် workflow က ပြန်မဖြည်တော့ပါ။ လက်ရှိ source ဖိုင်များကိုသာ ပြင်ဆင်ပါ။

## အသေးစိတ်လမ်းညွှန်

- [အသုံးပြုနည်း](docs/USER_GUIDE_MM.md)
- [Pages reader](docs/GITHUB_PAGES_MM.md)
- [တည်ဆောက်ပုံ](docs/ARCHITECTURE_MM.md)
- [Deployment နှင့် maintenance](docs/DEPLOYMENT_MM.md)
- [Checklist / QA](docs/CHECKLIST_QA_MM.md)
- [Migration audit](docs/migration-audit.json)

အစောပိုင်း docs များရှိ deployment မတင်ရသေးဟူသော status စာသားများအတွက် အပေါ်ပါ README ၏ လက်ရှိအခြေအနေကို ဦးစားပေးဖတ်ပါ။ Full backend လမ်းညွှန်များသည် နောက်ထပ် deployment လိုအပ်သောအပိုင်း ဖြစ်သည်။
