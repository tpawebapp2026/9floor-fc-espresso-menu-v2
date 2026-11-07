import type { Recipe } from "./model";
import {
  massAudit,
  qualityFor,
  researchSources,
  microfoamSteps,
} from "./quality";

export default function RecipeQuality({
  recipe: r,
  servings,
}: {
  recipe: Recipe;
  servings: number;
}) {
  const q = qualityFor(r),
    m = massAudit(r);
  return (
    <div className="quality-guide">
      <section className="detail-panel">
        <h2>ဖျော်နည်းအချက်အလက်နှင့် စစ်ဆေးအဆင့်</h2>
        <p>
          {q.status} · {q.mode}
        </p>
        <p>
          {q.difficulty} · {q.time}
        </p>
        <p>{q.origin}</p>
        <p>{q.serving}</p>
        <p>
          ခွက်ဆံ့ ml နှင့် အချောဖျော်ရည် g မတူပါ။ ရေခဲပါသော 16 oz ခွက်သည် အရည်
          473 ml ထည့်ရန် ဆိုလိုခြင်းမဟုတ်ပါ။
        </p>
        {q.coffee && (
          <p>
            Gemilai CRM3605 · 58 mm · စတင်စမ်းသပ်ချက် 16 g → 32 g / pump
            စချိန်မှ 25–30 s။ Bean၊ roast၊ grinder၊ basket capacity/headspace
            အလိုက် dial-in လုပ်ပါ။ မူရင်း dose/yield ကွာပါက အောက်တွင်
            မူရင်းအတိုင်းပြထားပြီး အလိုအလျောက်မပြောင်းပါ။ 18 g မထည့်မီ basket
            ဆံ့ပမာဏစစ်ပါ။ Pressure gauge တစ်ခုတည်းဖြင့် အရသာမဆုံးဖြတ်ပါနှင့်။
          </p>
        )}
        {q.issues.length > 0 && (
          <details>
            <summary>အတည်ပြုရန် ကျန်သည့်အချက် {q.issues.length} ခု</summary>
            <ul>
              {q.issues.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </details>
        )}
      </section>
      <section className="detail-panel">
        <h2>အလေးချိန် စစ်ဆေးချက် — g / ml</h2>
        <p>
          ရေကို 1 g/ml၊ နို့ကို 1.03 g/ml ခန့်ဖြင့် ပြထားသည့် ≈ တန်ဖိုးသည်
          အကြမ်းခန့်မှန်းချက်သာဖြစ်သည်။ မိမိပစ္စည်း 100 ml ကို ခွက် TARE
          လုပ်၍ချိန်ကာ သိပ်သည်းဆတွက်ပါ။ Powder၊ sauce၊ concentrate၊ purée၊ foam
          အတွက် သိပ်သည်းဆမတိုင်းထားလျှင် ml မဖော်ပြပါ။
        </p>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>ပစ္စည်း</th>
                <th>ချိန်ရန်</th>
                <th>ml / မှတ်ချက်</th>
              </tr>
            </thead>
            <tbody>
              {m.rows.map((x, i) => (
                <tr key={i}>
                  <td>{x.name}</td>
                  <td>
                    {x.g !== null
                      ? `${Math.round(x.g * servings * 100) / 100} g`
                      : x.approximateG !== null
                        ? `≈ ${Math.round(x.approximateG * servings * 100) / 100} g (ခန့်မှန်း)`
                        : "g ချိန်တိုင်းရန်"}
                  </td>
                  <td>
                    {x.ml !== null
                      ? `${x.ml * servings} ml မူရင်း`
                      : x.approximateMl !== null
                        ? `≈ ${Math.round(x.approximateMl * servings * 100) / 100} ml (ခန့်မှန်း)`
                        : "ml မတိုင်းထား"}
                    <small>{x.reason}</small>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p data-testid="ingredient-total">
          {m.exactInputG !== null
            ? `Ingredient Total: ${Math.round(m.exactInputG * servings * 100) / 100} g (input mass)`
            : `စုစုပေါင်း g မအတည်ပြုနိုင်သေး — g အတိအကျပါ ပစ္စည်းများသာပေါင်းလျှင် ${Math.round(m.knownG * servings * 100) / 100} g ဖြစ်သည်။ အပြည့်အစုံ total မဟုတ်ပါ။`}
        </p>
        <p>
          {m.yieldWarning} Coffee dry dose ကို espresso yield နှင့်
          ထပ်မပေါင်းပါ။ ရေခဲသည် total ထဲ ပါဝင်သည်။
        </p>
      </section>
      <section className="detail-panel" id="recipe-flavor">
        <h2>Flavor Profile — အရသာညွှန်းကိန်း</h2>
        <p className="notice">
          ပါဝင်ပစ္စည်းပေါ်အခြေခံသော ခန့်မှန်းအရသာညွှန်းကိန်း 1–5 ဖြစ်သည်။
          Sensory test၊ တိုင်းတာချက်၊ အရသာအာမခံချက် မဟုတ်ပါ။ ကော်ဖီမပါလျှင်
          ကော်ဖီပြင်းအားကို 0 ဟုပြထားသည်။
        </p>
        <div className="flavor-grid">
          {q.flavor.map(([name, value]) => (
            <div key={name}>
              <span>{name}</span>
              <b>{name === "ကော်ဖီပြင်းအား" && !q.coffee ? "0" : value} / 5</b>
            </div>
          ))}
        </div>
        <p>
          <b>Aroma — </b>
          {q.aroma}
        </p>
        <p>
          <b>Aftertaste — </b>
          {q.aftertaste}
        </p>
        <p>
          <b>Expected Taste / Flavor Balance — </b>
          {q.expected}။ လက်တွေ့ brand နှင့် dilution အလိုက် စမ်းသပ်ရန်လိုသည်။
        </p>
      </section>
      <section className="detail-panel" id="recipe-adjustments">
        <h2>Taste Adjustment — အရသာပြန်ညှိရန်</h2>
        <ol>
          {q.adjustments.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ol>
        <p>
          ပြောင်းလဲသည့် g၊ test cup၊ အချိန်နှင့် ရလဒ်ကို မှတ်တမ်းရေးပါ။ မူရင်း
          recipe ပေါ် အလိုအလျောက်မသိမ်းပါ။
        </p>
      </section>
      <section className="detail-panel" id="recipe-qc">
        <h2>Quality Control — ဆိုင်မရောင်းမီ စစ်ရန်</h2>
        <p>
          <b>Serving temperature — </b>
          {q.temperature}
        </p>
        <p>
          <b>Texture / foam — </b>
          {q.texture}
        </p>
        <p>
          <b>Appearance / layers — </b>
          {q.soda
            ? "အောက်ခြေ concentrate ညီအောင်ပျော်ပြီး gas ကျန်ရှိရန်။ Shaker ပိတ်မလှုပ်ပါနှင့်။"
            : "အဖုအခဲ/အဆီသီးခြားမထွက်ရန်။ Layering ပါလျှင် နို့/ရေခဲပြီးမှ coffee/matcha ကို ဇွန်းနောက်မှလောင်းပါ။ Foam ပါလျှင် နောက်ဆုံးတင်ပြီး သောက်မီမွှေပါ။"}{" "}
          ပုံရှိပါက reference ပုံနှင့် သောက်ခွက်အချောကို တူမည်ဟု မယူဆပါနှင့်။
        </p>
        <p>
          <b>Common mistakes / troubleshooting — </b>TARE မလုပ်ခြင်း၊ ml=g
          ဟုထင်ခြင်း၊ pump ခန့်မှန်းခြင်း၊ နို့ပူကိုရေခဲပေါ်လောင်းခြင်း၊ powder
          အဖုကျန်ခြင်းတို့ကို စစ်ပါ။ နို့ပါအသီးအဖတ်ဖြစ်လျှင်
          ရေခဲဖြင့်မဖုံးကွယ်ဘဲ brand/acidity လိုက်ဖက်မှုကို ပြန်စမ်းပါ။
        </p>
        <p>
          <b>Substitutions — </b>Brand ပြောင်းလျှင် sweetener၊ °Brix/pH
          (တိုင်းနိုင်လျှင်)၊ dairy/plant milk နှင့် texture ပြောင်းနိုင်သည်။
          အတူတူ g ဖြင့် အရသာတူမည်ဟု မယူဆပါနှင့်။ Premix taro ကို raw taro flour
          ဖြင့် မအစားထိုးပါနှင့်။
        </p>
        <p>
          <b>Allergens — </b>
          {q.allergens.join("၊ ") ||
            "အမည်မှ သိသာသော allergen မတွေ့သော်လည်း label ကိုစစ်ရန်"}
          ။ Sauce/powder/ပစ္စည်းအားလုံး၏ package ကိုစစ်ပြီး အခွံမာသီး၊ soy၊
          gluten၊ milk cross-contact ကို သီးခြားကိရိယာဖြင့်ထိန်းပါ။
        </p>
        <p>
          <b>Food safety / storage — </b>Pasteurized dairy သာသုံး၍ ≤4°C
          အအေးထိန်းပါ။ ရေခဲကို scoop သုံးပါ။ ဖျော်ပြီးချက်ချင်းတည်ခင်းပါ။
          ပျက်လွယ်ပစ္စည်းအပြင်ထားချိန် စုစုပေါင်း 2 h ကျော် (ပတ်ဝန်းကျင် 32°C
          ထက်မြင့်လျှင် 1 h) လျှင် စွန့်ပစ်ပါ။ Batch shelf life ကို
          မတိုင်းထားပါ။ Label နှင့် ဒေသဆိုင်ရာလိုအပ်ချက်အတိုင်း
          ပိုတိုသောကန့်သတ်ချက်သုံးပါ။ ကြက်ဥပါလျှင် pasteurized သာသုံးပါ။
        </p>
        <details>
          <summary>Testing Notes — တကယ်ဖျော်စမ်းရန်</summary>
          <p>
            စမ်းသပ်သူ၊ ရက်စွဲ၊ brand/lot၊ bean/roast၊ grind setting၊
            dose/yield/time၊ actual g/finished yield၊ cup fit၊ 0/5/10 min
            အချို/အချဉ်/အခါး၊ foam/appearance၊ နှစ်ခွက်ဆက်တိုက် consistency
            ကိုမှတ်ပါ။ ဤ software audit သည် taste test အစားမထိုးပါ။
            ဆိုင်ရောင်းမီ ပိုင်ရှင်အတည်ပြုချက်လိုသည်။
          </p>
        </details>
      </section>
      {q.milk &&
        !/Iced|Cold|Frappe|Smoothie/i.test(r.englishName) &&
        !q.prep && (
          <section className="detail-panel">
            <h2>Hot milk — Microfoam လေ့ကျင့်ရန်</h2>
            <ol>
              {microfoamSteps.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ol>
          </section>
        )}
      <details className="detail-panel">
        <summary>သုတေသနအရင်းအမြစ်နှင့် စံနှုန်းအကန့်အသတ်</summary>
        <p>
          နည်းစနစ်နှင့် safety သည် အောက်ပါရင်းမြစ်များကို ကိုးကားထားသည်။ Recipe
          formula၊ serving အဆိုပြုချက်နှင့် flavor rating များကို SCA
          အသိအမှတ်ပြု standard ဟု မသတ်မှတ်ပါ။ Research-based guidance
          ထည့်ထားခြင်းသည် recipe ကို လက်တွေ့အတည်ပြုပြီးဟု မဆိုလိုပါ။
        </p>
        <ul>
          {researchSources.map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noreferrer">
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
