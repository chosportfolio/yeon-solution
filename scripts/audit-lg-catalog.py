"""Audit published catalog coverage, source specification values and local assets."""
from pathlib import Path
from bs4 import BeautifulSoup
import json,re,sys

sys.stdout.reconfigure(encoding='utf-8')
ROOT=Path(__file__).resolve().parents[1]
CAT=json.loads((ROOT/'src/data/lg-catalog.json').read_text(encoding='utf-8'))
INV=json.loads((ROOT/'output/lg-reference/inventory-details.json').read_text(encoding='utf-8'))
expected={g['category']+'/'+g['group']+'/'+m['slug']:m for g in INV['groups'] for m in g['models']}
actual={p['id']:p for p in CAT['products']}
assert set(expected)==set(actual),'Missing or duplicate catalog models'
assert len(CAT['groups'])==23
assets=set();spec_models=0;spec_cells=0;lineup_cells=0
normalize=lambda value:re.sub(r'\s+','',value)

def visit(value):
    if isinstance(value,dict):
        for key,child in value.items():
            if key in ['src','mobile','thumbnail'] and child:assets.add(child)
            else:visit(child)
    elif isinstance(value,list):
        for child in value:visit(child)

for id,summary in actual.items():
    detail=json.loads((ROOT/'public'/summary['dataPath']).read_text(encoding='utf-8'))
    assert detail['id']==id and detail['gallery']
    assert detail['features'] or detail['specifications'],id+' has no product content'
    visit(detail)
    model=expected[id]
    if model.get('listing'):
        original=model['listing'].get('PRODUCT_SPEC','')
        raw=re.findall(r'\[([^`\]]+)`([^`\]]*)`[^\]]*\]',original)
        saved=[(s['label'],s['value']) for s in detail['specifications']]
        import html
        assert [(html.unescape(k).strip(),html.unescape(v).strip()) for k,v in raw]==saved,id+' changed specification values'
        spec_models+=1;spec_cells+=len(saved)
    else:
        source=BeautifulSoup((ROOT/model['cache']).read_text(encoding='utf-8'),'html.parser')
        original=source.select_one('#ftArea2') or source.select_one('#ftAreaSpec')
        if original:
            for mobile in original.select('.onM'):mobile.decompose()
            before=[normalize(c.get_text('',strip=True)) for c in original.select('th,td')]
            published=BeautifulSoup(detail['lineupHtml'],'html.parser')
            after=[normalize(c.get_text('',strip=True)) for c in published.select('th,td')]
            assert before==after,id+' changed lineup cells'
            lineup_cells+=len(after)
    parsed=BeautifulSoup(detail['lineupHtml'],'html.parser')
    assert not parsed.select('script,style,iframe,form,input,a')
    for el in parsed.find_all(True):
        assert not any(k.startswith('on') for k in el.attrs)
    for image in parsed.select('img'):assets.add(image['src'])
    for doc in detail['documents']:assert doc['url'].startswith(('https://','http://'))

for path in assets:
    resolved=(ROOT/'public'/path).resolve()
    assert resolved.is_relative_to((ROOT/'public').resolve())
    assert resolved.is_file(),str(resolved)
for group in CAT['groups']:
    assert group['productIds'] or group['consultation']
    assert all(id in actual for id in group['productIds'])

report=dict(products=len(actual),groups=len(CAT['groups']),specificationModels=spec_models,specificationValues=spec_cells,lineupCells=lineup_cells,localImages=len(assets),coverage=[dict(category=g['category'],group=g['slug'],models=len(g['productIds']),consultation=g['consultation']) for g in CAT['groups']])
(ROOT/'output/catalog-coverage.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in report.items() if k!='coverage'},ensure_ascii=False))
