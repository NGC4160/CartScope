#!/usr/bin/env python3
"""Extract Ryan-approved wiring plates (Express L6/S6, 2014 Precedent, Star/Sirius)."""
from __future__ import annotations

from pathlib import Path

import pypdfium2 as pdfium
from PIL import Image

ROOT = Path("/workspace")
UPLOADS = Path("/home/ubuntu/.cursor/projects/workspace/uploads")
OUT = ROOT / "public" / "wiring"
OUT.mkdir(parents=True, exist_ok=True)

PDF = {
    "l6s6": UPLOADS / "01-EZGO-Express-L6-S6-Electric-Wiring-Diagrams-SM625621_1a82.pdf",
    "prec14": UPLOADS / "03-EXTRACT-2014-Club-Car-Precedent-Wiring-Electrical-Troubleshooting_3eae.pdf",
    "star": UPLOADS / "05-Star-chassis-wiring-diagram-2007-Curtis1243-Cartaholics_3870.pdf",
    "sirius": UPLOADS / "06-EXTRACT-SIRIUS-Body-Electrical-Wiring-pages311-end_ab32.pdf",
}

MAX_W = 3600
JPEG_Q = 84


def render(doc: pdfium.PdfDocument, page_1: int, scale: float) -> Image.Image:
    return doc[page_1 - 1].render(scale=scale).to_pil().convert("RGB")


def stitch_h(images: list[Image.Image]) -> Image.Image:
    h = max(im.height for im in images)
    scaled: list[Image.Image] = []
    for im in images:
        if im.height != h:
            im = im.resize((max(1, int(im.width * h / im.height)), h), Image.Resampling.LANCZOS)
        scaled.append(im)
    canvas = Image.new("RGB", (sum(im.width for im in scaled), h), (255, 255, 255))
    x = 0
    for im in scaled:
        canvas.paste(im, (x, 0))
        x += im.width
    return canvas


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
    print(f"  {name:56s} {im.size[0]:4d}x{im.size[1]:4d}  {dest.stat().st_size / 1024:6.1f} KB")


def save_png(im: Image.Image, name: str) -> None:
    dest = OUT / name
    im = fit_width(im)
    im.save(dest, "PNG", optimize=True)
    print(f"  {name:56s} {im.size[0]:4d}x{im.size[1]:4d}  {dest.stat().st_size / 1024:6.1f} KB")


def extract(pdf: Path, pages: list[int], dest: str, scale: float, crop: bool, png: bool = False) -> None:
    doc = pdfium.PdfDocument(str(pdf))
    imgs = [render(doc, p, scale) for p in pages]
    if crop:
        imgs = [crop_white(im) for im in imgs]
    im = imgs[0] if len(imgs) == 1 else stitch_h(imgs)
    print(f"{dest}  <-  {pdf.name} p{pages}")
    (save_png if png else save_jpeg)(im, dest)


# (key, pages, dest, scale, crop, png)
JOBS: list[tuple[str, list[int], str, float, bool, bool]] = [
    # Express L6/S6 SM 625621 — Section F ESC + Section L electrical (skip rear suspension)
    ("l6s6", [10], "express-l6s6-fig8-fault-codes-fig9-connectors.jpg", 2.2, True, False),
    ("l6s6", [11], "express-l6s6-fig10-48v-wiring.jpg", 2.2, True, False),
    ("l6s6", [12], "express-l6s6-fig11-j1-diagnostics.jpg", 2.2, True, False),
    ("l6s6", [13], "express-l6s6-fig12-j1-diagnostics-cont.jpg", 2.2, True, False),
    ("l6s6", [14], "express-l6s6-fig13-j2-diagnostics.jpg", 2.2, True, False),
    ("l6s6", [15], "express-l6s6-fig14-secondary-wiring.jpg", 2.2, True, False),
    ("l6s6", [21], "express-l6s6-l-fig2-wiring.jpg", 2.2, True, False),
    ("l6s6", [24], "express-l6s6-l-fig5-ignition-fuse.jpg", 2.2, True, False),
    ("l6s6", [25], "express-l6s6-l-fig6-horn-fig7-turn-hour.jpg", 2.2, True, False),
    # 2014 Precedent Excel / PowerDrive — do not crop landscape wire maps
    ("prec14", [3], "prec14-excel-fig13-1-instrument.jpg", 2.0, False, False),
    ("prec14", [4, 5], "prec14-excel-fig13-2-accessory.jpg", 1.7, False, False),
    ("prec14", [6, 7], "prec14-excel-fig13-4-mcor3.jpg", 1.7, False, False),
    ("prec14", [9], "prec14-excel-tg1-p1.png", 2.2, False, True),
    ("prec14", [10], "prec14-excel-tg1-p2.png", 2.2, False, True),
    ("prec14", [11], "prec14-excel-tg2-p1.png", 2.2, False, True),
    ("prec14", [12], "prec14-excel-tg2-p2.png", 2.2, False, True),
    # 2014 Precedent gasoline
    ("prec14", [63, 64], "prec14-gas-fig19-1-tps.jpg", 1.7, False, False),
    ("prec14", [65, 66], "prec14-gas-fig19-3-accessory.jpg", 1.7, False, False),
    ("prec14", [67], "prec14-gas-fig19-5-instrument.jpg", 2.0, False, False),
    # 2014 Precedent ERIC
    ("prec14", [130, 131], "prec14-eric-fig28-1-main.jpg", 1.7, False, False),
    ("prec14", [132], "prec14-eric-fig28-3-instrument.jpg", 2.0, False, False),
    ("prec14", [133], "prec14-eric-fig28-4-batteries.jpg", 2.0, False, False),
    ("prec14", [134, 135], "prec14-eric-fig28-5-accessory.jpg", 1.7, False, False),
    ("prec14", [136], "prec14-eric-fig28-7-sonic.jpg", 2.0, False, False),
    ("prec14", [138], "prec14-eric-tg1-p1.png", 2.2, False, True),
    ("prec14", [139], "prec14-eric-tg1-p2.png", 2.2, False, True),
    ("prec14", [141], "prec14-eric-tg2-p1.png", 2.2, False, True),
    ("prec14", [142], "prec14-eric-tg2-p2.png", 2.2, False, True),
    # Star chassis — community Cartaholics 2007 Curtis 1243 (rotate to landscape after save)
    ("star", [1], "star-chassis-curtis1243-2007-cartaholics.jpg", 2.4, True, False),
    # Sirius factory body electrical (SM V 1.06)
    ("sirius", [4], "sirius-combination-switch-p314.jpg", 2.2, True, False),
    ("sirius", [5], "sirius-combination-switch-p315.jpg", 2.2, True, False),
    ("sirius", [6], "sirius-headlight-wiring-p316.jpg", 2.2, True, False),
    ("sirius", [7], "sirius-turn-signal-wiring-p317.jpg", 2.2, True, False),
    ("sirius", [14], "sirius-cruise-harness-p324.jpg", 2.2, True, False),
]


def main() -> None:
    for key, pages, dest, scale, crop, png in JOBS:
        pdf = PDF[key]
        if not pdf.exists():
            raise SystemExit(f"missing {pdf}")
        extract(pdf, pages, dest, scale, crop, png)
    star = OUT / "star-chassis-curtis1243-2007-cartaholics.jpg"
    im = Image.open(star)
    im.transpose(Image.Transpose.ROTATE_90).save(star, "JPEG", quality=JPEG_Q, optimize=True)
    print(f"  rotated {star.name} to landscape")


if __name__ == "__main__":
    main()
