#!/usr/bin/env python3
"""Extract Jesse-binder Batch 4 wiring plates (Tracker EViS 72 V 2020)."""
from __future__ import annotations

from pathlib import Path

import pypdfium2 as pdfium
from PIL import Image

ROOT = Path("/workspace")
UPLOADS = Path("/home/ubuntu/.cursor/projects/workspace/uploads")
OUT = ROOT / "public" / "wiring"
OUT.mkdir(parents=True, exist_ok=True)

PDF = UPLOADS / "Tracker_EViS_72-Volt_2020___Electrical_62eb.pdf"

MAX_W = 3600
JPEG_Q = 84


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
    print(f"  {name:64s} {im.size[0]:4d}x{im.size[1]:4d}  {dest.stat().st_size / 1024:6.1f} KB")


# (page, dest) — 1-based PDF pages
JOBS: list[tuple[int, str]] = [
    (11, "evis-2020-fig1-main-harness-routing.jpg"),
    (12, "evis-2020-fig2-main-harness.jpg"),
    (13, "evis-2020-fig3-electrical-schematic.jpg"),
    (14, "evis-2020-fig4-electrical-schematic.jpg"),
    (23, "evis-2020-fig19-winch-contactor.jpg"),
    (57, "evis-2020-fig9-front-rear-pins.jpg"),
]


def main() -> None:
    if not PDF.exists():
        raise SystemExit(f"missing {PDF}")
    doc = pdfium.PdfDocument(str(PDF))
    for page, dest in JOBS:
        print(f"{dest}  <-  {PDF.name} p{page}")
        im = crop_white(render(doc, page, 2.2))
        save_jpeg(im, dest)


if __name__ == "__main__":
    main()
