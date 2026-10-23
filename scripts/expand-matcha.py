"""Append new, explicitly untested Matcha style recipes; never edit existing records."""
import copy
import hashlib
import json
from pathlib import Path

path = Path('public/recipes.json')
catalog = json.loads(path.read_text())
fixture = Path('tests/fixtures/before-matcha-272-sha256.json')
def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, ensure_ascii=False, separators=(',', ':')).encode()).hexdigest()
if not fixture.exists():
    if len(catalog['recipes']) != 272:
        raise ValueError('Expected the existing 272-recipe catalog before Matcha expansion')
    fixture.write_text(json.dumps({r['id']: digest(r) for r in catalog['recipes']}, indent=2) + '\n')
before = json.loads(fixture.read_text())
for recipe in catalog['recipes']:
    if recipe['id'] in before and digest(recipe) != before[recipe['id']]:
        raise ValueError('Existing recipe changed: ' + recipe['id'])
category = {'id': 'matcha-styles', 'name': 'Matcha — နိုင်ငံတကာ အထူးစတိုင်များ'}
if not any(c['id'] == category['id'] for c in catalog['categories']):
    catalog['categories'].append(category)

common_notes = [
    'V2 အတွက် အသစ်ရေးဆွဲထားသော စမ်းသပ်ဖျော်နည်းဖြစ်သည်။ ပိုင်ရှင် လက်တွေ့ဖျော်စမ်း၍ အရသာအတည်ပြုပြီးဟု မဆိုလိုပါ။',
    'နိုင်ငံအမည်သည် café style ရည်ညွှန်းချက်သာဖြစ်ပြီး ထိုနိုင်ငံ၏ မူရင်းစံဖျော်နည်း သို့မဟုတ် ဆိုင်တံဆိပ်တစ်ခု၏ လျှို့ဝှက်ဖော်မြူလာဟု မဆိုလိုပါ။',
    'အချိုနှင့် နို့မပါသော pure matcha powder ကိုသာ 2 g ချိန်ပါ။ Matcha premix / green tea mix နှင့် ပမာဏတူ အစားမထိုးပါနှင့်။',
    'အစိုင်အခဲနှင့် ပျစ်ရည်ကို g ဖြင့်၊ နို့နှင့်ရေကို ml ဖြင့် သတ်မှတ်ထားသည်။ မတိုင်းထားသော နို့ / syrup density ကို သုံးပြီး g = ml ဟု မယူဆပါနှင့်။ Powder အတွက် ml အတု မတွက်ထားပါ။',
    'နို့၊ နို့ဆီနှင့် sauce ကို သန့်ရှင်းသောခွက်ထဲ တိုက်ရိုက်ချိန်ထည့်ပါ။ ပျစ်ရည်ကို ခွက်ကူးလောင်းရာတွင် ကျန်ရစ်နိုင်၍ ချိန်ခွင် tare ဖြင့် စစ်ပါ။',
    'ဤဖျော်ရည်တွင် espresso မပါပါ။ ဆိုင်၏ 16 g → 32 g Espresso baseline ကို မပြောင်းထားပါ။',
    'အအေးထိန်းထားသော နို့ပစ္စည်းနှင့် sauce ကို သုံးပြီး ဖျော်ပြီးချက်ချင်း သုံးဆောင်ပါ။ ကျန်ပြီးသားဖျော်ရည်ကို နောက်ခွက်အတွက် ပြန်မသုံးပါနှင့်။',
]
def add(slug, number, english, burmese, ingredients, finish, milk, sweetness, extra):
    rid = 'matcha-' + slug
    if any(r['id'] == rid for r in catalog['recipes']):
        return
    rows = [{'name': name, 'quantity': quantity} for name, quantity in ingredients]
    steps = [
        '16 oz ခွက်၊ သန့်ရှင်းသောဖျော်ခွက်၊ လက်ဖက်ရည်ဇကာ၊ whisk / handheld frother၊ ချိန်ခွင်နှင့် ml တိုင်းခွက်ကို ပြင်ပါ။ လက်နှင့်အသုံးအဆောင်များကို သန့်ရှင်းထားပါ။',
        'ချိန်ခွင်ပေါ် ဇကာတင်ထားသောဖျော်ခွက်ကို တင်၍ tare / zero နှိပ်ပါ။ Pure matcha 2 g ကို ချိန်ပြီး ဇကာချ၍ အဖုဖယ်ပါ။',
        'ရေသန့်ကို 75–80°C ခန့်သို့ ပြင်ပါ။ ပွက်ပွက်ဆူရေကို တိုက်ရိုက်မသုံးပါနှင့်။ ဖြစ်နိုင်လျှင် thermometer ဖြင့် စစ်ပါ။',
        'ရေနွေး 40 ml ကို တိုင်းပါ။ ပထမ 10 ml ကို matcha ထဲထည့်ပြီး powder ခြောက်မကျန်အောင် ပျစ်ပျစ်လေးမွှေပါ။ ကျန် 30 ml ထည့်ပါ။',
        'ဝါး whisk ဖြင့် W ပုံစံ အမြန်ခတ်ပါ၊ သို့မဟုတ် frother ခေါင်းကို အရည်အောက်မြှုပ်၍ ခွက်ဘေးမထိဘဲ 15–20 စက္ကန့်ခန့် မွှေပါ။ အဖုမရှိသော matcha ရည်ဖြစ်ရမည်။',
    ] + finish + [
        'သုံးဆောင်သူအား မသောက်ခင် အလွှာများကို အောက်ခြေအထိ ဖြည်းဖြည်းရောမွှေရန် ပြောပါ။ အရသာအတည်ပြုရန် သန့်ရှင်းသောဇွန်းဖြင့် သီးသန့် sample ယူပါ။',
        'ဖျော်ပြီးချက်ချင်း ပေးပါ။ ဖျော်ခွက်နှင့် frother ကို ဆေးကြောပြီး နို့နှင့် sauce များကို အအေးထိန်းရာသို့ ပြန်ထားပါ။ ဆိုင်သုံးမီ စမ်းသပ်ရလဒ်ကို မှတ်တမ်းတင်ပါ။',
    ]
    catalog['recipes'].append({
        'id': rid, 'menuNumber': number, 'sourceTitle': 'V2 newly authored Matcha trial — not owner-tested',
        'englishName': english, 'burmeseName': burmese, 'categoryId': category['id'], 'line': 'cold', 'image': None,
        'cupSizes': [16], 'ingredients': rows, 'sourceIngredients': copy.deepcopy(rows), 'steps': steps,
        'notes': common_notes + extra, 'espressoDose': None, 'espressoYield': None,
        'iceQuantity': '180 g', 'milkQuantity': milk, 'waterQuantity': '40 ml',
        'sweetnessLevel': sweetness, 'version': 1, 'updatedAt': '2026-10-22T00:00:00.000Z', 'verification': 'source-unverified',
    })

