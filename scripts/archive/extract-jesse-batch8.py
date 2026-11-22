#!/usr/bin/env python3
"""Extract Jesse-binder Batch 8 wiring plates (Precedent 2019 / Tempo)."""
from __future__ import annotations

from pathlib import Path

import pypdfium2 as pdfium
from PIL import Image

ROOT = Path("/workspace")
UPLOADS = Path("/home/ubuntu/.cursor/projects/workspace/uploads")
OUT = ROOT / "public" / "wiring"
OUT.mkdir(parents=True, exist_ok=True)

MAX_W = 3600
JPEG_Q = 84

PDF = {
    "prec19": UPLOADS / "Club_Car_Precedent_2019___Electrical_996a.pdf",
    "tempo": UPLOADS / "Club_Car_Tempo___Electrical_1b91.pdf",
}

# (pdf_key, page_1based, dest)
JOBS: list[tuple[str, int, str]] = [
    ("prec19", 34, "prec19-batt-fig12-1.jpg"),
    ("prec19", 218, "prec19-gas-eng.jpg"),
    ("prec19", 220, "prec19-gas-main.jpg"),
    ("prec19", 222, "prec19-gas-ip.jpg"),
    ("prec19", 224, "prec19-gas-iplight.jpg"),
    ("prec19", 226, "prec19-eric-main.jpg"),
    ("prec19", 228, "prec19-eric-dash.jpg"),
    ("prec19", 230, "prec19-eric-dcdc.jpg"),
    ("prec19", 232, "prec19-eric-iplight.jpg"),
    ("prec19", 234, "prec19-eric-light.jpg"),
    ("tempo", 33, "tempo21-batt-fig12-2.jpg"),
    ("tempo", 301, "tempo21-kohler-eng.jpg"),
    ("tempo", 303, "tempo21-kohler-main.jpg"),
    ("tempo", 305, "tempo21-kohler-ip.jpg"),
    ("tempo", 309, "tempo21-ex40-main.jpg"),
    ("tempo", 311, "tempo21-ex40-dash.jpg"),
    ("tempo", 313, "tempo21-ex40-eng.jpg"),
    ("tempo", 315, "tempo21-e-2p.jpg"),
    ("tempo", 317, "tempo21-e-4p.jpg"),
    ("tempo", 323, "tempo21-e-lighting.jpg"),
]


def render(doc: pdfium.PdfDocument, page_1: int, scale: float) -> Image.Image:
    return doc[page_1 - 1].render(scale=scale).to_pil().convert("RGB")


def fit_width(im: Image.Image, max_w: int = MAX_W) -> Image.Image:
    if im.width <= max_w:
        return im
    return im.resize((max_w, max(1, int(im.height * max_w / im.width))), Image.Resampling.LANCZOS)


def crop_white(im: Image.Image, threshold: int = 248, pad: int = 16) -> Image.Image:
    mask = im.convert("L").point(lambda x: 255 if x < threshold else 0)
    bbox = mask.getbbox()
    if not bbox:
        return im
    l, t, r, b = bbox
    return im.crop((max(0, l - pad), max(0, t - pad), min(im.width, r + pad), min(im.height, b + pad)))


def save_jpeg(im: Image.Image, name: str) -> None:
    dest = OUT / name
    im = fit_width(im)
    im.save(dest, "JPEG", quality=JPEG_Q, optimize=True)
    print(f"  {name:52s} {im.size[0]:4d}x{im.size[1]:4d}  {dest.stat().st_size / 1024:6.1f} KB")


def main() -> None:
    docs: dict[str, pdfium.PdfDocument] = {}
    for key, path in PDF.items():
        if not path.exists():
            raise SystemExit(f"missing {path}")
        docs[key] = pdfium.PdfDocument(str(path))
        print(f"{key}: {path.name} ({len(docs[key])} pages)")

    for key, page_1, dest in JOBS:
        page = docs[key][page_1 - 1]
        landscape = page.get_width() > page.get_height()
        scale = 2.4 if landscape else 2.8
        im = crop_white(render(docs[key], page_1, scale))
        print(f"p{page_1} {'L' if landscape else 'P'}", end=" ")
        save_jpeg(im, dest)

    for doc in docs.values():
        doc.close()


if __name__ == "__main__":
    main()
