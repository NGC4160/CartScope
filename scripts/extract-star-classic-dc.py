#!/usr/bin/env python3
"""Extract Star EV Classic DC booklet plates and the Curtis 1268-5403 install sheet."""
from __future__ import annotations

from pathlib import Path

import pypdfium2 as pdfium
from PIL import Image

ROOT = Path("/workspace")
UPLOADS = Path("/home/ubuntu/.cursor/projects/workspace/uploads")
OUT = ROOT / "public" / "wiring"
OUT.mkdir(parents=True, exist_ok=True)

STAR_PDF = UPLOADS / "Star_EV_2008_Wiring__Curtis_1243-1266-1268__-_reference_for_2007_Classic_bab9.pdf"
CURTIS_PDF = UPLOADS / "Curtis_1268_Controller_Installation_Manual_0a61.pdf"

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


def page_half(im: Image.Image, side: str) -> Image.Image:
    mid = im.width // 2
    if side == "left":
        return im.crop((0, 0, mid, im.height))
    return im.crop((mid, 0, im.width, im.height))


def save_jpeg(im: Image.Image, name: str) -> None:
    dest = OUT / name
    im = fit_width(im)
    im.save(dest, "JPEG", quality=JPEG_Q, optimize=True)
    print(f"  {name:56s} {im.size[0]:4d}x{im.size[1]:4d}  {dest.stat().st_size / 1024:6.1f} KB")


def extract_booklet_half(doc: pdfium.PdfDocument, page_1: int, side: str, dest: str, scale: float) -> None:
    im = page_half(render(doc, page_1, scale), side)
    # Booklet halves are portrait pages on a landscape spread. Clockwise 90°
    # puts the printed title ("1243 Wiring Diagram") readable at the top.
    im = im.transpose(Image.Transpose.ROTATE_270)
    im = crop_white(im)
    print(f"{dest}  <-  Star 2008 booklet p{page_1} {side} half, rotate 270")
    save_jpeg(im, dest)


def extract_page(doc: pdfium.PdfDocument, page_1: int, dest: str, scale: float) -> None:
    im = crop_white(render(doc, page_1, scale))
    print(f"{dest}  <-  Curtis 1268-5403 install sheet p{page_1}")
    save_jpeg(im, dest)


def main() -> None:
    if not STAR_PDF.exists():
        raise SystemExit(f"missing {STAR_PDF}")
    if not CURTIS_PDF.exists():
        raise SystemExit(f"missing {CURTIS_PDF}")

    star = pdfium.PdfDocument(str(STAR_PDF))
    print(f"star: {STAR_PDF.name} ({len(star)} pages)")
    # PDF p1 right = printed p17 FIG.1 1243; PDF p2 left = p18 FIG.2 1266; p2 right = p19 FIG.3 1268
    extract_booklet_half(star, 1, "right", "star-classic-1243-fig1-p17.jpg", 5.0)
    extract_booklet_half(star, 2, "left", "star-classic-1266-fig2-p18.jpg", 5.0)
    extract_booklet_half(star, 2, "right", "star-classic-1268-fig3-p19.jpg", 5.0)
    star.close()

    curtis = pdfium.PdfDocument(str(CURTIS_PDF))
    print(f"curtis: {CURTIS_PDF.name} ({len(curtis)} pages)")
    extract_page(curtis, 1, "curtis-1268-5403-preinstall.jpg", 3.2)
    extract_page(curtis, 2, "curtis-1268-5403-wiring.jpg", 3.2)
    extract_page(curtis, 3, "curtis-1268-5403-pincheck-p3.jpg", 3.2)
    extract_page(curtis, 4, "curtis-1268-5403-pincheck-p4.jpg", 3.2)
    curtis.close()


if __name__ == "__main__":
    main()
