import { useState } from "react";
import { convertMetric, densityFromSample } from "./preparations";

export default function DensityConverter() {
  const [sample, setSample] = useState("");
  const [volume, setVolume] = useState("100");
  const [amount, setAmount] = useState("30");
  const [direction, setDirection] = useState<"g-to-ml" | "ml-to-g">("ml-to-g");
  const density = densityFromSample(Number(sample), Number(volume));
  const result = amount.trim()
    ? convertMetric(Number(amount), density, direction)
    : null;
  return (
    <section
      className="detail-panel density-panel"
      aria-labelledby="density-heading"
    >
      <span className="eyebrow">MEASURE YOUR BATCH</span>
      <h2 id="density-heading">g ↔ ml ပမာဏပြောင်းရန်</h2>
      <p>
        အသီးအမျိုးအစား၊ သကြား၊ အပူချိန်နဲ့ အထူအပါးကြောင့် သိပ်သည်းဆ ကွာသည်။ 1 g
        = 1 ml ဟု မယူဆပါနှင့်။
      </p>
      <ol>
        <li>
          သန့်ရှင်းခြောက်သွေ့သော အတိုင်းခွက်ကို ချိန်ခွင်ပေါ်တင်ပြီး Tare / Zero
          နှိပ်ပါ။
        </li>
        <li>
          သုံးမည့်အပူချိန်ရှိ batch ကို ညီအောင်မွှေ၊ အမြှုပ်နည်းသွားမှ 100 ml
          အမှတ်အထိ ဖြည့်ပါ။ ခွက်အလေးချိန် မပါသော g ကို မှတ်ပါ။
        </li>
        <li>
          ပျစ်သော purée တွင် လေပေါက်မကျန်အောင် ဖြည့်ပါ။ ၃ ကြိမ်ခန့်တိုင်းပြီး
          ကိုက်ညီမှုစစ်ပါ။ Sample ml နှင့် အသားတင် g ကို အောက်တွင် ဖြည့်ပါ။
        </li>
      </ol>
      <div className="density-fields">
        <label>
          Sample ပမာဏ (ml)
          <input
            type="number"
            min="0.1"
            step="any"
            inputMode="decimal"
            value={volume}
            onChange={(e) => setVolume(e.target.value)}
          />
        </label>
        <label>
          Sample အသားတင်အလေးချိန် (g)
          <input
            type="number"
            min="0.1"
            step="any"
            inputMode="decimal"
            placeholder="ကိုယ်တိုင်ချိန်ထားသော g"
            value={sample}
            onChange={(e) => setSample(e.target.value)}
          />
        </label>
        <label>
          ပြောင်းမည့်ဦးတည်ချက်
          <select
            aria-label="ပြောင်းမည့်ဦးတည်ချက်"
            value={direction}
            onChange={(e) => setDirection(e.target.value as typeof direction)}
          >
            <option value="ml-to-g">ml → g</option>
            <option value="g-to-ml">g → ml</option>
          </select>
        </label>
        <label>
          ပြောင်းမည့်ပမာဏ
          <input
            type="number"
            min="0"
            step="any"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>
      </div>
      <output aria-live="polite" className="density-result">
        {result === null
          ? "Sample g / ml ကို မှန်ကန်စွာဖြည့်မှ အဖြေရပါမည်။"
          : `${amount} ${direction === "ml-to-g" ? "ml" : "g"} ≈ ${Number(result.toFixed(1))} ${direction === "ml-to-g" ? "g" : "ml"} · ρ = ${density!.toFixed(4)} g/ml`}
      </output>
      <p className="muted">
        g = ml × ρ · ml = g ÷ ρ။ အဖြေသည် သင့်တိုင်းတာမှုအပေါ် မူတည်သော
        အနီးစပ်ဆုံးသာဖြစ်သည်။ Sample data ကို သိမ်းဆည်းမထားပါ။ Batch အသစ်တွင်
        ပြန်တိုင်းပါ။ Powder / သကြားမှုန့်ကို ရည်အတွက် ρ ဖြင့် မပြောင်းပါနှင့်။
      </p>
      <p className="muted">
        ရေသန့် 20°C: ρ ≈ 0.9982 g/ml။ သကြားဖြူ 50% w/w ရည်: ρ ≈ 1.23 g/ml။ ဤ
        reference ကို အသီးအနှစ်၊ brown sugar သို့ sauce တွင် အစားမသုံးရ။
      </p>
      <a
        href="https://wiki.anton-paar.com/us-en/density-and-density-measurement/sucrose-density/"
        target="_blank"
        rel="noreferrer"
      >
        သိပ်သည်းဆ reference ↗
      </a>
    </section>
  );
}
