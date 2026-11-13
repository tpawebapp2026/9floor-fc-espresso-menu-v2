"""Compile explicit, auditable vessel/ingredient allocation plans for the bundled catalog.
The output, rather than name guessing, is used by the reader. Original records remain intact.
"""
import json,re
from pathlib import Path
from collections import Counter
ROOT=Path(__file__).resolve().parents[1]
CATALOG=json.loads((ROOT/'public/recipes.json').read_text())
PLANS={}
class Plan:
 def __init__(self,r):
  self.r=r; self.name=r['englishName']; self.id=r['id']; self.rows=[dict(i) for i in r['ingredients']];self.steps=[];self.buffers={};self.adjust=[];self.warnings=[];self.batch=self.id.startswith('prep-');self.hot=not any(re.search(r'^(Ice|ရေခဲ)$',i['name'],re.I) for i in self.rows) and self.name!='Dirty Coffee'
  self.used=Counter();self.cup=[];self.cup_no=0
  # Resolve alternatives per named recipe, without modifying the archived source rows.
  for i,a in enumerate(self.rows):
   n=a['name'];q=a['quantity']
   if n=='နို့အေး / ရေအေး':
    a['name']='ရေအေး' if any(s in self.name for s in ['Lemon Tea','Peach Tea']) else 'နို့အေး'
   elif n=='နို့ (နို့လက်ဖက်ရည်/Matcha/Cocoa)':a['name']='ရေနွေး' if self.id in ['v8-04-17','v8-04-18'] else 'နို့'
   elif n=='နို့အေး / သောက်ရေသန့်':a['name']='နို့အေး'
   elif n=='Oat milk 90 ml':a['name']='Oat milk'
   elif n=='Blue Syrup / Concentrate':a['name']='အရက်မပါ Blue Syrup'
   elif n=='Lemon/Lime Juice':a['name']='Lemon Juice'
   if re.match(r'^\d+(?:\.\d+)?[–-]\d+(?:\.\d+)?\s*(g|ml)',q):
    m=re.match(r'^(\d+(?:\.\d+)?)[–-](\d+(?:\.\d+)?)\s*(g|ml|ချပ်|ရွက်|လုံး)(.*)',q)
    chosen=m[2] if n in ['Ice','ရေခဲ'] else m[1]
    a['quantity']=f'{chosen} {m[3]}{m[4]}'
   a['quantity']=re.sub(r'\s*\((?:Menu အလိုက်|လိုအပ်သော Menu များ)\)','',a['quantity'])
   if 'Saffron' in n and q=='3–5 strands':a['quantity']='3 strands'
   if q=='1 scoop (60–80 g)':a['quantity']='1 scoop (60 g)'
   if q=='အနည်းငယ်' and re.search(r'ဖာလာ|သစ်ကြံပိုး',n):a['quantity']='0.2 g'
   if a!=r['ingredients'][i]:self.adjust.append(f'{n} {q} → ဤအစဉ်တွင် {a["name"]} {a["quantity"]} ကို သုံးမည်။')
  if self.id=='v8-14-03':self.warnings.append('မူရင်း Doppio Ristretto စာရင်းတွင် dose 16 g နှင့် 2 × 20–24 g output ဟု ဖော်ပြထားသည်။ နှစ်ကြိမ်ထုတ်ရန် dose ခွဲပုံ မရှင်းသေးသဖြင့် ဤမီနူးကို စံဖော်မြူလာအဖြစ် မအတည်ပြုပါနှင့်။')
  self.add('prepare','ခွက်နှင့်ကိရိယာ','ပစ္စည်းများကို အောက်ပါပမာဏအတိုင်း ကြိုချိန်ထားပါ။ “ကြိုဖျော်ခွက်” နှင့် “သောက်ခွက်” ကို သီးခြားထားပါ။ အဆင့်တစ်ခုတွင် ထည့်ပြီးသောပစ္စည်းကို နောက်တစ်ခါ မထပ်ထည့်ပါနှင့်။' if not self.batch else 'ဤမီနူးသည် အခြေခံရည်တစ် batch ဖြစ်သည်။ သောက်ခွက်ထဲ တိုက်ရိုက်ဖျော်ခြင်းမဟုတ်ပါ။ အိုး၊ ချိန်ခွင်နှင့် သန့်ရှင်းသောဘူးကို ပြင်ပါ။')
 def find(self,pat):return [i for i,a in enumerate(self.rows) if re.search(pat,a['name'],re.I)]
 def free(self):return [i for i in range(len(self.rows)) if self.used[i]<1-1e-8]
 def fmt(self,i,part=1):
  a=self.rows[i];q=a['quantity'] or 'ပမာဏ မသတ်မှတ်ရသေး'
  if part!=1:
   m=re.match(r'^(\d+(?:\.\d+)?)\s*(g|ml|ချပ်|ရွက်|လုံး)(.*)',q)
   q=f'{float(m[1])*part:g} {m[2]}'+m[3] if m else f'စာရင်းပါ စုစုပေါင်း၏ {part:g} ပိုင်း'
  return f'{a["name"]} {q}'
 def add(self,phase,vessel,text,uses=(),take=(),produce=None,label=None,into=None,enrich=False):
  uses=[{'index':u if isinstance(u,int) else u[0],'part':1 if isinstance(u,int) else u[1]} for u in uses]
  for u in uses:self.used[u['index']]+=u['part']
  if produce:self.buffers[produce]=label or produce
  if len(uses)==1 and self.rows[uses[0]['index']]['quantity'].startswith('0 '):text=self.fmt(uses[0]['index'])+' — ဤစတင်အချိုးတွင် မထည့်ပါ။'
  step={'phase':phase,'vessel':vessel,'text':text,'uses':uses,'take':list(take)}
  if produce:step.update(produce=produce,label=label or produce)
  if into:
   step['into']=into
   if enrich:self.buffers[into]=self.buffers[into].removesuffix(' အရောအားလုံး')+' + '+' + '.join(self.fmt(u['index'],u['part']) for u in uses)+' အရောအားလုံး'
  if phase in ['cup','finish']:
   self.cup_no+=1;step['cupNumber']=self.cup_no
   self.cup.append(' + '.join([self.fmt(u['index'],u['part']) for u in uses]+[self.buffers[k] for k in take]) or text)
  self.steps.append(step)
 def prep(self,ids,key,label,action,vessel='ကြိုဖျော်ခွက် A'):
  for j,i in enumerate(ids):
   if j==0:self.add('prepare',vessel,self.fmt(i)+' ကို '+vessel+' ထဲ ပထမထည့်ပါ။'+(' '+action if len(ids)==1 else ''),[i],produce=key,label=label)
   else:self.add('prepare',vessel,self.fmt(i)+' ကို နောက်ထည့်ပါ။'+(' '+action if j==len(ids)-1 else ''),[i],into=key)
 def put(self,i,action='ထည့်ပါ။',part=1,phase='cup'):
  action=action.removeprefix('ကို ')
  self.add(phase,'သောက်ခွက်',self.fmt(i,part)+(' — ဤစတင်အချိုးတွင် မထည့်ပါ။' if self.rows[i]['quantity'].startswith('0 ') else ' ကို '+action),[(i,part)])
 def pour(self,key,action='အားလုံးကို ဖြည်းဖြည်းလောင်းပါ။',phase='cup'):
  if self.buffers[key].endswith('အားလုံး') and action.startswith('အားလုံး'):action=action.removeprefix('အားလုံး')
  self.add(phase,'သောက်ခွက်',self.buffers[key]+' '+action,take=[key])
 def note(self,text,vessel='သောက်ခွက်',phase='finish'):
  # Finishing instructions are numbered in the procedure, but not falsely listed as another addition.
  self.add(phase if phase!='finish' else 'serve',vessel,text)
 def coffee(self):
  dose=self.find(r'Espresso အတွက် ကော်ဖီမှုန့်|Espresso ကော်ဖီစေ့')
  out=self.find(r'^Espresso(?:\b|$)|ထုတ်ယူမည့် Espresso|ထုတ်ယူရမည့် ကော်ဖီရည်')
  out=[i for i in out if i not in dose]
  if not out:return None
  ids=dose+out
  self.add('prepare','Espresso shot ခွက်',(self.fmt(dose[0])+' ကို Basket ထဲထည့်၊ ညီအောင်ဖြန့်ပြီး Tamp လုပ်ပါ။ ' if dose else '')+self.fmt(out[0])+' ကို shot ခွက်သီးသန့်ထဲ ထုတ်ပြီး ချန်ထားပါ။ ကော်ဖီမှုန့်ကို သောက်ခွက်ထဲ မထည့်ရ။',ids,produce='espresso',label='ကြိုထုတ်ထားသော '+self.fmt(out[0]))
  return 'espresso'
 def finish(self):
  if self.batch:return
  self.note('ဖော်ပြထားသော ပမာဏအားလုံး ထည့်ပြီးပါပြီ။ ရေခဲ၊ နို့၊ ရေ သို့မဟုတ် Syrup ကို ခွက်ပြည့်ရန် ထပ်မဖြည့်ပါနှင့်။ ချက်ချင်းတည်ခင်းပါ။')
 def output(self):
  assert all(abs(self.used[i]-1)<1e-8 for i in range(len(self.rows))),(self.id,dict(self.used),self.rows)
  produced=set();taken=set()
  for s in self.steps:
   for b in s['take']:
    assert b in produced and b not in taken,(self.id,b)
    taken.add(b)
   if 'into' in s:assert s['into'] in produced and s['into'] not in taken,(self.id,s)
   if 'produce' in s:assert s['produce'] not in produced;produced.add(s['produce'])
  assert produced==taken,(self.id,produced-taken)
  return {'name':self.name,'sourceIngredients':self.r['ingredients'],'ingredients':self.rows,'kind':'batch' if self.batch else 'drink','adjustments':self.adjust,'warnings':self.warnings,'steps':self.steps,'cupOrder':self.cup}

