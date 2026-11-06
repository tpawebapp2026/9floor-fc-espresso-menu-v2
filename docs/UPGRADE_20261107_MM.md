# 9 FLOOR COFFEE — Menu / Search / Quality Update

မူလ source commit: `560c1b8fbfa20bc5c2c4290d962e9d3663bd17a1`။ မူလ 283 records နှင့် categories အားလုံးကို `tests/fixtures/before-upgrade-283.json` တွင် backup သိမ်းပြီး equality test ဖြင့် မပြောင်းကြောင်း စစ်သည်။ Git bundle backup ကို local `backups/` တွင် ထပ်သိမ်းထားသည်။ GitHub repository နှင့် Netlify မူလ app ကိုသာ သုံးသည်။

## အသစ်ပါဝင်မှု

- အသစ် 24: NEW-01 … NEW-22၊ CF-01 / CF-02။ မူလ 283 + 24 = 307၊ Category 39။ စာလုံး/space normalize ပြီး အမည်တိုက်စစ်ထားသည်။ Similar recipe တူညီခြင်းကို brand/pမာဏနှင့် taste test ဖြင့် ဆက်စစ်ရန်လိုသည်။
- Search အပေါ်ဆုံး။ အမည်၊ နံပါတ်၊ ingredient၊ category၊ flavor နှင့် country/style discovery text ရှာနိုင်သည်။ Query ရှိချိန်တွင် Favorites၊ department၊ country/category filter ကို ကျော်၍ 307 recipe အားလုံးကို ရှာသည်။ Clear လုပ်လျှင် ရွေးထားသော filter ပြန်ပေါ်သည်။
- Burmese/English alias၊ Unicode normalize၊ မြန်မာဂဏန်း၊ space၊ case နှင့် English typo တစ်လုံးအထိ (5 letters အထက်) support ပါသည်။ စာလုံးပေါင်းအားလုံးကို အာမမခံပါ။
- Formula အရသာအဆင့်များသည် provisional ခန့်မှန်းချက်။ Original / owner-tested / trial ကို ခွဲပြထားပြီး research-based **guidance** ထည့်ထားသည်။ SCA standard formula ဟု မသတ်မှတ်ပါ။
- Ingredient total တွင် dry coffee dose နှင့် espresso yield ထပ်မပေါင်း။ ml-only၊ ranges၊ alternatives၊ piece-count နှင့် unknown density ကို exact total ဟု မပြပါ။ နို့ 1.03 g/ml ခန့်၊ ရေ 1 g/ml ခန့်သည် estimated display သာဖြစ်သည်။ brand sample ကို ချိန်တိုင်းရန်လိုသည်။
- Hot latte / cappuccino / espresso serving ကို အဆိုပြုချက်အဖြစ် သီးခြားပြသည်။ မူရင်း 12 oz နှင့် ingredients ကို မပြောင်းထားပါ။ US 8 oz ≈237 ml ဖြစ်၍ 240–260 ml shop cup သည် အနီးစပ်ဆုံးဆိုင်ရွေးချယ်မှုသာဖြစ်သည်။
- CRM3605 58 mm: 16 g →32 g /25–30 s သည် ပိုင်ရှင်သုံး dial-in အစပြုချက်။ universal SCA prescription မဟုတ်။ 18 g မတိုးမီ basket capacity စစ်ရန်၊ milk microfoam လေ့ကျင့်နည်း ပါသည်။

## မပြီးသေးသည့် လက်တွေ့အတည်ပြုချက်

အသစ် 24 ခုသည် Professional Trial ဖြစ်သည်။ Taro ကို sweet premix ဟု ယူဆထား၍ raw taro flour အစားမသုံးရန်၊ Matcha ကို unsweetened ဟု သတ်မှတ်၍ brand ကိုစစ်ရန်၊ Blue concentrate ၏ fruit/flavor ကို label မရမချင်း မခန့်မှန်းရန်။ Syrup/sauce/concentrate/purée/foam ၏ ml ကို သိပ်သည်းဆမသိသေးသဖြင့် မဖန်တီးထားပါ။

**အသစ် 24 ခု၏ exact drink photograph မရရှိသေး**။ ပုံအတု/အခြားdrink photo မတပ်ဘဲ ပုံထည့်ရန်ကျန်ဟု ပြသည်။ မူလ 62 reference photographs နှင့် mapping 283 ကို ထိန်းသိမ်းထားသည်။ ဓာတ်ပုံအမည်နှင့် license တည်ရှိနေသည်။

မူရင်း data အချို့တွင် မြန်မာအမည်၊ menu number၊ ပမာဏ g သို့မဟုတ် ပြတ်သားသော ingredient ရွေးချယ်မှု မပါရှိသေး။ Software review က brand density၊ actual yield၊ အချောဖျော်ရည် volume၊ foam stability၊ အရသာကို မတိုင်းနိုင်ပါ။ အသေးစိတ် `quality-audit-20261107.json` နှင့် `UNTESTED_RECIPES_MM.md` ကိုကြည့်ပါ။

## ဖုန်း Update နှင့် owner data

Favorites keys၊ recent၊ IndexedDB identity၊ service-worker update flow နှင့် recipe IDs အဟောင်းကို မပြောင်းထားပါ။ bundled seedVersion 6 က seedVersion 5 ကို အစားထိုးစေပြီး published revision ရှိပြီးသားကို ပြန်မဖုံးစေပါ။ Offline ဖုန်းသည် online ပြန်ရမှ version အသစ်ရမည်။ Update notification သည် app အတွင်း banner ဖြစ်ပြီး OS push notification မဟုတ်ပါ။ Netlify origin အတွင်း update လုပ်ခြင်းက favorites ကိုသိမ်းထားမည်၊ GitHub Pages origin မှ favorites သည် browser origin တူညီမှုမရှိ၍ အလိုအလျောက်မကူးပါ။

## ပြင်ဆင်မှတ်တမ်း

မူလ recipe 283 ၏ ingredients/steps/menu numbers/images/categories ကို ပြင်ဆင်ထားခြင်းမရှိ။ ဤ update မှ quality module က source data ကိုဖတ်၍ guidance နှင့် unresolved audit findings ကို သီးခြားပြခြင်းဖြစ်သည်။ မူရင်း tested formula ကို ပြောင်းလိုလျှင် actual trial record / owner approval ပြုလုပ်ပြီး recipe version တိုးရန်။

Production branch `backend-preview-setup` နှင့် `main` ကို ယခုအဆင့်တွင် မပြောင်းပါ။ `menu-quality-upgrade-20261107` development branch တွင်သာ ပြင်ဆင်၍ PR/preview စမ်းသပ်ပြီးမှ သီးခြား Production အတည်ပြုချက်တောင်းရန်။ Supabase Admin/database ချိတ်ဆက်မှု ယခင်ကျန်ရှိသောအပိုင်းသည် ဤ menu upgrade ဖြင့် အလိုအလျောက် မပြီးစီးပါ။
