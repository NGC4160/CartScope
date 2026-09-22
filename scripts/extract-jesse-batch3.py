#!/usr/bin/env python3
"""Extract Jesse-binder Batch 3 wiring plates (GEM 2013 e-Series)."""
from __future__ import annotations

from pathlib import Path

import pypdfium2 as pdfium
from PIL import Image

ROOT = Path("/workspace")
UPLOADS = Path("/home/ubuntu/.cursor/projects/workspace/uploads")
OUT = ROOT / "public" / "wiring"
OUT.mkdir(parents=True, exist_ok=True)

PDF = {
    "elec": UPLOADS / "GEM_2013_e-Series___Electrical_9899.pdf",
    "wd": UPLOADS / "GEM_2013_e-Series___Wiring_Diagrams_02a7.pdf",
}

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


def extract(pdf: Path, pages: list[int], dest: str, scale: float, crop: bool) -> None:
    doc = pdfium.PdfDocument(str(pdf))
    imgs = [render(doc, p, scale) for p in pages]
    if crop:
        imgs = [crop_white(im) for im in imgs]
    im = imgs[0]
    print(f"{dest}  <-  {pdf.name} p{pages}")
    save_jpeg(im, dest)


# (key, pages, dest, scale, crop)
JOBS: list[tuple[str, list[int], str, float, bool]] = [
    # Electrical chapter — diagrams only (not procedure prose)
    ("elec", [3], "gem-2013-electrical-system.jpg", 2.2, True),
    ("elec", [13], "gem-2013-ts-diagrams-ab.jpg", 2.2, True),
    ("elec", [14], "gem-2013-ts-diagram-c.jpg", 2.2, True),
    ("elec", [22], "gem-2013-battery-layout.jpg", 2.2, True),
    ("elec", [46], "gem-2013-psdm-connections.jpg", 2.2, True),
    # Wiring Diagrams extract 9924112 pages 5.55–5.95 (skip 5.54 abbreviation table)
    ("wd", [2], "gem-2013-power-distribution.jpg", 2.2, True),
    ("wd", [3], "gem-2013-charging.jpg", 2.2, True),
    ("wd", [4], "gem-2013-charging-e6-elxd.jpg", 2.2, True),
    ("wd", [5], "gem-2013-fast-charging.jpg", 2.2, True),
    ("wd", [6], "gem-2013-fast-charging-e6-elxd.jpg", 2.2, True),
    ("wd", [7], "gem-2013-park-brake.jpg", 2.2, True),
    ("wd", [8], "gem-2013-dcdc-converter.jpg", 2.2, True),
    ("wd", [9], "gem-2013-main-contactor.jpg", 2.2, True),
    ("wd", [10], "gem-2013-main-contactor-e6-elxd.jpg", 2.2, True),
    ("wd", [11], "gem-2013-motor-controller.jpg", 2.2, True),
    ("wd", [12], "gem-2013-display.jpg", 2.2, True),
    ("wd", [13], "gem-2013-display-2.jpg", 2.2, True),
    ("wd", [14], "gem-2013-display-3.jpg", 2.2, True),
    ("wd", [15], "gem-2013-horn-outlet.jpg", 2.2, True),
    ("wd", [16], "gem-2013-heater-defogger.jpg", 2.2, True),
    ("wd", [17], "gem-2013-dash-fan.jpg", 2.2, True),
    ("wd", [18], "gem-2013-security-light-bar.jpg", 2.2, True),
    ("wd", [19], "gem-2013-audio.jpg", 2.2, True),
    ("wd", [20], "gem-2013-front-lighting.jpg", 2.2, True),
    ("wd", [21], "gem-2013-rear-lighting.jpg", 2.2, True),
    ("wd", [22], "gem-2013-rear-lighting-2.jpg", 2.2, True),
    ("wd", [23], "gem-2013-rear-lighting-except-ny.jpg", 2.2, True),
    ("wd", [24], "gem-2013-rear-lighting-ny.jpg", 2.2, True),
    ("wd", [25], "gem-2013-turn-reminder.jpg", 2.2, True),
    ("wd", [26], "gem-2013-wiper-washer.jpg", 2.2, True),
    ("wd", [27], "gem-2013-converter-harness.jpg", 2.2, True),
    ("wd", [28], "gem-2013-converter-pins.jpg", 2.2, True),
    ("wd", [29], "gem-2013-headlight-harness.jpg", 2.2, True),
    ("wd", [30], "gem-2013-headlight-pins.jpg", 2.2, True),
    ("wd", [31], "gem-2013-front-harness.jpg", 2.2, True),
    ("wd", [32], "gem-2013-front-pins.jpg", 2.2, True),
    ("wd", [33], "gem-2013-ip-harness.jpg", 2.2, True),
    ("wd", [34], "gem-2013-ip-pins.jpg", 2.2, True),
    ("wd", [35], "gem-2013-controller-harness.jpg", 2.2, True),
    ("wd", [36], "gem-2013-controller-harness-2.jpg", 2.2, True),
    ("wd", [37], "gem-2013-controller-pins.jpg", 2.2, True),
    ("wd", [38], "gem-2013-main-harness.jpg", 2.2, True),
    ("wd", [39], "gem-2013-main-harness-2.jpg", 2.2, True),
    ("wd", [40], "gem-2013-main-pins.jpg", 2.2, True),
    ("wd", [41], "gem-2013-tail-harness.jpg", 2.2, True),
    ("wd", [42], "gem-2013-tail-pins.jpg", 2.2, True),
]


def main() -> None:
    for key, pages, dest, scale, crop in JOBS:
        pdf = PDF[key]
        if not pdf.exists():
            raise SystemExit(f"missing {pdf}")
        extract(pdf, pages, dest, scale, crop)


if __name__ == "__main__":
    main()
