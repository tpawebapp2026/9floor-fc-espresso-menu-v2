# 9 FLOOR Menu Album ပြင်ဆင်မှုနှင့် စစ်ဆေးချက်

2026-11-10 — Development အတွက်သာ။ Production မတင်ရသေးပါ။

## ပြင်ဆင်ထားသော အပိုင်းများ

- မီနူးစုစုပေါင်း 324 မျိုး။ မူရင်း 283 မျိုး၏ record များကို SHA-256 ဖြင့် စစ်ပြီး မပြောင်းထားကြောင်း အတည်ပြုထားသည်။
- မူရင်း Album မှ ပုံဖြတ် 87 ပုံ၏ JPEG bytes နှင့် SHA-256 ကို စစ်ပြီး တူညီကြောင်း အတည်ပြုထားသည်။
- Album တွင် Signature Coffee နှင့် Cream & Milk အပါအဝင် အုပ်စုများဖြင့် ရွေးချယ်နိုင်သည်။
- Cream & Milk စာရင်းတွင် Vanilla Oreo Milk, Strawberry Cream Milk, Mixed Berry Cream Milk, Chocolate Oreo Cream, Taro Oreo Milk ငါးမျိုးကို အတူစုထားသည်။
- Chocolate Oreo Cream နှင့် Taro Oreo Milk အတွက် Cream ပါဝင်ပစ္စည်း ထည့်ပြီး ဖျော်နည်းကို ရှင်းလင်းထားသည်။
- အသစ်ထည့်သည့် 41 မျိုး၏ အသေးစိတ်ဖျော်နည်းကို အမှန်တကယ်ပြသစေရန် ပြင်ထားသည်။ အပူမီနူးများ၏ ခွက်အရွယ်စာသားကိုလည်း ပြင်ထားသည်။
- မီနူးအသစ်များသည် လက်တွေ့စမ်းသပ်မထားသေးသော ဖော်မြူလာများဖြစ်သည်။ ဈေးနှုန်းများသည် အတည်ပြုရောင်းဈေးမဟုတ်ပါ။

## စစ်ဆေးမှု

- `npm test`: 8 test files, 35 tests အောင်မြင်။
- `npm run build:pages`: TypeScript နှင့် Vite build အောင်မြင်။
- `git diff --check`: အောင်မြင်။
- Browser E2E 11 ခု: ဤစမ်းသပ်စက်တွင် Chromium ဖွင့်မရပါ။ AF_UNIX socket ကို ပိတ်ထားခြင်းကြောင့် browser စတင်မှုတွင် ပျက်သည်။ App ကို browser ဖြင့် စမ်းပြီး အောင်မြင်ကြောင်း မဆိုနိုင်သေးပါ။
- အခြား headless browser ကို ရယူရန် စမ်းရာတွင် download ဖိုင် မပြည့်စုံသောကြောင့် မအောင်မြင်ပါ။
- Pull Request တွင် စမ်းသပ်နိုင်ရန် deployment မလုပ်သော validation workflow ထည့်ထားသည်။ GitHub သို့ သိမ်းဆည်းရန် ကြိုးစားမှု ပယ်ချခံရသဖြင့် remote တွင် workflow မရှိသေးပါ။

## ကျန်နေသေးသော အလုပ်

1. ဤပြင်ဆင်ချက်ကို `feature/signature-cream-menu-20261109` branch ထဲ သိမ်းရန်။
2. GitHub browser checks ပြေးပြီး အမှားတွေ့ပါက ပြင်ရန်။
3. iPhone Safari နှင့် Android တွင် လက်တွေ့ကြည့်ရန်။
4. Production မတင်မီ ပိုင်ရှင်၏ အတည်ပြုချက်ရယူရန်။

Remote PR #5 ကို ဤလုပ်ဆောင်မှုအတွင်း မပြောင်းနိုင်သေးပါ။ main နှင့် Production မပြောင်းထားပါ။
