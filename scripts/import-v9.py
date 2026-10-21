"""Append only the verified V9 addition; never renumber or alter the 259 V8 recipes."""
from pathlib import Path
import re,html,json,hashlib
root=Path(__file__).resolve().parents[1]
def clean(s):return html.unescape(re.sub(r'<[^>]+>','',s)).strip()
def details(s):return {clean(re.search(r'<summary[^>]*>(.*?)</summary>',d,re.S)[1]):d for d in re.findall(r'<details\b[^>]*>(.*?)</details>',s,re.S)}
a=details((root/'migration_source/v8.html').read_text())
raw=(root/'migration_source/v9.html').read_text();b=details(raw)
assert len(a)==259 and len(b)==260
assert set(b)-set(a)=={'Iced Cappuccino'} and not set(a)-set(b)
assert all(a[name]==b[name] for name in a), 'Existing source recipe changed; manual review required'
catalog=json.loads((root/'public/recipes.json').read_text())
existing=[r for r in catalog['recipes'] if r['id']!='v9-iced-cappuccino']
assert len(existing)==259 and not any(r['englishName'].casefold()=='iced cappuccino' for r in existing)
d=b['Iced Cappuccino']
rows=[{'name':clean(n),'quantity':clean(q)} for n,q in re.findall(r'<tr>\s*<td>(.*?)</td>\s*<td>(.*?)</td>\s*</tr>',d,re.S)]
r={'id':'v9-iced-cappuccino','menuNumber':None,'sourceTitle':'Iced Cappuccino','englishName':'Iced Cappuccino','burmeseName':None,'categoryId':'category-01','line':'barista','image':None,'cupSizes':[16],'ingredients':rows,'sourceIngredients':rows,'steps':[clean(x) for x in re.findall(r'<label class="tick">(.*?)</label>',d,re.S)],'notes':[clean(x) for x in re.findall(r'<div class="notice">(.*?)</div>',d,re.S)],'espressoDose':rows[0]['quantity'],'espressoYield':rows[1]['quantity'],'iceQuantity':rows[4]['quantity'],'milkQuantity':None,'waterQuantity':None,'sweetnessLevel':None,'version':1,'updatedAt':None,'verification':'source-unverified','source':{'file':'9Floor_Fc_260_Iced_Cappuccino_v9.zip','sha256':hashlib.sha256(raw.encode()).hexdigest()}}
idx=next(i for i,x in enumerate(existing) if x['englishName']=='Iced Latte')+1
catalog['recipes']=existing[:idx]+[r]+existing[idx:]
catalog['seedVersion']=2
(root/'public/recipes.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2))
audit=json.loads((root/'docs/migration-audit.json').read_text())
audit.update({'recipes':260,'lines':{'barista':161,'cold':99},'missingImages':260,'missingNumbers':[x['id'] for x in catalog['recipes'] if not x['menuNumber']],'v9Import':{'addedIds':[r['id']],'existingRecipesChanged':0,'originalIdsPreserved':259,'sourceSHA256':r['source']['sha256']}})
(root/'docs/migration-audit.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2))
print('Verified import: 1 added; 259 unchanged; 260 total; original IDs preserved.')
