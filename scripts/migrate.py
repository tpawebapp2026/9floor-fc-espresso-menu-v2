"""Lossless extraction from the supplied V8 export. Never modifies the source."""
import re,html,json,hashlib,pathlib,collections
root=pathlib.Path(__file__).resolve().parents[1]
source=root/'migration_source/v8.html'
s=source.read_text()
def text(s): return html.unescape(re.sub(r'<[^>]+>','',s)).strip()
recipes=[]; categories=[]
for gi,sec in enumerate(re.findall(r'<section\b[^>]*>(.*?)</section>',s,re.S)):
 category=text(re.search(r'<h2>(.*?)</h2>',sec,re.S)[1])
 # Coffee departments are explicit; mixed dessert categories use the original recipe name/ingredients.
 cid=f'category-{gi+1:02}'
 categories.append({'id':cid,'name':category})
 for ri,d in enumerate(re.findall(r'<details\b[^>]*>(.*?)</details>',sec,re.S)):
  original=text(re.search(r'<summary[^>]*>(.*?)</summary>',d,re.S)[1])
  m=re.match(r'^(\d{2}-\d{2})\s+(.+)$',original)
  number,name=(m[1],m[2]) if m else (None,original)
  rows=re.findall(r'<tr>\s*<td>(.*?)</td>\s*<td>(.*?)</td>\s*</tr>',d,re.S)
  sourceIngredients=[{'name':text(a),'quantity':text(b)} for a,b in rows]
  ingredients=[]
  for row in sourceIngredients:
   row=dict(row)
   if not row['quantity']:
    metric=re.match(r'^(.*?)\s+(\d+(?:\.\d+)?(?:[–-]\d+(?:\.\d+)?)?\s*(?:g|ml|ရွက်|လုံး|ချောင်း|sprig)(?:\s.*)?)$',row['name'],re.I)
    if metric:row={'name':metric[1],'quantity':metric[2]}
    elif row['name'].endswith(' အနည်းငယ်'):row={'name':row['name'][:-len(' အနည်းငယ်')],'quantity':'အနည်းငယ်'}
   ingredients.append(row)
  steps=[text(x) for x in re.findall(r'<label class="tick">(.*?)</label>',d,re.S)]
  notices=[text(x) for x in re.findall(r'<div class="notice">(.*?)</div>',d,re.S)]
  coffee=gi in [0,1,2,*range(13,25)] or bool(re.search(r'espresso|coffee|latte|mocha',name,re.I)) and gi==27
  sizes=sorted(set(int(x) for x in re.findall(r'\b(8|12|16|22)\s*oz',d,re.I)))
  recipe={'id':f'v8-{gi+1:02}-{ri+1:02}','menuNumber':number,'sourceTitle':original,'englishName':name,'burmeseName':None,'categoryId':cid,'line':'barista' if coffee else 'cold','image':None,'cupSizes':sizes,'ingredients':ingredients,'sourceIngredients':sourceIngredients,'steps':steps,'notes':notices,'espressoDose':None,'espressoYield':None,'iceQuantity':None,'milkQuantity':None,'waterQuantity':None,'sweetnessLevel':None,'version':1,'updatedAt':None,'verification':'source-unverified','source':{'file':'9Floor_Fc_259_All_Menus_Visible_v8.zip','sha256':hashlib.sha256(s.encode()).hexdigest()}}
  for key,pattern in [('espressoDose',r'ကော်ဖီမှုန့်|Coffee dose'),('espressoYield',r'ထုတ်ယူမည့် Espresso|^Espresso$'),('iceQuantity',r'ရေခဲ'),('milkQuantity',r'နို့'),('waterQuantity',r'သောက်ရေ|^ရေ$|Water')]:
   values=[x['quantity'] for x in ingredients if re.search(pattern,x['name'],re.I)]
   recipe[key]=values[0] if len(values)==1 else None
  recipes.append(recipe)
assert len(recipes)==259
assert len({x['englishName'].lower() for x in recipes})==259
payload={'schemaVersion':1,'seedVersion':1,'revision':0,'categories':categories,'recipes':recipes}
(root/'public/recipes.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2))
report={'recipes':len(recipes),'categories':len(categories),'lines':dict(collections.Counter(x['line'] for x in recipes)),'missingNumbers':[x['id'] for x in recipes if not x['menuNumber']],'missingImages':sum(x['image'] is None for x in recipes),'unspecifiedQuantities':[{'id':x['id'],'ingredient':i['name']} for x in recipes for i in x['ingredients'] if not i['quantity']], 'missingIngredients':[x['id'] for x in recipes if not x['ingredients']],'missingSteps':[x['id'] for x in recipes if not x['steps']],'eggRecipes':[x['id'] for x in recipes if 'egg' in x['englishName'].lower()],'sourceSHA256':hashlib.sha256(s.encode()).hexdigest()}
(root/'docs/migration-audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps({k:v if not isinstance(v,list) else len(v) for k,v in report.items()},ensure_ascii=False))
