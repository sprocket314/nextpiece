#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.10"
# dependencies = ["trimesh>=4.4", "numpy"]
# ///
"""Convert OpenSCAD STL pieces into one coloured .glb for the blog's {{< model >}} shortcode.

    uv run tools/stl2glb.py piece1.stl piece2.stl ... -o content/posts/<slug>/pieces.glb

One STL per piece, in assembled position (as OpenSCAD exports them). Each piece gets
its own colour, by default from the PLA Basic filaments in stock, in this order:
Red, Cyan, Yellow, Bambu Green, Orange, Purple, Hot Pink, Turquoise, Gold, Cocoa Brown,
Bright Green, Blue. Override with --colors "#C12E1F,#0086D6,...".

Layouts:
    (default)       as exported, i.e. assembled
    --explode 1.6   each piece pushed out from the centre; 1.0 = assembled
    --row           pieces laid side by side, like a photo of the parts

Millimetres are converted to metres (glTF's unit), so AR shows the true size.
Normals are left out by default: viewers then shade every face flat, which keeps
blocky puzzle pieces crisp and the file small. Use --smooth for curved parts.
"""
from __future__ import annotations

import argparse
import json
import os
import struct
import sys
import tempfile
from pathlib import Path

import numpy as np
import trimesh
from trimesh.exchange.gltf import export_glb
from trimesh.visual.material import PBRMaterial

STOCK_PALETTE = [
    "#C12E1F",  # Red
    "#0086D6",  # Cyan
    "#F4EE2A",  # Yellow
    "#00AE42",  # Bambu Green
    "#FF6A13",  # Orange
    "#5E43B7",  # Purple
    "#F5547C",  # Hot Pink
    "#00B1B7",  # Turquoise
    "#E4BD68",  # Gold
    "#6F5034",  # Cocoa Brown
    "#BECF00",  # Bright Green
    "#0A2989",  # Blue
]
WARN_BYTES = 5 * 1024 * 1024


def hex_to_rgba(h: str) -> list[int]:
    h = h.strip().lstrip("#")
    if len(h) != 6:
        raise ValueError(f"bad colour {h!r}; use #RRGGBB")
    return [int(h[i : i + 2], 16) for i in (0, 2, 4)] + [255]


def srgb_to_linear(rgba: list[int]) -> list[float]:
    """glTF baseColorFactor is linear; filament hex codes are sRGB."""
    out = []
    for v in rgba[:3]:
        c = v / 255
        out.append(round(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4, 5))
    return out + [rgba[3] / 255]


def set_linear_colours(glb: bytes, colours: dict[str, list[float]]) -> bytes:
    """Rewrite each material's baseColorFactor with exact linear floats (trimesh stores uint8)."""
    magic, version, _ = struct.unpack_from("<4sII", glb, 0)
    json_len, json_type = struct.unpack_from("<I4s", glb, 12)
    assert magic == b"glTF" and json_type == b"JSON"
    doc = json.loads(glb[20 : 20 + json_len])
    for mat in doc.get("materials", []):
        if mat.get("name") in colours:
            mat.setdefault("pbrMetallicRoughness", {})["baseColorFactor"] = colours[mat["name"]]
    js = json.dumps(doc, separators=(",", ":")).encode()
    js += b" " * (-len(js) % 4)
    rest = glb[20 + json_len :]
    body = struct.pack("<I4s", len(js), b"JSON") + js + rest
    return struct.pack("<4sII", b"glTF", version, 12 + len(body)) + body


def load_piece(path: Path) -> trimesh.Trimesh:
    mesh = trimesh.load_mesh(path, process=True)
    if isinstance(mesh, trimesh.Scene):
        mesh = mesh.to_geometry()
    mesh.merge_vertices()
    mesh.update_faces(mesh.nondegenerate_faces())
    mesh.remove_unreferenced_vertices()
    if not mesh.is_watertight:
        print(f"  warning: {path.name} is not watertight (fine for display, check before printing)")
    return mesh


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("stl", nargs="+", type=Path, help="one STL per piece")
    ap.add_argument("-o", "--out", type=Path, required=True, help="output .glb")
    ap.add_argument("--colors", help="comma-separated #RRGGBB, one per piece (cycles if short)")
    ap.add_argument("--explode", type=float, default=1.0, help="push pieces out from the centre by this factor")
    ap.add_argument("--row", action="store_true", help="lay pieces out side by side instead of assembled")
    ap.add_argument("--gap", type=float, default=8.0, help="mm between pieces with --row (default 8)")
    ap.add_argument("--smooth", action="store_true", help="store vertex normals (smooth shading)")
    ap.add_argument("--roughness", type=float, default=0.55, help="PBR roughness, 0..1 (default 0.55, matte PLA)")
    args = ap.parse_args()

    palette = args.colors.split(",") if args.colors else STOCK_PALETTE
    meshes = [load_piece(p) for p in args.stl]

    if args.row:
        x = 0.0
        for m in meshes:
            lo, hi = m.bounds
            m.apply_translation([x - lo[0], -(lo[1] + hi[1]) / 2, -lo[2]])
            x += (hi[0] - lo[0]) + args.gap
    elif args.explode != 1.0:
        centre = np.mean([m.bounds.mean(axis=0) for m in meshes], axis=0)
        for m in meshes:
            c = m.bounds.mean(axis=0)
            m.apply_translation((c - centre) * (args.explode - 1.0))

    scene = trimesh.Scene()
    linear = {}
    for i, (path, m) in enumerate(zip(args.stl, meshes)):
        linear[path.stem] = srgb_to_linear(hex_to_rgba(palette[i % len(palette)]))
        m.apply_scale(0.001)  # mm -> m
        m.visual = trimesh.visual.TextureVisuals(
            material=PBRMaterial(
                name=path.stem,
                baseColorFactor=hex_to_rgba(palette[i % len(palette)]),
                metallicFactor=0.0,
                roughnessFactor=args.roughness,
            )
        )
        scene.add_geometry(m, node_name=path.stem, geom_name=path.stem)

    data = set_linear_colours(export_glb(scene, include_normals=args.smooth), linear)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=args.out.parent, suffix=".glb.tmp")
    with os.fdopen(fd, "wb") as f:
        f.write(data)
    os.replace(tmp, args.out)

    tris = sum(len(m.faces) for m in meshes)
    size = len(data)
    print(f"wrote {args.out}  {len(meshes)} pieces, {tris:,} triangles, {size / 1024:.0f} KB")
    if size > WARN_BYTES:
        print("  WARNING: over 5 MB. Lower $fn in OpenSCAD or decimate before committing.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
