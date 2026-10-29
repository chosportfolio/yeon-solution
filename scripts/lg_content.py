"""Static product-content parsing shared by the catalog importer."""
from pathlib import Path
from urllib.parse import urljoin,urlparse,quote
from urllib.request import Request,urlopen
from concurrent.futures import ThreadPoolExecutor
from bs4 import BeautifulSoup,Comment
import hashlib,html,io,json,re

class ContentImporter:
    def __init__(self, root, image_class=None):
        self.root=Path(root)
        self.image_class=image_class
        self.assets={}
        self.sources={}
        self.errors=[]
        (self.root/'public/images/products').mkdir(parents=True,exist_ok=True)

    def asset(self,src):
        if not src or src.startswith('data:'): return None
        src=src.strip()
        if src.startswith('https://kr/'):
            src='https://www.lge.co.kr/'+src[len('https://'):]
        url=quote(urljoin('https://www.lge.co.kr',src),safe=':/?&=%+@,;')
        if urlparse(url).hostname=='kr':url='https://www.lge.co.kr/kr'+urlparse(url).path
        if url not in self.assets:
            stem=re.sub(r'[^a-zA-Z0-9_-]','-',Path(urlparse(url).path).stem)[:80] or 'product'
            ext=Path(urlparse(url).path).suffix.lower()
            if ext not in ['.gif','.svg']:ext='.webp' if self.image_class else (ext or '.jpg')
            filename=stem+'-'+hashlib.sha256(url.encode()).hexdigest()[:8]+ext
            self.assets[url]='images/products/'+filename
            self.sources[filename]=url
        return self.assets[url]

    @staticmethod
    def fragment(node):
        if node is None:return ''
        soup=BeautifulSoup(str(node),'html.parser')
        for el in soup.select('script,style,button,form,iframe'):el.decompose()
        for el in list(soup.find_all(True)):
            if el.name not in ['br','span','em','strong','b','sup','sub']:el.unwrap()
            else:el.attrs={}
        return soup.decode_contents().strip() if soup.get_text(' ',strip=True).replace('\xa0',' ').strip() else ''

    def picture(self,node):
        if node is None:return None
        desktop=node.select_one('img.onW, img.pc-only, img.pc') or node.select_one('img')
        mobile=node.select_one('img.onM, img.mo-only, img.mobile')
        if desktop is None:
            video=node.select_one('video[poster]')
            if video:return dict(src=self.asset(video['poster']),mobile=None,alt=video.get('aria-label','제품 소개 영상'))
            return None
        def src(img):
            return img.get('data-src') or img.get('data-original') or img.get('src')
        image=self.asset(src(desktop))
        if not image:return None
        return dict(src=image,mobile=self.asset(src(mobile)) if mobile else None,alt=desktop.get('alt',''))

    def copy(self,node):
        title=node.select_one('.headCopy,.bodyCopy,.subCopy,.banner-title')
        eyebrow=node.select_one('.eyebrow')
        return dict(title=self.fragment(title),eyebrow=eyebrow.get_text(' ',strip=True) if eyebrow else '',description=self.fragment(node.select_one('.headDesc,.subDesc,.banner-txt')),notes=list(dict.fromkeys(self.fragment(n) for n in node.select('.footnote') if self.fragment(n))),light=bool(title and 'c-f' in title.get('class',[])),desktopCopyOnly=bool(node.select_one('.layer.onW')))

    def feature(self,node):
        classes=node.get('class',[])
        if 'responsive' in classes:
            items=[dict(image=self.picture(n),**self.copy(n)) for n in node.select('.slideUl > li')]
            items=[i for i in items if i['image']]
            if items:return dict(kind='carousel',items=items)
        if 'module-b23' in classes:
            items=[dict(image=self.picture(n),**self.copy(n)) for n in node.select(':scope > .unit')]
            items=[i for i in items if i['image']]
            if items:return dict(kind='columns',items=items)
        image=self.picture(node)
        if not image:return None
        kind='full'
        if any(c in classes for c in ['module-b21','module-b22']):kind='background' if node.select_one('.background-image') else 'split'
        video=node.select_one("a[href*='youtube.com']")
        return dict(kind=kind,image=image,reverse='module-b22' in classes,video=video.get('href') if video else None,**self.copy(node))

    def consumer_features(self,soup):
        scope=soup.select('.wcms-usp-scope') or [soup]
        components=[]
        for root in scope:
            for node in root.select('.component'):
                if node.find_parent(class_='component'):continue
                if any('rentalcare' in str(i.get('src','')) for i in node.select('img')):continue
                components.append(node)
        features=[]
        for node in components:
            pic=self.picture(node)
            if not pic:continue
            title=node.select_one('.title h2,.headline h2,h2,h3')
            description=node.select_one('.text-wrap .text,.text-area .text,.body-copy,.text-wrap .body-copy')
            eyebrow=node.select_one('.small-title,.eyebrow')
            notes=list(dict.fromkeys(self.fragment(n) for n in node.select('.bullet-list .b-txt') if self.fragment(n)))
            # Consumer WCMS layouts vary widely; placing copy above imagery
            # preserves legibility without copying their application scripts.
            features.append(dict(kind='story',image=pic,title=self.fragment(title),eyebrow=eyebrow.get_text(' ',strip=True) if eyebrow else '',description=self.fragment(description),notes=notes,light=False,desktopCopyOnly=False))
        if features:return features
        # Older product overviews publish image-only USP content.
        seen=set()
        for img in soup.select('img'):
            src=img.get('data-src') or img.get('src','')
            if not src or any(t in src.lower() for t in ['icon','logo','play_btn','rentalcare','spinner','loading']):continue
            if not any(t in src.lower() for t in ['/usp/','/features/','/usp_']):continue
            if any(c in img.get('class',[]) for c in ['mo-only','onM','mobile']):continue
            if src in seen:continue
            seen.add(src)
            pic=self.picture(img.parent)
            if pic:features.append(dict(kind='full',image=pic,title='',description='',notes=[],eyebrow='',light=False,desktopCopyOnly=False))
        return features

    def lineup(self,node):
        if node is None:return ''
        node=BeautifulSoup(str(node),'html.parser')
        for el in node.select('script,style,form,input,button,iframe,.onM'):el.decompose()
        for comment in node.find_all(string=lambda s:isinstance(s,Comment)):comment.extract()
        for a in node.select('a'):a.unwrap()
        for p in node.select('p.detail'):
            if '고압가스' in p.get_text():p.decompose()
        allowed={'section','div','h2','h3','p','span','strong','em','b','br','sup','sub','ul','li','table','caption','colgroup','col','thead','tbody','tr','th','td','img'}
        for el in list(node.find_all(True)):
            if el.name not in allowed:el.unwrap();continue
            attrs={k:v for k,v in el.attrs.items() if k in ['class','colspan','rowspan','scope']}
            if el.name=='img':
                asset=self.asset(el.get('src'))
                if not asset:el.decompose();continue
                attrs.update(src=asset,alt=el.get('alt',''),loading='lazy')
            el.attrs=attrs
            if el.name=='table':
                wrapper=BeautifulSoup('<div class="product-spec-scroll" tabindex="0" role="region" aria-label="제품 사양표, 가로 스크롤 가능"></div>','html.parser').div
                el.wrap(wrapper)
        return node.decode_contents().strip() if node.get_text(' ',strip=True) or node.select('img') else ''

    @staticmethod
    def specs(raw):
        return [dict(label=html.unescape(k).strip(),value=html.unescape(v).strip()) for k,v in re.findall(r'\[([^`\]]+)`([^`\]]*)`[^\]]*\]',raw or '')]

    def spec_table(self,specs):
        if not specs:return ''
        rows=''.join('<tr><th scope="row">'+html.escape(s['label'])+'</th><td>'+html.escape(s['value'])+'</td></tr>' for s in specs)
        return '<div class="product-model-specs"><table><caption>제품 주요 사양</caption><tbody>'+rows+'</tbody></table></div>'

    def download(self):
        def one(pair):
            url,relative=pair;path=self.root/'public'/relative
            if path.exists():return
            try:
                with urlopen(Request(url,headers={'User-Agent':'Mozilla/5.0'}),timeout=45) as response:raw=response.read()
                if path.suffix=='.webp':
                    with self.image_class.open(io.BytesIO(raw)) as img:
                        img.thumbnail((1600,5000));img.save(path,'WEBP',quality=86,method=3)
                else:path.write_bytes(raw)
            except Exception as e:self.errors.append(dict(source=url,path=relative,error=str(e)))
        with ThreadPoolExecutor(max_workers=6) as pool:list(pool.map(one,self.assets.items()))

    def dimensions(self,node):
        if isinstance(node,dict):
            for key,prefix in [('src',''),('mobile','mobile')]:
                if node.get(key) and self.image_class:
                    path=self.root/'public'/node[key]
                    if path.exists():
                        try:
                            with self.image_class.open(path) as img:
                                if prefix:node['mobileWidth'],node['mobileHeight']=img.size
                                else:node['width'],node['height']=img.size
                        except Exception:pass
            for child in list(node.values()):self.dimensions(child)
        elif isinstance(node,list):
            for child in node:self.dimensions(child)