add('thai-milk', 'MAT-01', 'Thai-Style Matcha Milk', 'ထိုင်းစတိုင် နို့ဆီ Matcha', [
    ('Pure matcha powder', '2 g'), ('ရေနွေး 75–80°C', '40 ml'), ('နို့ဆီအချို', '20 g'),
    ('နို့စိမ်း evaporated milk', '30 ml'), ('အအေးထိန်းထားသော နို့လတ်', '100 ml'), ('ရေခဲ', '180 g'),
], [
    'Matcha ရည်ပူနွေးနေစဉ် နို့ဆီ 20 g ကို တိုက်ရိုက်ချိန်ထည့်၍ အောက်ခြေတွင် နို့ဆီမကျန်အောင် မွှေပါ။ သကြားရည် ထပ်မထည့်သေးပါနှင့်။',
    'နို့စိမ်း 30 ml နှင့် နို့လတ် 100 ml ကို သီးခြားတိုင်းပြီး ရောပါ။ နို့စိမ်းသည် အချိုနို့ဆီနှင့် မတူသော evaporated milk ဖြစ်ရမည်။',
    'ပေးမည့် 16 oz ခွက်ထဲ ရေခဲ 180 g ချိန်ထည့်ပါ။ ရေခဲထည့်ပြီး ခွက် tare ပြန်နှိပ်၍ နို့ရည်ရောထားသည်ကို လောင်းပါ။',
    'နို့ဆီပါ Matcha ရည်ကို အပေါ်မှ ဖြည်းဖြည်းလောင်းပါ။ စမ်းသပ်စဉ် အပို syrup မထည့်ဘဲ ဤပမာဏအတိုင်း တစ်ခွက်ပြီးအောင် အရင်လုပ်ပါ။',
], 'နို့လတ် 100 ml + နို့စိမ်း 30 ml + နို့ဆီ 20 g', 'နို့ဆီ 20 g', [])

