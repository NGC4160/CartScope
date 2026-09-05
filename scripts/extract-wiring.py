#!/usr/bin/env python3
"""Extract factory wiring sheets from attached OEM manuals into public/wiring/.

Re-run after adding a manual: edit JOBS below, then
  python3 scripts/extract-wiring.py
and register the new ids in src/data/wiring.ts.
"""
from __future__ import annotations

from pathlib import Path

import pypdfium2 as pdfium
from PIL import Image

ROOT = Path("/workspace")
ATTACH = ROOT / "attachments"
OUT = ROOT / "public" / "wiring"
OUT.mkdir(parents=True, exist_ok=True)

MAX_W = 3600
JPEG_Q = 84


def render(doc: pdfium.PdfDocument, page_1: int, scale: float) -> Image.Image:
    page = doc[page_1 - 1]
    return page.render(scale=scale).to_pil().convert("RGB")


def stitch_h(images: list[Image.Image]) -> Image.Image:
    h = max(im.height for im in images)
    scaled: list[Image.Image] = []
    for im in images:
        if im.height != h:
            im = im.resize((max(1, int(im.width * h / im.height)), h), Image.Resampling.LANCZOS)
        scaled.append(im)
    w = sum(im.width for im in scaled)
    canvas = Image.new("RGB", (w, h), (255, 255, 255))
    x = 0
    for im in scaled:
        canvas.paste(im, (x, 0))
        x += im.width
    return canvas


def fit_width(im: Image.Image, max_w: int = MAX_W) -> Image.Image:
    if im.width <= max_w:
        return im
    nh = max(1, int(im.height * max_w / im.width))
    return im.resize((max_w, nh), Image.Resampling.LANCZOS)


def save(im: Image.Image, name: str) -> None:
    dest = OUT / name
    im = fit_width(im)
    im.save(dest, "JPEG", quality=JPEG_Q, optimize=True)
    print(f"  {name:28s} {im.size[0]:4d}x{im.size[1]:4d}  {dest.stat().st_size/1024:6.1f} KB")


def crop_white(im: Image.Image, threshold: int = 248, pad: int = 16) -> Image.Image:
    gray = im.convert("L")
    mask = gray.point(lambda x: 255 if x < threshold else 0)
    bbox = mask.getbbox()
    if not bbox:
        return im
    l, t, r, b = bbox
    l = max(0, l - pad)
    t = max(0, t - pad)
    r = min(im.width, r + pad)
    b = min(im.height, b + pad)
    return im.crop((l, t, r, b))


def extract_pages(pdf: Path, pages: list[int], dest: str, scale: float, crop: bool) -> None:
    doc = pdfium.PdfDocument(str(pdf))
    imgs = [render(doc, p, scale) for p in pages]
    if crop:
        imgs = [crop_white(im) for im in imgs]
    save(imgs[0] if len(imgs) == 1 else stitch_h(imgs), dest)


