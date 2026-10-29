"""Import all published LG B2B models in Yeon Solution's handled categories.

Run discover-lg-products.py and cache-lg-details.py first. Cached HTML is never
executed; only static product content and allowlisted tables are exported.
"""
from pathlib import Path
from bs4 import BeautifulSoup
import argparse,html,json,re,sys

sys.stdout.reconfigure(encoding='utf-8')
parser=argparse.ArgumentParser()
parser.add_argument('--pillow-path')
args=parser.parse_args()
if args.pillow_path:sys.path.append(args.pillow_path)
try:
    from PIL import Image
except ImportError:
    Image=None
from lg_content import ContentImporter

ROOT=Path(__file__).resolve().parents[1]
CACHE=ROOT/'output/lg-reference'
DATA=ROOT/'public/data/products'
DATA.mkdir(parents=True,exist_ok=True)
inv=json.loads((CACHE/'inventory-details.json').read_text(encoding='utf-8'))
importer=ContentImporter(ROOT,Image)
products=[]
issues=[]

for group in inv['groups']:
    for model in group['models']:
        if model.get('error'):
            issues.append(dict(id=model['slug'],error=model['error']));continue
        soup=BeautifulSoup((ROOT/model['cache']).read_text(encoding='utf-8'),'html.parser')
        listing=model.get('listing',{})
        name_node=soup.select_one('.btn-model strong span')
        name=listing.get('PRODUCT_TITLE') or (name_node.get_text(' ',strip=True) if name_node else BeautifulSoup(model['name'],'html.parser').get_text(' ',strip=True))
        model_name=listing.get('PRODUCT_NAME','')
        if model_name and model_name not in name:name+=' '+model_name
        # Keep a useful series name when a group page labels its model merely GHP.
        if model['kind']=='family' and name in ['GHP','LG GHP']:name=model['name']
        headline=soup.select_one('.headLine')
        subtitle=headline.get_text(' ',strip=True) if headline else ''
        subtitle=subtitle.replace(name,'').strip()
        gallery=[]
        content=soup.select_one('#content') or soup
        for image in content.select('img'):
            src=image.get('src','')
            if '/gallery/' not in src:continue
            asset=importer.asset(src)
            if asset and not any(x['src']==asset for x in gallery):gallery.append(dict(src=asset,alt=image.get('alt',name)))
        if not gallery:
            for image in soup.select('.ovv .uspTit img'):
                asset=importer.asset(image.get('src'))
                if asset and not any(x['src']==asset for x in gallery):gallery.append(dict(src=asset,alt=image.get('alt',name)))
        thumbnail=importer.asset(model.get('thumbnail'))
        if not gallery and thumbnail:gallery=[dict(src=thumbnail,alt=name)]
        # This exact public model page remains accessible when the older B2B
        # e-catalog image server is unavailable.
        if model['slug']=='md00062310' and (CACHE/'f5wr-public.html').exists():
            public_page=BeautifulSoup((CACHE/'f5wr-public.html').read_text(encoding='utf-8'),'html.parser')
            og=public_page.select_one('meta[property="og:image"]')
            if og and og.get('content'):
                thumbnail=importer.asset(og['content'])
                gallery=[dict(src=thumbnail,alt=name+' 제품 이미지')]
        if not gallery:
            issues.append(dict(id=model['slug'],error='No published product image'));continue
        thumbnail=thumbnail or gallery[0]['src']
        features=[]
        body=soup.select_one('#ftArea0') or soup.select_one('#ftAreaUsp')
        if body:
            features=[importer.feature(n) for n in body.select(':scope > section')]
            features=[f for f in features if f]
        if not features:
            body=soup.select_one('#replaceBox')
            if body:
                features=[importer.feature(n) for n in body.select('section[class*="module-b"]') if not n.find_parent('section',class_=re.compile('module-b'))]
                features=[f for f in features if f]
                if not features:features=importer.consumer_features(body)
        if model.get('overviewCache'):
            overview=BeautifulSoup((ROOT/model['overviewCache']).read_text(encoding='utf-8'),'html.parser')
            consumer=importer.consumer_features(overview)
            if consumer:features=consumer
        specs=importer.specs(listing.get('PRODUCT_SPEC',''))
        highlights=[li.get_text(' ',strip=True) for li in soup.select('section.feature ul li')]
        if len(highlights)<2:
            preferred=['전체 용량','용량','세탁 용량','건조 용량','화면 크기','냉방능력','정격풍량','최대풍량','소비전력','에너지 소비효율등급','제품 크기','컴프레서','색상']
            highlights=[s['label']+' '+s['value'] for s in specs if any(k in s['label'] for k in preferred) and s['value']][:4] or highlights
        if not highlights:highlights=[group['name'],model_name or name]
        lineup=importer.spec_table(specs) if specs else importer.lineup(soup.select_one('#ftArea2') or soup.select_one('#ftAreaSpec'))
        family=listing.get('PRODUCT_KIND') or ('멀티 V 실외기' if model['slug'].startswith('outdoor') or model['slug']=='multiv_i' else '멀티 V 실내기' if model['slug'].startswith('indoor') else 'SINGLE' if model['slug'].startswith('single-') and group['group']=='ehp' else group['name'])
        id=group['category']+'/'+group['group']+'/'+model['slug']
        documents=[]
        for a in soup.select('#content a[href]'):
            href=a.get('href','')
            if '.pdf' in href.lower() and href.startswith(('https://','http://','/')):
                documents.append(dict(title=a.get_text(' ',strip=True) or '제품 자료',url='https://www.lge.co.kr'+href if href.startswith('/') else href))
        product=dict(id=id,slug=model['slug'],category=group['category'],group=group['group'],groupName=group['name'],name=name,model=model_name,family=family,kind=model['kind'],source=model['source'],overviewSource=model.get('overviewSource'),thumbnail=thumbnail,gallery=gallery,subtitle=subtitle,highlights=highlights,features=features,lineupHtml=lineup,specifications=specs,documents=documents,dataPath='data/products/'+id+'.json')
        products.append(product)
        if not features:issues.append(dict(id=id,error='No separate USP published; using official specifications and gallery'))
    print(group['category']+'/'+group['group']+': parsed',flush=True)