def prep_batch(p):
 id=p.id
 if id in ['prep-simple-syrup','prep-brown-sugar-syrup','prep-vanilla-bean-syrup']:
  p.add('batch','အိုး',p.fmt(1)+' ကို အိုးထဲ ပထမထည့်ပါ။',[1]);p.add('batch','အိုး',p.fmt(0)+' ကို နောက်ထည့်ပြီး မီးအနိမ့်ဖြင့် သကြားစေ့မကျန်အောင် မွှေပါ။',[0])
  if len(p.rows)>2:p.add('batch','အိုး',p.fmt(2)+' ကို အလျားခွဲ၍ အစေ့နှင့်အတောင့်ကို ထည့်ပါ။ မီးပိတ်၍ အနံ့စိမ့်ပြီးမှ အတောင့်ကို စစ်ဖယ်ပါ။',[2])
 elif id=='prep-cocoa-sauce':
  p.add('batch','အိုး',p.fmt(0)+' ကို ပထမထည့်ပါ။',[0]);p.add('batch','အိုး',p.fmt(1)+' ကို ထည့်၍ အခြောက်အတိုင်း ရောပါ။',[1]);p.add('batch','အိုး',p.fmt(2)+' ကို ဖြည်းဖြည်းလောင်း၍ အဖုမကျန်အောင် မွှေပြီး မီးအနိမ့်ဖြင့် ချက်ပါ။',[2])
 elif id=='prep-caramel-water-sauce':
  for i in [0,1]:p.add('batch','အိုး',p.fmt(i)+' ကို အိုးထဲ '+('ပထမထည့်ပါ။' if i==0 else 'နောက်ထည့်၍ သကြားအားလုံး စိုစေပါ။'),[i])
  p.add('batch','အိုး','မီးအလယ်အလတ်ဖြင့် ပယင်းရောင်ရအောင် ချက်ပါ။ မီးပိတ်ပြီး ပူလောင်သော Caramel နှင့်ဝေးဝေးနေပါ။')
  p.add('batch','အိုး',p.fmt(2)+' ကို အနည်းငယ်စီ သတိထားထည့်ပါ။ အငွေ့နှင့် ပူရည်ပက်နိုင်သည်။ လက်နှင့်မျက်နှာကို အိုးအပေါ် မထားရ။',[2])
 elif id=='prep-strawberry-sauce':
  for i in [0,1,2]:p.add('batch','အိုး',p.fmt(i)+' ကို အိုးထဲ '+('ပထမထည့်ပါ။' if i==0 else 'နောက်ထည့်ပါ။'),[i])
  p.add('batch','အိုး','မီးအနိမ့်ဖြင့် အသီးပျော့ပြီး သကြားပျော်သည်အထိ မွှေချက်ပါ။ ပူသောအနှစ်ကို အဖုံးပိတ် Blender ထဲ မကြိတ်ရ။')
 elif p.r['categoryId']=='prep-concentrate':
  p.add('batch','အိုး',p.fmt(2)+' ကို ပထမထည့်ပါ။',[2]);p.add('batch','အိုး',p.fmt(1)+' ကို နောက်ထည့်၍ မီးအနိမ့်ဖြင့် ပျော်အောင်မွှေပါ။ မီးပိတ်ပြီး အအေးခံပါ။',[1]);p.add('batch','အိုး',p.fmt(0)+' ကို အအေးခံပြီးသော သကြားရည်ထဲ နောက်ဆုံးထည့်၍ ရောပါ။',[0])
 else:
  p.add('batch','Blender',p.fmt(1)+' ကို Blender ထဲ ပထမထည့်ပါ။',[1]);p.add('batch','Blender',p.fmt(0)+' ကို နောက်ထည့်၊ အဖုံးပိတ်၍ အနှစ်ညီအောင် ကြိတ်ပါ။ စက်ရပ်မှ အဖုံးဖွင့်ပါ။',[0])
 p.add('batch','သိမ်းမည့်ဘူး','အရည်အေးသွားမှ ညီအောင်မွှေ၊ အသားတင်အလေးချိန်ကို မှတ်ပြီး သန့်ရှင်းသောဘူးထဲ ကူးထည့်ပါ။ ပူနေစဉ် အလုံပိတ်ဖန်ဘူးထဲ မလောင်းရ။')
 p.add('batch','သိမ်းမည့်ဘူး','အမည်၊ ပြုလုပ်ချိန်နှင့် batch အလေးချိန်ကို ရေးပြီး အအေးထိန်းထားပါ။ သောက်မီနူးတွင် သတ်မှတ်ထားသော ပမာဏကိုသာ ယူသုံးပါ။')