# (pdf, pages, dest, scale, crop_whitespace)
JOBS: list[tuple[str, list[int], str, float, bool]] = [
    # 36 V PDS — Electrical System (section I). Previous pages were TOC.
    ("EZGo 36v Technicians Repair Manual.pdf", [51], "pds36-1.jpg", 2.2, True),
    ("EZGo 36v Technicians Repair Manual.pdf", [52], "pds36-2.jpg", 2.2, True),
    ("EZGo 36v Technicians Repair Manual.pdf", [54], "pds36-3.jpg", 2.2, True),
    ("EZGo 36v Technicians Repair Manual.pdf", [64], "pds36-4.jpg", 2.2, True),
    ("EZGo 36v Technicians Repair Manual.pdf", [65], "pds36-5.jpg", 2.2, True),
    ("EZGo 36v Technicians Repair Manual.pdf", [72], "pds36-charger.jpg", 2.2, True),
    # Tempo 2021 §12 battery + §32 two-page landscape harness spreads (do not crop — thin traces)
    (
        "2021 Tempo, Tempo Connect, And Tempo 2+2 (Gasoline And Electric) Maintenance And Service Manual - 86753090024.pdf",
        [231],
        "tempo-battery.jpg",
        2.0,
        False,
    ),
    (
        "2021 Tempo, Tempo Connect, And Tempo 2+2 (Gasoline And Electric) Maintenance And Service Manual - 86753090024.pdf",
        [745, 746],
        "tempo-kohler-engine.jpg",
        1.7,
        False,
    ),
    (
        "2021 Tempo, Tempo Connect, And Tempo 2+2 (Gasoline And Electric) Maintenance And Service Manual - 86753090024.pdf",
        [747, 748],
        "tempo-kohler-main.jpg",
        1.7,
        False,
    ),
    (
        "2021 Tempo, Tempo Connect, And Tempo 2+2 (Gasoline And Electric) Maintenance And Service Manual - 86753090024.pdf",
        [749, 750],
        "tempo-kohler-dash.jpg",
        1.7,
        False,
    ),
    (
        "2021 Tempo, Tempo Connect, And Tempo 2+2 (Gasoline And Electric) Maintenance And Service Manual - 86753090024.pdf",
        [753, 754],
        "tempo-ex40-main.jpg",
        1.7,
        False,
    ),
    (
        "2021 Tempo, Tempo Connect, And Tempo 2+2 (Gasoline And Electric) Maintenance And Service Manual - 86753090024.pdf",
        [755, 756],
        "tempo-ex40-dash.jpg",
        1.7,
        False,
    ),
    (
        "2021 Tempo, Tempo Connect, And Tempo 2+2 (Gasoline And Electric) Maintenance And Service Manual - 86753090024.pdf",
        [757, 758],
        "tempo-ex40-engine.jpg",
        1.7,
        False,
    ),
    (
        "2021 Tempo, Tempo Connect, And Tempo 2+2 (Gasoline And Electric) Maintenance And Service Manual - 86753090024.pdf",
        [759, 760],
        "tempo-e-main.jpg",
        1.7,
        False,
    ),
    (
        "2021 Tempo, Tempo Connect, And Tempo 2+2 (Gasoline And Electric) Maintenance And Service Manual - 86753090024.pdf",
        [761, 762],
        "tempo-e-4p.jpg",
        1.7,
        False,
    ),
    (
        "2021 Tempo, Tempo Connect, And Tempo 2+2 (Gasoline And Electric) Maintenance And Service Manual - 86753090024.pdf",
        [763, 764],
        "tempo-e-dash.jpg",
        1.7,
        False,
    ),
    (
        "2021 Tempo, Tempo Connect, And Tempo 2+2 (Gasoline And Electric) Maintenance And Service Manual - 86753090024.pdf",
        [765, 766],
        "tempo-e-lights.jpg",
        1.7,
        False,
    ),
    # Marathon 4-cycle electrical
    ("ezgo-marathon-91-92-93-94-95-96-4cycle-service-manual.pdf", [80], "marathon-direction.jpg", 2.2, True),
    ("ezgo-marathon-91-92-93-94-95-96-4cycle-service-manual.pdf", [85], "marathon-solenoid.jpg", 2.2, True),
    ("ezgo-marathon-91-92-93-94-95-96-4cycle-service-manual.pdf", [90], "marathon-solenoid-2.jpg", 2.2, True),
    ("ezgo-marathon-91-92-93-94-95-96-4cycle-service-manual.pdf", [141], "marathon-horn-e.jpg", 2.2, True),
    ("ezgo-marathon-91-92-93-94-95-96-4cycle-service-manual.pdf", [142], "marathon-horn-g.jpg", 2.2, True),
]


def main() -> None:
    for pdf_name, pages, dest, scale, crop in JOBS:
        pdf = ATTACH / pdf_name
        if not pdf.exists():
            raise SystemExit(f"missing {pdf}")
        print(f"{dest}  <-  {pdf_name} p{pages}")
        extract_pages(pdf, pages, dest, scale, crop)


if __name__ == "__main__":
    main()
