# -*- coding: utf-8 -*-
import re
import json
from pathlib import Path

path = Path(r"c:\Users\0303003\Desktop\西南铜(吴).flo")
data = path.read_bytes()

# MetCal .flo stores most readable strings as UTF-8 fragments in binary
text = data.decode("utf-8", errors="ignore")

NAMES = {
    "xitong": "\u7cfb\u7edf\u5185\u7cbe\u77ff",
    "guonei": "\u56fd\u5185\u5916\u8d2d\u77ff",
    "jinkou": "\u8fdb\u53e3\u94dc\u7cbe\u77ff",
    "bianmao": "\u8fb9\u8d38\u77ff",
    "hanshui": "\u542b\u6c34",
    "hunhe": "\u6df7\u5408\u94dc\u7cbe\u77ff",
}

for key, name in NAMES.items():
    marker = f"-.{name}.t."
    idx = text.find(marker)
    if idx < 0:
        print(f"{key} ({name}): NOT FOUND")
        continue
    m = re.match(rf"-\.{re.escape(name)}\.t\.([\d.x]+)", text[idx:])
    flow = m.group(1) if m else "?"
    chunk = text[idx : idx + 700]
    clean = "".join(c if c.isprintable() else "." for c in chunk)
    elems = dict(re.findall(r"([A-Za-z0-9_]+(?:\.[A-Za-z0-9_]+)?)\.\.([\d.]+)", clean))
    print(f"\n{key} ({name}): flow={flow}")
    for k, v in list(elems.items())[:14]:
        print(f"  {k}: {v}")

print("\n--- moisture constraints ---")
pat = (
    r"Input\.\u542b\u6c34(\d*)\s*/\s*\[\s*Input\.([\u4e00-\u9fffA-Za-z0-9]+)"
    r"\+Input\.\u542b\u6c34(\d*)\s*\]\.(\d+\.?\d*)/100"
)
for m in re.finditer(pat, text):
    print(m.groups())

idx = text.find("1.\u7cfb\u7edf\u5185\u7cbe\u77ff")
if idx >= 0:
    print("\n--- numbered list ---")
    print("".join(c if c.isprintable() else "." for c in text[idx : idx + 500]))

units = sorted(set(re.findall(r"[\u4e00-\u9fffA-Za-z0-9\u00b7\-]{2,30}\[\d+\]", text)))
print(f"\n--- units ({len(units)}) ---")
for u in units:
    print(u)

out = Path(__file__).resolve().parent.parent / ".flo_probe_out.json"
payload = {"names": NAMES, "text_has_hunhe": text.count(NAMES["hunhe"])}
out.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