def manual(p):
 id=p.id
 if id=='v8-23-05':
  p.warnings.append('မူရင်းတွင် Moka pot အရွယ်နှင့် ကော်ဖီ/ရေ ပမာဏ မပါပါ။ မိမိစက် capacity ကို မသိဘဲ g/ml မခန့်မှန်းပါနှင့်။')
  p.add('prepare','Moka pot အောက်အိုး','စက်ထုတ်လုပ်သူသတ်မှတ် ရေပမာဏကို အောက်အိုးထဲ အရင်ထည့်ပါ။ Safety valve ကို ရေမမြှုပ်ရ။',[0])
  p.add('prepare','Moka pot Basket','Basket ကို ကော်ဖီဖြည့်၍ မဖိတင်းဘဲ တပ်ပါ။ အပေါ်အိုးကို လုံအောင်တပ်ပြီး မီးပေါ်တင်ပါ။')
  p.add('prepare','Moka pot','ကော်ဖီစတက်လာလျှင် မီးလျှော့၊ အားပြင်းသော ပွက်သံမတက်မီ မီးပိတ်ပါ။ ပူနေသောစက်ကို မဖွင့်ရ။',produce='brew',label='Moka pot မှ ထွက်လာသော ကော်ဖီရည်')
 elif id=='v8-25-03':
  for i in [1,0,2]:p.add('prepare','Cezve',p.fmt(i)+' ကို Cezve ထဲ '+('ပထမထည့်ပါ။' if i==1 else 'နောက်ထည့်ပါ။'),[i])
  p.add('prepare','Cezve','တစ်ကြိမ်မွှေပြီး မီးအနိမ့်ဖြင့် အမြှုပ်တက်လာသည်အထိ အပူပေးပါ။ လျှံပွက်မလာမီ မီးမှဖယ်ပါ။',produce='brew',label='Cezve ထဲက ကော်ဖီရည်နှင့်အမြှုပ်')
 elif id=='v8-25-02':
  for i in [1,2,3]:p.add('prepare','အိုး',p.fmt(i)+' ကို အိုးထဲ '+('ပထမထည့်ပါ။' if i==1 else 'နောက်ထည့်ပါ။'),[i])
  p.add('prepare','အိုး','သကြားပျော်ပြီး ရေပူလာလျှင် '+p.fmt(0)+' ကို ထည့်၊ မီးပိတ်ပြီး 4 မိနစ် နှပ်ပါ။ အဖတ်ကို ဇကာစစ်ဖယ်ပါ။',[0],produce='brew',label='စစ်ပြီးသော Café de Olla ရည်')
 elif id in ['v8-23-01','v8-23-02','v8-23-08']:
  iced=id=='v8-23-02'
  if iced:p.add('prepare','V60 ခံယူ Server',p.fmt(2)+' ကို Server ထဲ ပထမထည့်ပါ။ ဤရေခဲအားလုံးသည် ပြုတ်ကျလာသောကော်ဖီကို အအေးခံရန်ဖြစ်သည်။',[2])
  p.add('prepare','V60 filter','Filter ကို သီးခြားဆေးပြီး ဆေးရေစွန့်ပါ။ '+p.fmt(0)+' ကို Filter ထဲထည့်ပြီး ညီအောင်ဖြန့်ပါ။',[0])
  total=150 if iced else 240;first=35 if iced else 30
  p.add('prepare','V60 filter',f'စာရင်းပါ ရေပူစုစုပေါင်း {total} g ထဲမှ {first} g ကို အရင်လောင်းပြီး 30 စက္ကန့် စိုစွတ်အောင်စောင့်ပါ။',[(1,first/total)])
  p.add('prepare','V60 filter',f'ကျန်ရေပူ {total-first} g ကို ဖြည်းဖြည်းဝိုင်းလောင်းပါ။ ချိန်ခွင်ပေါ် ရေပူစုစုပေါင်း {total} g ပြည့်လျှင် ရပ်ပါ။'+(' အောက် Server ထဲ ရေခဲနှင့်အတူ ညင်သာစွာလှည့်ပါ။' if iced else ''),[(1,(total-first)/total)],produce='brew',label='Server ထဲက '+('ကော်ဖီရည်နှင့် ကျန်ရေခဲအားလုံး' if iced else 'စစ်ပြီးသော V60 ကော်ဖီရည်'))
 elif id=='v8-23-04':
  p.add('prepare','AeroPress','Filter ကို သီးခြားဆေး၍ ဆေးရေစွန့်ပါ။ ပုံမှန်မတ်တပ်ရပ်နည်းဖြင့် တည်ငြိမ်သောအပူခံခွက်ပေါ် တပ်ပါ။ '+p.fmt(0)+' ကို အရင်ထည့်ပါ။',[0])
  p.add('prepare','AeroPress',p.fmt(1)+' ကို ထည့်၍ မွှေပြီး 1:30–2:00 မိနစ်နှပ်ပါ။',[1])
  p.add('cup','သောက်ခွက်','AeroPress ကို တဖြည်းဖြည်းဖိ၍ အောက်ရှိ သောက်ခွက်ထဲ ရည်အားလုံး စစ်ချပါ။ သောက်ခွက်ထဲ ရေထပ်မဖြည့်ပါနှင့်။');return
 else:
  p.add('prepare','French press' if id!='v8-21-06' else 'ဖျော်ခွက်',p.fmt(0)+' ကို အရင်ထည့်ပါ။',[0])
  if id=='v8-23-09':p.add('prepare','French press',p.fmt(2)+' ကို နောက်ထည့်ပါ။',[2])
  p.add('prepare','ဖျော်ခွက်',p.fmt(1)+' ကို လောင်း၍ တစ်ကြိမ်မွှေပြီး 4 မိနစ် နှပ်ပါ။',[1])
  p.add('prepare','ဖျော်ခွက်','Plunger ကို ဖြည်းဖြည်းနှိပ်၍ အဖတ်နှင့် ရည်ကို ခွဲပါ။' if id!='v8-21-06' else 'အဖတ်အောက်ကျရန် စောင့်ပါ။ အဖတ်ကို မမွှေဘဲ အပေါ်ကြည်ရည်ကိုသာ ယူပါ။',produce='brew',label='အဖတ်ခွဲပြီးသော ကော်ဖီရည်')
 if id=='v8-23-08':p.put(2,'သောက်ခွက်အောက်ခြေထဲ ပထမထည့်ပါ။')
 p.pour('brew')
 if id=='v8-25-03':p.note('အဖတ်အောက်ကျရန် ခဏစောင့်ပြီး အပေါ်ရည်ကို သောက်ပါ။ အောက်ခြေအဖတ်ကို မရောသောက်ပါနှင့်။')
 elif id=='v8-23-08':p.note('သောက်ခွက်ထဲရှိ ပျားရည်နှင့် ကော်ဖီကို ပျားရည်ပျော်သည်အထိ မွှေပါ။')

