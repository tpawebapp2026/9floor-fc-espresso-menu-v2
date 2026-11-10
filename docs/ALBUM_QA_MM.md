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

- `npm test`: 8 test files, 35 tests အောင်မြင်။ မူရင်း 283 recipe records နှင့် JPEG 87 ပုံ၏ checksum စစ်ထားသည်။
- `npm run build:pages`: TypeScript နှင့် Vite build အောင်မြင်။
- Browser checks ကို GitHub Actions တွင် ပြေးသည်။ Album ပုံများ၊ Cream & Milk 5 မျိုး၊ Favorites၊ Offline reload နှင့် ဖုန်း/Tablet/desktop အကျယ်များကို စစ်ဆေးသည်။
- ပထမ browser စမ်းသပ်မှုမှ တွေ့ရှိသော အချက်များကို ပြင်ထားသည်။ အထူးသဖြင့် bundled catalog ၏ revision ကို 0၊ seedVersion ကို 6 ပြန်သတ်မှတ်ထား၍ နောင် seed update များ ဝင်နိုင်စေသည်။ Published backend revision ကို overwrite မလုပ်သော စည်းမျဉ်းကို ဆက်ထိန်းထားသည်။
- နောက်ဆုံး CI အောင်မြင်မှုနှင့် Deployment အခြေအနေကို Pull Request #5 နှင့် Actions တွင် ကြည့်နိုင်သည်။

## အသုံးပြုပုံ

1. တူညီသော App လင့်ခ်ကို အင်တာနက်ချိတ်ပြီး ဖွင့်ပါ။
2. Update ခလုတ်ပေါ်လျှင် နှိပ်ပါ။
3. 9 FLOOR Album ကို ရွေးပြီး Signature Coffee သို့မဟုတ် Cream & Milk အုပ်စုကို ရွေးပါ။
4. အအေးပုံကို နှိပ်လျှင် ပါဝင်ပစ္စည်းနှင့် အဆင့်လိုက် ဖျော်နည်းကို ဖွင့်သည်။

လက်တွေ့ဖုန်းများတွင် Safari/Chrome နှင့် Add to Home Screen အသုံးပြုမှု၊ ဖျော်ရည်အရသာ၊ ကုန်ကျစရိတ်နှင့် ရောင်းဈေးတို့ကို ဆိုင်တွင် စမ်းသပ်အတည်ပြုရန် ကျန်သည်။ Browser စမ်းသပ်မှုများသည် physical-device သို့မဟုတ် အရသာအတည်ပြုမှု မဟုတ်ပါ။
