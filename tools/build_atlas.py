#!/usr/bin/env python3
"""Refresh the Burr Atlas data from the burr_design catalogue.

    python3 tools/build_atlas.py [path/to/burr_design/catalogue]

Copies data.json (one row per puzzle) and pieces.json (piece geometry) into the
content/atlas/ page bundle, compacted. The page itself is layouts/atlas/single.html with
assets/atlas/atlas.{css,js}. Kotani's assembled-shape renders (shapes.png) are deliberately
NOT copied: the public atlas draws only pieces generated from the polycube codes.
"""
import json
import os
import sys
import tempfile
from pathlib import Path

SRC = Path(sys.argv[1] if len(sys.argv) > 1 else
           Path.home() / "claude/burr_design/catalogue")
DST = Path(__file__).resolve().parent.parent / "content/atlas"
WARN_BYTES = 5 * 1024 * 1024


def write(name, obj):
    # "</" escaped so the JSON can sit inside a <script> element safely
    text = json.dumps(obj, separators=(",", ":"), ensure_ascii=False).replace("</", "<\\/")
    fd, tmp = tempfile.mkstemp(dir=DST, suffix=".tmp")
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        f.write(text)
    os.replace(tmp, DST / name)
    size = (DST / name).stat().st_size
    print(f"wrote {DST / name}  {size / 1e6:.2f} MB" + ("  WARNING: over 5 MB" if size > WARN_BYTES else ""))


data = json.loads((SRC / "data.json").read_text())
pieces = json.loads((SRC / "pieces.json").read_text())
F = {n: i for i, n in enumerate(data["fields"])}
assert all(r[F["uri"]] for r in data["rows"]), "every puzzle needs its puzzlewillbeplayed.com path"
DST.mkdir(parents=True, exist_ok=True)
write("data.json", data)
write("pieces.json", {k: v for k, v in pieces.items() if v})
print(f"{len(data['rows']):,} puzzles, {sum(1 for v in pieces.values() if v):,} with piece geometry")