print(f'Downloading {len(importer.assets)} unique image assets for {len(products)} products',flush=True)
importer.download()
print(f'Download complete: {len(importer.errors)} unavailable assets',flush=True)
missing={x['path'] for x in importer.errors}
# An unavailable manufacturer's image is omitted, never replaced with a
# photograph or model from a different product.
def valid_features(items):
    result=[]
    for feature in items:
        if feature.get('image',{}).get('src') in missing:continue
        if feature.get('image',{}).get('mobile') in missing:feature['image']['mobile']=None
        if feature.get('items'):
            feature['items']=[i for i in feature['items'] if i.get('image',{}).get('src') not in missing]
            if not feature['items']:continue
        result.append(feature)
    return result

index=[]
for p in products:
    p['gallery']=[i for i in p['gallery'] if i['src'] not in missing]
    if not p['gallery']:
        product_image=next((f['image'] for f in p['features'] if f.get('image') and f['image']['src'] not in missing),None)
        if product_image:
            p['gallery']=[dict(product_image,alt=p['name']+' 제품 소개 이미지')]
            p['imagePresentation']='feature'
        else:
            issues.append(dict(id=p['id'],error='No available gallery image'));continue
    if p['thumbnail'] in missing:p['thumbnail']=p['gallery'][0]['src']
    p['features']=valid_features(p['features'])
    importer.dimensions(p)
    target=ROOT/'public'/p['dataPath'];target.parent.mkdir(parents=True,exist_ok=True)
    target.write_text(json.dumps(p,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
    index.append({key:p[key] for key in ['id','slug','category','group','groupName','name','model','family','kind','source','thumbnail','dataPath']})

groups=[]
for group in inv['groups']:
    groups.append(dict(category=group['category'],slug=group['group'],name=group['name'],consultation=group.get('consultation',False),sources=list(dict.fromkeys([m['source'] for m in group['models']])),productIds=[p['id'] for p in index if p['category']==group['category'] and p['group']==group['group']]))
(ROOT/'src/data/lg-catalog.json').write_text(json.dumps(dict(products=index,groups=groups),ensure_ascii=False,indent=2),encoding='utf-8')
(ROOT/'public/images/products/sources.json').write_text(json.dumps(dict(references=[p['source'] for p in products],images=importer.sources),ensure_ascii=False,indent=2),encoding='utf-8')
(CACHE/'import-report.json').write_text(json.dumps(dict(products=len(index),groups=len(groups),issues=issues,assetErrors=importer.errors),ensure_ascii=False,indent=2),encoding='utf-8')
print(f'Published {len(index)} products / {len(groups)} groups; {len(issues)} source notes; {len(importer.errors)} unavailable assets',flush=True)