def simple_special(p):
 id=p.id
 if id in ['v8-21-07','v8-28-08','9f-poster-016','v8-25-04']:
  if id=='9f-poster-016':
   p.prep([0,1],'dalgona','Instant Coffee 8 g နှင့် 1:1 Sugar Syrup 32 g မှ ခတ်ထားသော Dalgona အမြှုပ်','Frother ဖြင့် ပျစ်ပြီး အမြှုပ်တက်အောင် ခတ်ပါ။ နို့ကို ဤခွက်ထဲ မထည့်ရ။')
   p.prep([2,3],'honey','Honey 15 g နှင့် ရေနွေးနွေး 15 g မှ ဖျော်ထားသော ပျားရည်အခြေခံ','ပျားရည်ပျော်အောင် မွှေပါ။','ကြိုဖျော်ခွက် B')
   p.pour('honey');p.put(4);p.note('ပျားရည်အခြေခံနှင့် နို့ကို ဇွန်းဖြင့် ရောပါ။');p.put(5);p.pour('dalgona','ကို ဇွန်းဖြင့် အပေါ်ဆုံးတင်ပါ။',phase='finish')
  elif id=='v8-25-04':
   p.prep([0,2,1],'dalgona','ကြိုဖျော်ထားသော Greek Frappé အမြှုပ်','Frother ဖြင့် အမြှုပ်တက်အောင် ခတ်ပါ။');p.put(4);p.put(3);p.pour('dalgona')
  elif id=='v8-28-08':
   p.prep([0,1,2],'dalgona','Instant coffee 4 g၊ သကြား 12 g နှင့် ရေနွေး 12 ml မှ ခတ်ထားသောအမြှုပ်','Whisk ဖြင့် ပျစ်ဖျော့ပြီး အမြှုပ်တည်သည်အထိ ခတ်ပါ။')
   p.prep([4,5],'matcha','Matcha powder 3 g နှင့် ရေ 30 ml မှ ဖျော်ထားသော Matcha ရည်','Whisk ဖြင့် အဖုမကျန်အောင် ဖျော်ပါ။','ကြိုဖျော်ခွက် B')
   p.put(3);p.put(6);p.pour('matcha');p.pour('dalgona','ကို ဇွန်းဖြင့် အပေါ်ဆုံးတင်ပါ။',phase='finish')
  else:
   p.prep([0,1,2],'dalgona','Instant coffee 10 g၊ သကြား 10 g နှင့် ရေပူ 10 ml မှ ခတ်ထားသော Dalgona အမြှုပ်','Whisk ဖြင့် ပျစ်ဖျော့ပြီး အမြှုပ်တည်သည်အထိ ခတ်ပါ။');p.put(4);p.put(3);p.pour('dalgona','ကို ဇွန်းဖြင့် အပေါ်ဆုံးတင်ပါ။',phase='finish')
  return True
 if id in ['matcha-korean-strawberry','9f-poster-023','9f-poster-024']:
  p.prep([0,1],'matcha',p.fmt(0)+' နှင့် '+p.fmt(1)+' မှ ကြိုဖျော်ထားသော Matcha ရည်','ရေနွေးကို 70–80°C တွင်ထား၍ Whisk ဖြင့် အဖုမကျန်အောင် ဖျော်ပါ။')
  fruit,milk,ice=(2,3,4) if id=='matcha-korean-strawberry' else (4,2,3)
  p.put(fruit,'ကို သောက်ခွက်အောက်ခြေထဲ ပထမထည့်ပါ။');p.put(ice);p.put(milk,'ကို ရေခဲပေါ်မှ ဖြည်းဖြည်းလောင်းပါ။ အောက်ခြေအသီးနှင့် မရောမွှေသေးပါနှင့်။');p.pour('matcha','ကို နို့ပေါ်မှ နောက်ဆုံး ဖြည်းဖြည်းလောင်းပါ။');p.note('ဤသည် အလွှာလိုက်တည်ခင်းနည်းဖြစ်သည်။ သောက်ခါနီးတွင် အောက်ခြေအထိ ဖြည်းဖြည်းရောမွှေပါ။');return True
 if id in ['v8-24-05','v8-24-06','v8-24-07']:
  p.coffee()
  if id=='v8-24-05':p.put(1,'ကို သောက်ခွက်အောက်ခြေထဲ ပထမထည့်ပါ။');p.pour('espresso','ကို နို့ဆီပေါ်မှ ဖြည်းဖြည်းလောင်းပါ။ အလွှာထားရန် မမွှေပါနှင့်။')
  elif id=='v8-24-06':
   p.prep([2,1],'chocolate','နို့အပူ 90 ml နှင့် Chocolate sauce 25 ml မှ ကြိုဖျော်ထားသော ချောကလက်နို့အရော','ချောကလက်ပျော်အောင် မွှေပြီး ပူနွေးအောင်ထားပါ။','နို့ Jug')
   p.pour('chocolate');p.pour('espresso','ကို ချောကလက်နို့အပေါ် ဖြည်းဖြည်းလောင်းပါ။');p.put(3,'ကို အပေါ်ဆုံးတင်ပါ။',phase='finish')
  else:p.pour('espresso');p.put(1,'ကို Espresso အပေါ် ပါးပါးဖြူးပါ။');p.put(2,'ကို အပေါ်ဆုံး နောက်ဆုံးတင်ပါ။',phase='finish')
  return True
 if id=='v8-22-10':
  p.prep([0,1],'nitro','Cold brew concentrate 100 ml နှင့် ရေအေး 90 ml မှ အမြှုပ်ခတ်ထားသောကော်ဖီ','အဖွင့်ခွက်ထဲ Frother ဖြင့် အမြှုပ်ခတ်ပါ။ Nitrogen gas ထည့်ထားခြင်းမဟုတ်ပါ။');p.put(2);p.pour('nitro');return True
 if id=='v8-21-02':
  p.coffee();p.rows[1]['name']='Pasteurized ကြက်ဥအနှစ်';p.warnings.append('ပိုးသတ်ထားသော Pasteurized egg yolk ကိုသာ သုံးပါ။ ပူသော Espresso လောင်းရုံဖြင့် အစိမ်းဥ ပိုးသတ်ပြီးဟု မယူဆပါနှင့်။')
  p.prep([1,2],'egg','Pasteurized ကြက်ဥအနှစ်နှင့် နို့ဆီမှ ခတ်ထားသော egg cream','Whisk ဖြင့် ပျစ်ဖျော့အောင် ခတ်ပါ။');p.pour('espresso');p.pour('egg','ကို ဇွန်းဖြင့် ကော်ဖီအပေါ်တင်ပါ။',phase='finish');return True
 if id=='v8-25-06':
  p.coffee();p.add('prepare','ကြိုဖျော်ခွက် B',p.fmt(1)+' ကို ခွက်ထဲ အရင်ထည့်ပါ။',[1]);p.add('prepare','ကြိုဖျော်ခွက် B','ထုတ်ထားသော Espresso 32 g ထဲမှ 5 g ကို သကြားပေါ် အရင်ထည့်ပြီး သကြားအမြှုပ်အနှစ်ဖြစ်အောင် ခတ်ပါ။ ကျန် Espresso 27 g ကို နောက်ထည့်၍ ရောပါ။ ကော်ဖီအသစ် ထပ်ထုတ်ရန်မဟုတ်ပါ။',take=['espresso'],produce='cubano',label='သကြား 10 g နှင့် Espresso စုစုပေါင်း 32 g မှ ပြင်ထားသော Café Cubano');p.pour('cubano');return True
 if id in ['v8-24-01','v8-24-02','v8-24-03','v8-16-10']:
  p.coffee();ice=p.find(r'^(Ice|ရေခဲ)$')[0]
  if id=='v8-24-03':p.prep([1],'milkfoam','နို့အေး 90 ml ကို ခတ်ထားသော Cold Foam','အေးသော jug ထဲတွင် Frother ဖြင့် ပျစ်သောအမြှုပ်ဖြစ်အောင် ခတ်ပါ။')
  p.add('prepare','Shaker','ကြိုထုတ်ထားသော Espresso အားလုံးကို Shaker ထဲ အရင်လောင်းပါ။ အဖွင့်အတိုင်း အပူလျော့အောင်ထားပါ။ ပူနေစဉ် အဖုံးပိတ်မရှိတ်ရ။',take=['espresso'],produce='shaken',label='Shaker ထဲက ကော်ဖီရည်')
  for i in p.free():
   if i!=ice and not (id=='v8-16-10' and i==1):p.add('prepare','Shaker',p.fmt(i)+' ကို Shaker ထဲ နောက်ထည့်၍ ပျော်အောင် မွှေပါ။',[i],into='shaken')
  part=1 if id=='v8-24-01' else (0.25 if id=='v8-24-03' else 1/3)
  p.add('prepare','Shaker',p.fmt(ice,part)+' ကို Shaker ထဲထည့်၊ အဖုံးပိတ်ပြီး 12–15 စက္ကန့် ရှိတ်ပါ။ အောက်ပါရေခဲသည် စာရင်းပါ စုစုပေါင်းထဲမှ ခွဲသုံးခြင်းဖြစ်သည်။',[(ice,part)],into='shaken')
  if part<1:p.put(ice,'ကို သောက်ခွက်ထဲ ပထမထည့်ပါ။',1-part)
  p.pour('shaken','ကို Shaker ရေခဲစစ်တံမှ စစ်လောင်းပါ။ Shaker ထဲရှိ ရေခဲကို ဤခွက်ထဲ ထပ်မထည့်ရ။')
  if id=='v8-16-10':p.put(1,'ကို နောက်ဆုံး ဖြည်းဖြည်းလောင်းပါ။')
  if id=='v8-24-03':p.pour('milkfoam','ကို အပေါ်ဆုံးတင်ပါ။',phase='finish')
  return True
 if id=='v8-21-03':
  # The water is stated in the archived steps, but was absent from its ingredient table.
  p.rows.append({'name':'Oliang စိမ့်ဖျော်ရန် ရေနွေး','quantity':'220 ml'});p.adjust.append('မူရင်းဖျော်နည်းတွင် ရေနွေး 220 ml ခန့် ပါသော်လည်း ပစ္စည်းစာရင်းတွင် လွတ်နေသည်။ ဤအစဉ်တွင် 220 ml ကို ဖော်ပြထားသည်။')
  p.prep([0,3],'brew','Oliang coffee powder 20 g ကို ရေနွေး 220 ml နှင့်စိမ့်ဖျော်ပြီး အဖတ်စစ်ထားသောရည်','Cloth filter ဖြင့် စိမ့်ဖျော်ပြီး အဖတ်စစ်ဖယ်ပါ။');p.add('prepare','ကြိုဖျော်ခွက် A',p.fmt(1)+' ကို စစ်ပြီးပူနွေးသော ကော်ဖီရည်ထဲထည့်၍ ပျော်အောင်မွှေပါ။ အဖွင့်အတိုင်း အအေးခံပါ။',[1],into='brew');p.put(2);p.pour('brew');return True
 return False