add('korean-strawberry', 'MAT-02', 'Korean-Style Strawberry Matcha Latte', 'ကိုရီးယားစတိုင် စတော်ဘယ်ရီ Matcha နို့', [
    ('Pure matcha powder', '2 g'), ('ရေနွေး 75–80°C', '40 ml'), ('အအေးခံထားသော Strawberry Dessert Sauce Base (SAU-03)', '35 g'),
    ('အအေးထိန်းထားသော နို့လတ်', '130 ml'), ('ရေခဲ', '180 g'),
], [
    'ပူနေသော strawberry sauce ကို မသုံးပါနှင့်။ အအေးထိန်းထားသော SAU-03 sauce 35 g ကို ပေးမည့်ခွက်အောက်ခြေတွင် တိုက်ရိုက်ချိန်ထည့်ပါ။',
    'ခွက်ဘေးအတွင်းကို sauce အနည်းငယ် ဖြည်းဖြည်းလှည့်ကပ်ပြီး ရေခဲ 180 g ကို တိုက်ရိုက်ချိန်ထည့်ပါ။',
    'နို့လတ် 130 ml ကို တိုင်း၍ ရေခဲပေါ် ဖြည်းဖြည်းလောင်းပါ။ အစပိုင်းတွင် အောက်ခြေ sauce နှင့် အကုန်ရောမမွှေသေးဘဲ အလွှာကို ထားပါ။',
    'ဖျော်ထားသော Matcha ရည် 40 ml ကို ဇွန်းကျောပေါ်မှ အပေါ်ဆုံးသို့ ဖြည်းဖြည်းလောင်းပါ။ အချို syrup ထပ်မထည့်ဘဲ sauce 35 g ဖြင့် စမ်းပါ။',
], '130 ml', 'SAU-03 sauce 35 g', ['သံပရာရည် / lemon juice ကို ဤနို့ဖျော်ရည်ထဲ ထပ်မထည့်ပါနှင့်။ Strawberry sauce သည် ချဉ်သဖြင့် အလွှာခွဲနိုင်ပြီး ဖျော်ပြီးကြာကြာမထားပါနှင့်။'])

add('vietnamese-coconut', 'MAT-03', 'Vietnamese-Style Coconut Matcha', 'ဗီယက်နမ်စတိုင် အုန်းနို့ Matcha', [
    ('Pure matcha powder', '2 g'), ('ရေနွေး 75–80°C', '40 ml'), ('အချိုမပါ coconut milk', '60 ml'),
    ('အအေးထိန်းထားသော နို့လတ်', '80 ml'), ('Simple Syrup 1:1 by weight (SYR-01)', '15 g'), ('ရေခဲ', '180 g'),
], [
    'Coconut milk ကို ဘူးအတွင်း အဆီနှင့်ရေ ပြန်ညီအောင် လှုပ် / မွှေပြီးမှ 60 ml တိုင်းပါ။ Coconut cream အပျစ်နှင့် coconut water ဖြင့် ပမာဏတူ အစားမထိုးပါနှင့်။',
    'ဖျော်ခွက်တစ်လုံးထဲ SYR-01 syrup 15 g တိုက်ရိုက်ချိန်ထည့်ပါ။ နို့လတ် 80 ml နှင့် coconut milk 60 ml ထည့်၍ ရောမွှေပါ။',
    'ပေးမည့်ခွက်ထဲ ရေခဲ 180 g ချိန်ထည့်ပြီး အုန်းနို့နှင့်နို့ ရောထားသည့်အရည်ကို လောင်းပါ။',
    'Matcha ရည်ကို အပေါ်မှ ဖြည်းဖြည်းလောင်းပါ။ Blender မသုံးသည့် iced version ဖြစ်၍ smoothie ပျစ်နှုန်း မမျှော်မှန်းပါနှင့်။',
], 'နို့လတ် 80 ml + coconut milk 60 ml', 'SYR-01 15 g', ['အုန်းနို့ကို ဘူးဖွင့်ပြီးနောက် အညွှန်းပါ အအေးထိန်းနည်းအတိုင်း ထားပါ။ နို့လတ်ပါသဖြင့် dairy-free ဟု မဖော်ပြပါနှင့်။'])

