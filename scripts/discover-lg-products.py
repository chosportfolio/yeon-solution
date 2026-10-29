"""Discover every published model in Yeon Solution's 23 handled categories."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import urljoin, urlencode
import hashlib
import json
import re
import sys
import threading
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup

sys.stdout.reconfigure(encoding="utf-8")
ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / "output/lg-reference"
BASE = "https://www.lge.co.kr"
CACHE.mkdir(parents=True, exist_ok=True)
LOCKS = {}

def load(url):
    url = urljoin(BASE, url)
    name = url.rsplit("/", 1)[-1].split("?")[0]
    key = re.sub(r"[^a-zA-Z0-9_.-]", "-", name) + "-" + hashlib.sha256(url.encode()).hexdigest()[:10]
    path = CACHE / (key + ".html")
    legacy = CACHE / (name + ".html")
    if legacy.exists() and "?" not in url:
        return legacy.read_text(encoding="utf-8"), str(legacy.relative_to(ROOT)), url
    with LOCKS.setdefault(url, threading.Lock()):
        if not path.exists():
            with urlopen(Request(url, headers={"User-Agent": "Mozilla/5.0"}), timeout=45) as response:
                path.write_bytes(response.read())
    return path.read_text(encoding="utf-8"), str(path.relative_to(ROOT)), url

# Bootstrap these public navigation maps on a fresh checkout as well.
if not (CACHE / "navigation.json").exists():
    page, _, _ = load("/kr/business/product/cooling/multiv_i")
    navigation = re.search(r"var gnbMenuJson\s*=\s*(\[.*?\]);", page, re.S)
    (CACHE / "navigation.json").write_text(json.dumps(json.loads(navigation.group(1)), ensure_ascii=False), encoding="utf-8")
if not (CACHE / "product-tabs.json").exists():
    script, _, _ = load("/kr/business/asset/js/usp/cooling/commonInfo.js")
    script = re.sub(r"//[^\n]*", "", script)
    tabs = {}
    for name, body in re.findall(r"var\s+(\w+)\s*=\s*(\[.*?\]);", script, re.S):
        try:
            tabs[name] = json.loads(body, strict=False)
        except json.JSONDecodeError:
            continue
    (CACHE / "product-tabs.json").write_text(json.dumps(tabs, ensure_ascii=False), encoding="utf-8")
NAV = json.loads((CACHE / "navigation.json").read_text(encoding="utf-8"))
TABS = json.loads((CACHE / "product-tabs.json").read_text(encoding="utf-8"))

def links_for(ids):
    return list(dict.fromkeys(x["menuLinkPathName"].strip() for x in NAV if any(f"cateId1={i}" in x.get("menuLinkPathName", "") for i in ids)))

def statics(name):
    return [dict(x) for x in TABS[name]]

GROUPS = [
    dict(category="hvac", group="absorption", name="흡수식 냉온수기", static=[x for x in statics("chiller") if "chiller-chiller" in x["link"]]),
    dict(category="hvac", group="turbo", name="터보냉동기", static=[x for x in statics("chiller") if "turbo" in x["link"]]),
    dict(category="hvac", group="screw", name="스크류냉동기", static=[x for x in statics("chiller") if "screw" in x["link"]]),
    dict(category="hvac", group="inverter-scroll", name="인버터스크롤칠러", static=[x for x in statics("chiller") if "scroll" in x["link"]]),
    dict(category="hvac", group="fan-coil", name="휀코일유니트", static=[x for x in statics("cooper") if "fcu" in x["link"]]),
    dict(category="hvac", group="cooling-tower", name="냉각탑", static=[], lists=[], consultation=True),
    dict(category="hvac", group="temperature-humidity", name="항온항습기", static=[], lists=[], consultation=True),
    dict(category="hvac", group="ahu", name="AHU", static=[x for x in statics("cooper") if "conditioning" in x["link"]]),
    dict(category="air-conditioner", group="ghp", name="GHP", static=[dict(link="/kr/business/product/cooling/ghp", cateName="LG GHP SUPER III PLUS"), dict(link="/kr/business/product/cooling/hybrid", cateName="멀티V-GHP 하이브리드")]),
    dict(category="air-conditioner", group="ehp", name="EHP", static=statics("outdoor") + [x for x in statics("indoor") if "doas" not in x["link"]] + statics("single")),
    dict(category="air-conditioner", group="residential", name="주거용 시스템에어컨", static=statics("multi") + statics("multiPremium"), lists=links_for(["CT00025779"])),
    dict(category="air-conditioner", group="doas", name="DOAS", static=[x for x in statics("indoor") if "doas" in x["link"]]),
    dict(category="air-conditioner", group="boiler", name="시스템보일러", static=statics("boiler")),
    dict(category="air-conditioner", group="erv", name="ERV(전열교환기)", lists=links_for(["CT00000416", "CT00025699"])),
    dict(category="appliance", group="refrigerator", name="냉장고", lists=links_for(["CT00023500", "CT00000718", "CT00000719", "CT00000577", "CT00020104", "CT00020105", "CT00026361"])),
    dict(category="appliance", group="freezer", name="냉동고", lists=[x["menuLinkPathName"] for x in NAV if "cateId2=CT00020119" in x.get("menuLinkPathName", "")]),
    dict(category="appliance", group="dishwasher", name="식기세척기", lists=links_for(["CT00000727"])),
    dict(category="appliance", group="induction", name="인덕션", lists=links_for(["CT00000482"])),
    dict(category="appliance", group="washer", name="세탁기", lists=links_for(["CT00000728", "CT00000729", "CT00000730", "CT00025159", "CT00020112"])),
    dict(category="appliance", group="dryer", name="건조기", lists=links_for(["CT00024619", "CT00025161"])),
    dict(category="appliance", group="oven", name="광파오븐", lists=links_for(["CT00000723", "CT00000724", "CT00020110"])),
    dict(category="appliance", group="tv", name="TV", lists=links_for(["CT00026539", "CT00024520", "CT00024521", "CT00026439"])),
    dict(category="appliance", group="vacuum", name="청소기", lists=links_for(["CT00021699", "CT00025340", "CT00025341", "CT00025959", "CT00000762", "CT00025879"])),
]

errors = []

def discover_list(path):
    text, cached, url = load(path)
    init = re.search(r"productListUtil\.fnInit\((.*?)\);", text, re.S)
    if not init:
        raise ValueError(f"No list initialization: {url}")
    args = re.findall(r"'([^']*)'", init.group(1))
    categories, redirect, _, xml_path, subcategory = args[:5]
    xml, _, _ = load(xml_path)
    root = ET.fromstring(xml)
    cats = set(re.findall(r"CT\d+", categories))
    if subcategory:
        cats = {subcategory}
    else:
        # The list initialization uses the parent ID, while its XML stores
        # leaf categories (e.g. three-zone induction, built-in freezers).
        prefix = path.split("&cateId2=")[0]
        for item in NAV:
            child = item.get("menuLinkPathName", "")
            if child.startswith(prefix + "&cateId2="):
                cats.update(re.findall(r"cateId2=(CT\d+)", child))
    result = []
    for p in root.findall(".//PRODUCT"):
        values = {child.tag: child.text or "" for child in p}
        if values.get("PRODUCT_CATEID") not in cats:
            continue
        if subcategory and values.get("PRODUCT_CATEID2") and values["PRODUCT_CATEID2"] != subcategory:
            continue
        params = dict(cateId1=categories.split("|")[0], prdId=values["PRODUCT_ID"], cateId2=subcategory)
        detail = urljoin(BASE, redirect) + "?" + urlencode(params)
        values.update(source=detail, listSource=url, listCache=cached)
        result.append(values)
    return result

all_lists = list(dict.fromkeys(p for group in GROUPS for p in group.get("lists", [])))
list_results = {}
with ThreadPoolExecutor(max_workers=5) as pool:
    futures = {path: pool.submit(discover_list, path) for path in all_lists}
    for path, task in futures.items():
        try:
            list_results[path] = task.result()
            print(f"List {path}: {len(list_results[path])} models", flush=True)
        except Exception as error:
            errors.append(dict(source=path, error=str(error)))

for group in GROUPS:
    models = {}
    for item in group.get("static", []):
        source = urljoin(BASE + "/kr/business/product/cooling/", item["link"].strip())
        slug = source.rsplit("/", 1)[-1]
        models[slug] = dict(slug=slug, source=source, name=item["cateName"].strip(), thumbnail=item.get("src"), kind="family")
    for path in group.get("lists", []):
        for model in list_results.get(path, []):
            if group["group"] == "refrigerator" and model["PRODUCT_CATEID"] == "CT00020119":
                continue
            slug = model["PRODUCT_ID"].lower()
            models[slug] = dict(slug=slug, source=model["source"], name=model["PRODUCT_TITLE"], model=model["PRODUCT_NAME"], thumbnail=model.get("PRODUCT_IMAGE_LIST"), kind="model", listing=model)
    group["models"] = list(models.values())
    print(f"GROUP {group['category']}/{group['group']}: {len(models)}", flush=True)

(CACHE / "inventory.json").write_text(json.dumps(dict(groups=GROUPS, errors=errors), ensure_ascii=False, indent=2), encoding="utf-8")
print(f"Total: {sum(len(g['models']) for g in GROUPS)} entries in {len(GROUPS)} groups. Errors: {len(errors)}", flush=True)
