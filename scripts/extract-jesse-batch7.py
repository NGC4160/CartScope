#!/usr/bin/env python3
"""Extract Jesse-binder Batch 7 wiring plates (Precedent 2015 / Carryall 295 / RXV gas)."""
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
    "prec15": UPLOADS / "Club_Car_Precedent_2015___Electrical_f559.pdf",
    "ca295": UPLOADS / "Club_Car_Carryall_295_XRT1550_2012_AWD___Electrical_8f81.pdf",
    "rxvgas": UPLOADS / "EZ-GO_RXV_Gas___Electrical_a54c.pdf",
}

# (pdf_key, page_1based, dest)
JOBS: list[tuple[str, int, str]] = [
    ("prec15", 4, "prec15-gas-fig13-1.jpg"),
    ("prec15", 5, "prec15-gas-fig13-2.jpg"),
    ("prec15", 6, "prec15-gas-fig13-3.jpg"),
    ("prec15", 7, "prec15-gas-fig13-4.jpg"),
    ("prec15", 8, "prec15-gas-fig13-5.jpg"),
    ("prec15", 103, "prec15-eric-fig21-1.jpg"),
    ("prec15", 104, "prec15-eric-fig21-2.jpg"),
    ("prec15", 105, "prec15-eric-fig21-3.jpg"),
    ("prec15", 106, "prec15-eric-fig21-4.jpg"),
    ("prec15", 160, "prec15-eric-fig24-6.jpg"),
    ("prec15", 161, "prec15-eric-fig24-7.jpg"),
    ("prec15", 185, "prec15-gas-fig27-1.jpg"),
    ("prec15", 186, "prec15-gas-fig27-2.jpg"),
    ("prec15", 187, "prec15-gas-fig27-3.jpg"),
    ("prec15", 188, "prec15-gas-fig27-4.jpg"),
    ("ca295", 8, "ca295-fig11-1.jpg"),
    ("ca295", 9, "ca295-fig11-2.jpg"),
    ("ca295", 48, "ca295-fig12-1.jpg"),
    ("ca295", 49, "ca295-fig12-2.jpg"),
    ("ca295", 50, "ca295-fig12-3.jpg"),
    ("ca295", 51, "ca295-fig12-4.jpg"),
    ("ca295", 139, "ca295-fig19-18.jpg"),
    ("ca295", 140, "ca295-fig19-19.jpg"),
    ("rxvgas", 12, "rxvgas-fig10-accessory.jpg"),
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
    for key, page, dest in JOBS:
        print(f"{dest}  <-  {PDF[key].name} p{page}")
        im = crop_white(render(docs[key], page, 2.2))
        save_jpeg(im, dest)


if __name__ == "__main__":
    main()