add('american-vanilla', 'MAT-04', 'American-Style Vanilla Matcha Latte', 'အမေရိကန်ကဖေးစတိုင် ဗနီလာ Matcha နို့', [
    ('Pure matcha powder', '2 g'), ('ရေနွေး 75–80°C', '40 ml'), ('အအေးထိန်းထားသော နို့လတ်', '140 ml'),
    ('Vanilla Bean Syrup Base (SYR-03)', '15 g'), ('ရေခဲ', '180 g'),
], [
    'SYR-03 vanilla syrup 15 g ကို ပေးမည့်ခွက်ထဲ တိုက်ရိုက်ချိန်ထည့်ပါ။ Vanilla extract သို့မဟုတ် vanilla essence ကို syrup ပမာဏတူ အစားမထိုးပါနှင့်။',
    'နို့လတ် 140 ml ကို တိုင်းထည့်ပြီး syrup နှင့် အောက်ခြေထိ ရောမွှေပါ။ ချိုပြီးသား premix နို့ကို ဤအချိုးတွင် မသုံးပါနှင့်။',
    'ခွက်ကို ချိန်ခွင်ပေါ် ပြန်တင်၍ tare နှိပ်ပြီး ရေခဲ 180 g ချိန်ထည့်ပါ။',
    'Whisk ဖြင့် ဖျော်ထားသော Matcha ရည်ကို နို့နှင့်ရေခဲအပေါ် ဖြည်းဖြည်းလောင်းပါ။ အထပ်လိုက်အလှဆင်ထားသော်လည်း သောက်မီ ရောမွှေရပါမည်။',
], '140 ml', 'SYR-03 15 g', [])

add('taiwanese-brown-sugar', 'MAT-05', 'Taiwanese-Style Brown Sugar Matcha Latte', 'ထိုင်ဝမ်စတိုင် ဘရောင်းရှူးဂါး Matcha နို့', [
    ('Pure matcha powder', '2 g'), ('ရေနွေး 75–80°C', '40 ml'), ('Brown Sugar Syrup Base (SYR-02)', '20 g'),
    ('အအေးထိန်းထားသော နို့လတ်', '140 ml'), ('ရေခဲ', '180 g'),
], [
    'အအေးခံထားသော SYR-02 brown sugar syrup 20 g ကို ပေးမည့်ခွက်ထဲ တိုက်ရိုက်ချိန်ထည့်ပါ။ အပူရှိ syrup ကို နို့နှင့်ရေခဲပေါ် မလောင်းပါနှင့်။',
    'ခွက်ကို အနည်းငယ်စောင်းပြီး syrup အချို့ကို ခွက်ဘေးအတွင်း ကပ်စေပါ။ မီးဖြင့်လောင်ကျွမ်းအောင် torch မလုပ်ရပါ။',
    'ရေခဲ 180 g ချိန်ထည့်ပြီး နို့လတ် 140 ml ကို တိုင်း၍ ခွက်ဘေးမှ ဖြည်းဖြည်းလောင်းပါ။',
    'Matcha ရည်ကို အပေါ်မှ ဖြည်းဖြည်းလောင်းပါ။ ဤ version တွင် boba / tapioca pearls မပါပါ။ Pearls ကို ပမာဏမသတ်မှတ်ဘဲ ထပ်မထည့်ပါနှင့်။',
], '140 ml', 'SYR-02 20 g', ['Brown sugar milk tea café style ကို ရည်ညွှန်းခြင်းသာဖြစ်ပြီး သီးခြားဆိုင်တံဆိပ်၏ recipe မဟုတ်ပါ။'])

catalog['seedVersion'] = max(catalog.get('seedVersion', 1), 4)
path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + '\n')
print('Matcha recipes:', sum('matcha' in r['englishName'].lower() for r in catalog['recipes']))
print('Total recipes:', len(catalog['recipes']))