ICE=r'^(Ice|ရေခဲ)$'
MILK=r'နို့|milk|half-and-half'
WATER=r'ရေနွေး|ရေပူ|ရေသန့်|သောက်ရေ|ရေအေး|^ရေ$'
LEAF=r'အရွက်|လက်ဖက်ခြောက်|Genmaicha tea|Earl Grey tea|Chamomile tea|Hibiscus အခြောက်|Food-grade cascara'
POWDER=r'powder|မှုန့်|အမှုန့်|Black sesame paste|Ube paste|Biscoff spread|Hazelnut cocoa spread|Pumpkin purée'

def regular(p):
 id=p.id;name=p.name
 coffee=p.coffee()
 ice=p.find(ICE);soda=p.find(r'soda|tonic|sparkling|ginger ale|ginger beer|ဆိုဒါ')
 blended=p.r['categoryId'] in ['category-03','category-05','category-06'] or id in ['v8-11-05','v8-12-01','v8-12-02','v8-12-03','v8-12-04','v8-12-05','style-japanese-hojicha-frappe']
 # Cream / cold foam is prepared separately. Explicit row indices keep base milk out of the foam.
 cream_ids=[]
 cream_specs={
 'v9-iced-cappuccino':[3], 'v8-19-01':[2,3], 'v8-19-02':[2,3],
 'v8-19-03':[2], 'v8-19-04':[3], 'v8-19-08':[3], 'v8-19-09':[3], 'v8-19-10':[2,3],
 'v8-21-08':[2], 'v8-22-09':[2], '9f-poster-015':[5,6,7,8],
 '9f-poster-019':[5,6,7], '9f-poster-022':[5,4,3],
 }
 if id in cream_specs:cream_ids=cream_specs[id]
 else:cream_ids=p.find(r'whipp(?:ed|ing) cream|^Cream$|Salted cream|Vanilla cream|Mascarpone cream|Custard cream')
 cream_ids=[i for i in cream_ids if i in p.free()]
 if cream_ids:
  raw=any(re.search('whipping|^Cream$|Coconut cream',p.rows[i]['name'],re.I) for i in cream_ids)
  p.prep(cream_ids,'cream','ခရင်မ်ခွက်ထဲ ကြိုပြင်ထားသော အပေါ်တင်ခရင်မ်/အမြှုပ်အားလုံး','အေးသောခွက်သီးသန့်ထဲတွင် Frother/Whisk ဖြင့် ပျစ်လာအောင် ခတ်ပြီး အေးအေးချန်ထားပါ။' if raw or id=='v9-iced-cappuccino' else 'အပေါ်တင်ရန် သီးခြားခွက်ထဲ တိုင်းယူချန်ထားပါ။ အသင့်စားနိုင်သော ပြင်ပြီးခရင်မ်ကို သုံးပါ။','ခရင်မ်ခွက်')
 # Tea leaves: original water is a brew input, never another serving-water addition.
 tea=p.find(LEAF);tea=[i for i in tea if i in p.free() and not re.search(r'Mint|ပူဒီနာ|ပင်စိမ်း|Rosemary',p.rows[i]['name'],re.I)]
 warm=[i for i in p.find(r'ရေနွေး|ရေပူ') if i in p.free()]
 if tea:
  assert warm,(id,'missing brew water')
  w=warm.pop(0)
  p.prep([tea[0],w],'tea','ကြိုနှပ်ပြီး အရွက်/ပန်းအဖတ်စစ်ထားသော လက်ဖက်ရည်','အရွက်အထုပ်ပါ နှပ်ချိန်အတိုင်း နှပ်ပြီး ဇကာဖြင့် အဖတ်စစ်ဖယ်ပါ။ အရွက်ကို သောက်ခွက်ထဲ မထည့်ရ။')
  targets={'style-thai-coconut-tea':80,'style-taiwanese-lychee-oolong':140,'style-malaysian-teh-tarik':150}
  if id in targets:p.add('prepare','ကြိုဖျော်ခွက် A',f'စစ်ပြီးသော လက်ဖက်ရည် {targets[id]} ml ကိုသာ တိုင်းယူချန်ထားပါ။ နှပ်ရန်သုံးခဲ့သော ရေအားလုံးကို သောက်ခွက်ထဲ ထပ်မလောင်းပါနှင့်။')
  condensed=[i for i in p.find(r'နို့ဆီ') if i in p.free()]
  for i in condensed:p.add('prepare','ကြိုဖျော်ခွက် A',p.fmt(i)+' ကို ပူနွေးနေသော စစ်ရည်ထဲ ထည့်၍ ပျော်အောင်မွှေပါ။',[i],into='tea',enrich=True)
 # Dedicated saffron infusion.
 if id=='v8-28-01':p.prep([2,3],'saffron','Saffron ကို ရေနွေး 20 ml နှင့် 5 မိနစ်နှပ်ထားသော ရည်အားလုံး','5 မိနစ် နှပ်ထားပါ။','ကြိုဖျော်ခွက် B')
 # Cocoa dust and spices used as finishing garnish must not be dissolved twice.
 dust=[]
 if id in ['v8-19-03','v8-24-07']:dust=p.find(r'cocoa powder')
 if id in ['v8-01-20','v8-17-05']:dust=p.find(r'သစ်ကြံပိုးမှုန့်')
 herbs=[i for i in p.find(r'Mint|Rosemary|ပူဒီနာ|ပင်စိမ်း|အခွံ') if i in p.free() and not re.search('syrup',p.rows[i]['name'],re.I)]
 garnish=[i for i in herbs if re.search('Rosemary|အခွံ',p.rows[i]['name'],re.I)]
 muddle=[i for i in herbs if i not in garnish]
 # Powder + measured brew water, or thick spread + the existing espresso/milk.
 powders=[i for i in p.find(POWDER) if i in p.free() and i not in dust]
 for j,i in enumerate(powders):
  if blended and id!='style-japanese-hojicha-frappe':continue
  warm=[w for w in p.find(r'ရေနွေး|ရေပူ|^ရေ$') if w in p.free()]
  if id=='9f-poster-025' and i==4:w=5
  elif warm:w=warm[0]
  else:w=None
  if w is not None:
   key='matcha' if re.search('matcha',p.rows[i]['name'],re.I) else 'base'+str(i)
   temp=' (Matcha အတွက် ရေကို 70–80°C အထိသာ ပူထားပါ။)' if key=='matcha' else ''
   p.prep([i,w],key,p.fmt(i)+' နှင့် '+p.fmt(w)+' မှ ကြိုဖျော်ထားသောအနှစ်အားလုံး','Whisk ဖြင့် အဖုမကျန်အောင် ဖျော်ပါ။'+temp,'ကြိုဖျော်ခွက် '+('B' if j else 'A'))
  elif coffee:
   p.add('prepare','Espresso shot ခွက်',p.fmt(i)+' ကို ကြိုထုတ်ထားသော Espresso ထဲထည့်၍ အဖုမကျန်အောင် ရောပါ။ အပိုရေ မထည့်ရ။',[i],into=coffee,enrich=True)
  else:
   milk=[k for k in p.find(MILK) if k in p.free()]
   assert milk,(id,'missing solvent',i)
   p.prep([milk[0],i],'base'+str(i),p.fmt(i)+' ကို စာရင်းပါနို့နှင့် ကြိုဖျော်ထားသောအရောအားလုံး','Whisk ဖြင့် အဖုမကျန်အောင် ဖျော်ပါ။')
 # Dissolve dense sweeteners in existing warm liquid, with no invented water.
 if not blended:
  for i in list(p.free()):
   if re.search(r'ပျားရည်|^Honey$|နို့ဆီ|Chocolate.*Sauce|White chocolate sauce',p.rows[i]['name'],re.I):
    base=coffee or ('tea' if 'tea' in p.buffers else 'matcha' if id=='matcha-thai-milk' and 'matcha' in p.buffers else None)
    warm=[w for w in p.find(r'ရေနွေး|ရေပူ') if w in p.free()]
    if base:p.add('prepare','Espresso shot ခွက်' if base==coffee else 'ကြိုဖျော်ခွက် A',p.fmt(i)+' ကို '+p.buffers[base]+' ထဲ ထည့်၍ ပျော်အောင်မွှေပါ။ ယခုဖျော်ထားသော အရောကို နောက်မှ တစ်ကြိမ်သာ လောင်းမည်။',[i],into=base,enrich=True)
    elif warm:p.prep([i,warm[0]],'sweet'+str(i),p.rows[i]['name']+' ကို စာရင်းပါ ရေနွေးနှင့် ကြိုပျော်ထားသောအရောအားလုံး','ပျော်အောင် မွှေပါ။','ကြိုဖျော်ခွက် B')
 # Hot liquid milk is heated in its own jug, not poured cold and steamed in the serving glass.
 if p.hot:
  for i in [k for k in p.find(MILK) if k in p.free() and not re.search(r'နို့ဆီ|powder|နို့အမြှုပ်',p.rows[k]['name'],re.I)]:
   p.prep([i],'milk'+str(i),p.fmt(i)+' ကို ကြိုပူထားသော နို့/နို့အမြှုပ်အားလုံး','Jug သီးသန့်ထဲတွင် 55–65°C အထိ အပူပေးပါ။'+(' Microfoam ဖြစ်အောင် အမြှုပ်ခတ်ပါ။' if any(w in name for w in ['Latte','Cappuccino','Flat White','Macchiato','Cortado','Piccolo','Gibraltar']) else ' နို့ကို မဆူစေရ။'),'နို့ Jug')
 if blended:
  # First liquid, then flavor/fruit/powder, finally all allocated ice.
  for i in [k for k in p.find(MILK+'|'+WATER+r'|ရည်|juice|yogurt|ဒိန်ချဉ်') if k in p.free() and k not in ice and not re.search(r'syrup|သကြားရည်',p.rows[k]['name'],re.I)]:p.add('prepare','Blender',p.fmt(i)+' ကို Blender ထဲ '+('ပထမထည့်ပါ။' if not any(s['vessel']=='Blender' for s in p.steps) else 'နောက်ထည့်ပါ။'),[i])
  for key in list(p.buffers):
   if key=='cream':continue
   p.add('prepare','Blender',p.buffers[key]+' ကို အပူလျော့ပြီးမှ Blender ထဲ ထည့်ပါ။ ပူသောရည်ကို အဖုံးပိတ် Blender ထဲ မထည့်ရ။',take=[key])
  for i in [k for k in p.free() if k not in ice]:p.add('prepare','Blender',p.fmt(i)+' ကို Blender ထဲ နောက်ထည့်ပါ။',[i])
  for i in ice:p.add('prepare','Blender',p.fmt(i)+' ကို Blender ထဲ နောက်ဆုံးထည့်ပါ။ ဤရေခဲသည် စာရင်းပါ စုစုပေါင်းဖြစ်ပြီး သောက်ခွက်ထဲ ထပ်ထည့်ရန် မဟုတ်ပါ။',[i])
  p.add('prepare','Blender','အဖုံးပိတ်၍ ရေခဲတုံးကြီး မကျန်အောင် ကြိတ်ပါ။ စက်လုံးဝရပ်မှ အဖုံးဖွင့်ပါ။',produce='blended',label='Blender ထဲက ဖျော်ပြီးသားအရောအားလုံး')
  p.pour('blended','ကို သောက်ခွက်အလွတ်ထဲ ပထမဆုံး လောင်းပါ။ ရေခဲအသစ် ထပ်မထည့်ရ။')
  if 'cream' in p.buffers:p.pour('cream','ကို အပေါ်တင်ပါ။',phase='finish')
  return
 # List prepared bases; coffee and matcha are intentionally poured after ice in cold layered drinks.
 reserved={'espresso','cream','matcha'}
 bases=[k for k in p.buffers if k not in reserved and not k.startswith('milk')]
 milk_buffers=[k for k in p.buffers if k.startswith('milk')]
 top=p.find(r'Oreo|vanilla ice cream|နို့အမြှုပ်|နို့ပူ microfoam')
 top=[i for i in top if i in p.free() and i not in p.find(r'နို့ပူ microfoam')]
 # Ready hot microfoam is the liquid milk portion in short espresso drinks.
 lategren=p.find('Grenadine') if id in ['v8-11-03','v8-11-07'] else []
 rawcoffee=[i for i in p.find(r'Cold brew concentrate|Cold drip concentrate|Black coffee|Filter coffee|Brewed coffee|Chicory coffee concentrate|Café Cubano') if i in p.free()]
 # Affogato uses ice cream first, then espresso, with no ordinary ice.
 if id=='v8-14-10':
  p.put(1,'ကို အချိုပွဲခွက်ထဲ ပထမထည့်ပါ။');p.pour('espresso','ကို Ice cream ပေါ်မှ နောက်ဆုံး ဖြည်းဖြည်းလောင်းပါ။');return
 # Hot espresso base first; Long Black specifically puts water first.
 if p.hot and coffee and name not in ['Hot Long Black']:
  # Bombón keeps condensed milk under the coffee instead of pre-mixing (handled below override).
  p.pour(coffee)
 # Cup base additions before ice.
 for i in muddle:p.put(i,'ကို သောက်ခွက်အောက်ခြေထဲထည့်၍ ဇွန်းဖြင့် ညင်သာစွာ 2–3 ကြိမ်ဖိပါ။ အမှုန့်မချေပါနှင့်။')
 oreo=[i for i in top if 'Oreo' in p.rows[i]['name']]
 for i in oreo:
  p.add('prepare','အလှဆင်ပန်းကန်',p.fmt(i)+' ကို ချိုးကြေပြီး တစ်ဝက်ကို အောက်ခံ၊ ကျန်တစ်ဝက်ကို အပေါ်ဖြူးရန် ခွဲထားပါ။')
  p.put(i,'ကို သောက်ခွက်အောက်ခြေထဲ ထည့်ပါ။ ကျန်တစ်ဝက်ကို နောက်ဆုံးဖြူးရန် ချန်ထားပါ။',part=0.5)
 before=[i for i in p.free() if i not in ice+soda+dust+garnish+muddle+top+lategren+rawcoffee]
 # Syrup / purée first, then milk or water. The order is explicit even when several liquids are present.
 def rank(i):
  n=p.rows[i]['name'];return 0 if re.search(r'syrup|သကြား|puree|purée|ဆော့စ်|concentrate|အနှစ်|ပျား|Honey|နို့ဆီ',n,re.I) else 2 if re.search(MILK+'|'+WATER,n,re.I) else 1
 before.sort(key=lambda i:(rank(i),i))
 # Non-matcha bases (tea, taro, dissolved cocoa) are placed before milk and ice.
 for key in bases:p.pour(key)
 for i in before:p.put(i)
 for key in milk_buffers:
  if name=='Hot Cappuccino':
   p.add('cup','သောက်ခွက်',p.buffers[key]+' ထဲမှ အမြှုပ်ကို ဇွန်းဖြင့် ကာထားပြီး အရည်နို့ကို Espresso ပေါ် အရင်လောင်းပါ။ အမြှုပ်ကို Jug ထဲ ချန်ထားပါ။',take=[key],produce='reserved-foam',label='နို့ Jug ထဲ ကာထားသော နို့အမြှုပ်အားလုံး')
  else:p.pour(key)
 if 'reserved-foam' in p.buffers:p.pour('reserved-foam','ကို နောက်ဆုံး အပေါ်ဆုံးတင်ပါ။ နို့အသစ် ထပ်မခတ်ရ။',phase='finish')
 if p.hot and coffee and name=='Hot Long Black':p.pour(coffee,'ကို ရေနွေးပေါ်မှ နောက်ဆုံး ဖြည်းဖြည်းလောင်းပါ။')
 if p.hot and 'matcha' in p.buffers:p.pour('matcha')
 if before or bases or milk_buffers:p.note('လက်ရှိသောက်ခွက်ထဲရှိ အောက်ခံအရောကို ဇွန်းဖြင့် ညီအောင် ရောပါ။' if not p.hot else 'သောက်ခွက်ထဲရှိ အရည်ကို ညင်သာစွာ ရောပါ။')
 for i in ice:p.put(i)
 for i in rawcoffee:p.put(i,'ကို ရေခဲပေါ်မှ ဖြည်းဖြည်းလောင်းပါ။')
 for i in soda:p.put(i,'ကို ခွက်ဘေးမှ ဖြည်းဖြည်းလောင်းပါ။ Soda ထည့်ပြီးနောက် Blender/အဖုံးပိတ် Shaker မသုံးရ။')
 if not p.hot and coffee:p.pour(coffee,('ကို အေးစက်နေသော နို့ပေါ်မှ ဖြည်းဖြည်းလောင်းပါ။' if name=='Dirty Coffee' else 'ကို ရေခဲပေါ်မှ ဖြည်းဖြည်းလောင်းပါ။' if ice else 'ကို အောက်ခံရည်ပေါ်မှ ဖြည်းဖြည်းလောင်းပါ။'))
 if not p.hot and 'matcha' in p.buffers:p.pour('matcha','ကို '+('ဆိုဒါရေ' if soda else 'ရေခဲ')+' ပေါ်မှ ဖြည်းဖြည်းလောင်းပါ။')
 for i in lategren:p.put(i,'ကို ခွက်ဘေးမှ ဖြည်းဖြည်းလောင်း၍ အောက်ခြေထိ ကျစေပါ။ အလွှာကျန်ရန် မမွှေပါနှင့်။',phase='finish')
 if 'cream' in p.buffers:p.pour('cream','ကို အပေါ်ဆုံးတွင် ဇွန်းဖြင့် တင်ပါ။',phase='finish')
 for i in top:p.put(i,'ကို '+('သေးသေးချိုးပြီး အပေါ်မှ ဖြူးပါ။' if 'Oreo' in p.rows[i]['name'] else 'အပေါ်ဆုံးတင်ပါ။'),part=1-p.used[i],phase='finish')
 for i in dust:p.put(i,'ကို အပေါ်မှ ပါးပါးဖြူးပါ။',phase='finish')
 for i in garnish:p.put(i,'ကို အလှဆင်အဖြစ် နောက်ဆုံးတင်ပါ။',phase='finish')
 if name=='Dirty Coffee':p.note('အလွှာမပျက်ရန် မမွှေပါနှင့်။ နို့ကို ရေနွေးမပေးပါနှင့်။ ရေခဲလည်း မထည့်ရ။')

# Emit one reviewed plan per current recipe, not a runtime fallback guessing its family.
for r in CATALOG['recipes']:
 p=Plan(r)
 if p.batch:prep_batch(p)
 elif r['id'] in ['v8-23-01','v8-23-02','v8-23-03','v8-23-04','v8-23-05','v8-23-08','v8-23-09','v8-21-06','v8-25-02','v8-25-03']:manual(p)
 elif not simple_special(p):regular(p)
 p.finish()
 PLANS[r['id']]=p.output()
assert len(PLANS)==324
(ROOT/'src/assemblyCatalog.json').write_text(json.dumps(PLANS,ensure_ascii=False,indent=2)+'\n')
print('Compiled',len(PLANS),'plans;',sum(len(p['steps']) for p in PLANS.values()),'vessel-specific steps')
