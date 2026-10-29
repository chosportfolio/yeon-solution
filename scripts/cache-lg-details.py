"""Cache the official detail pages and their linked product overview content."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import urljoin
from bs4 import BeautifulSoup
import hashlib
import json
import sys
import threading

sys.stdout.reconfigure(encoding="utf-8")
ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / "output/lg-reference"
inventory = json.loads((CACHE / "inventory.json").read_text(encoding="utf-8"))
locks = {}

def load(url, kind):
    file = CACHE / (kind + "-" + hashlib.sha256(url.encode()).hexdigest()[:16] + ".html")
    with locks.setdefault(url, threading.Lock()):
        if not file.exists():
            with urlopen(Request(url, headers={"User-Agent": "Mozilla/5.0"}), timeout=60) as response:
                data = response.read()
                file.write_bytes(data)
    return file

def read_model(record):
    try:
        file = load(record["source"], "detail")
        soup = BeautifulSoup(file.read_text(encoding="utf-8"), "html.parser")
        frame = soup.select_one("#replaceBox iframe[src], .print-area iframe[src]")
        record["cache"] = str(file.relative_to(ROOT))
        if frame:
            record["overviewSource"] = urljoin(record["source"], frame["src"])
            overview = load(record["overviewSource"], "overview")
            record["overviewCache"] = str(overview.relative_to(ROOT))
        record["pageTitle"] = soup.title.get_text(" ", strip=True) if soup.title else ""
    except Exception as error:
        record["error"] = str(error)
    return record

records = [model for group in inventory["groups"] for model in group["models"]]
with ThreadPoolExecutor(max_workers=6) as pool:
    for index, record in enumerate(pool.map(read_model, records), 1):
        if index % 20 == 0 or record.get("error"):
            print(f"Cached {index}/{len(records)}" + (f" ERROR {record['source']}: {record['error']}" if record.get("error") else ""), flush=True)
(CACHE / "inventory-details.json").write_text(json.dumps(inventory, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"{len(records)} detail pages; {sum(bool(m.get('overviewCache')) for m in records)} linked overviews; {sum(bool(m.get('error')) for m in records)} errors", flush=True)
