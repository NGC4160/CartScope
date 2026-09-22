#!/usr/bin/env python3
"""Extract Jesse-binder Batch 2 wiring plates (Bad Boy Ambush / Recoil, Club Car DS 2000)."""
from __future__ import annotations

from pathlib import Path

import pypdfium2 as pdfium
from PIL import Image

ROOT = Path("/workspace")
UPLOADS = Path("/home/ubuntu/.cursor/projects/workspace/uploads")
OUT = ROOT / "public" / "wiring"
OUT.mkdir(parents=True, exist_ok=True)

PDF = {
    "ambush": UPLOADS / "Bad_Boy_Ambush___Electrical_3c66.pdf",
    "recoil": UPLOADS / "Bad_Boy_Recoil_iS_72V___Electrical_Service_Guide__2012__841f.pdf",
    "ds2000": UPLOADS
    / "Club_Car_DS_2000_PowerDrive_PowerDrive_Plus_and_V-Glide_36-Volt___Electrical_2537.pdf",
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
    print(f"  {name:64s} {im.size[0]:4d}x{im.size[1]:4d}  {dest.stat().st_size / 1024:6.1f} KB")


def extract(pdf: Path, pages: list[int], dest: str, scale: float, crop: bool) -> None:
    doc = pdfium.PdfDocument(str(pdf))
    imgs = [render(doc, p, scale) for p in pages]
    if crop:
        imgs = [crop_white(im) for im in imgs]
    im = imgs[0] if len(imgs) == 1 else stitch_h(imgs)
    print(f"{dest}  <-  {pdf.name} p{pages}")
    save_jpeg(im, dest)


# (key, pages, dest, scale, crop)
JOBS: list[tuple[str, list[int], str, float, bool]] = [
    # Bad Boy Ambush — genuine schematics / harness / pinouts only
    ("ambush", [26], "bb-ambush-fig2-gas-4wd.jpg", 2.2, True),
    ("ambush", [31], "bb-ambush-fig5-main-harness.jpg", 2.2, True),
    ("ambush", [32], "bb-ambush-fig6-accessory.jpg", 2.2, True),
    ("ambush", [36], "bb-ambush-fig10-electric-powertrain.jpg", 2.2, True),
    ("ambush", [79], "bb-ambush-fig22-23-pin-connectors.jpg", 2.2, True),
    # Bad Boy Recoil iS 72 V — battery layout + electrical information schematic
    # Recoil slides are not paper-white; skip aggressive crop.
    ("recoil", [47], "bb-recoil-battery-layout.jpg", 2.2, False),
    ("recoil", [82], "bb-recoil-electrical-info.jpg", 2.2, False),
    # Club Car 2000 V-Glide 36 V — gap fill vs 1995–96 Fig. 19-2 / 19-4 / 19-5
    ("ds2000", [3], "ds2000-vglide-fig11-2-speed-controller.jpg", 2.2, True),
    ("ds2000", [4], "ds2000-vglide-fig11-3-vehicle.jpg", 2.2, True),
    # Club Car 2000 PowerDrive Plus — not the 1995–96 Fig. 21-1 / Z-plug pair
    ("ds2000", [36], "ds2000-pdplus-fig11-1-schematic.jpg", 2.2, True),
    ("ds2000", [37], "ds2000-pdplus-fig11-2-schematic.jpg", 2.2, True),
    ("ds2000", [38], "ds2000-pdplus-fig11-3-diagram.jpg", 2.2, True),
    ("ds2000", [40], "ds2000-pdplus-fig11-4-23pin.jpg", 2.2, True),
    ("ds2000", [41], "ds2000-pdplus-fig11-5-obc.jpg", 2.2, True),
    ("ds2000", [42], "ds2000-pdplus-fig11-6-tow.jpg", 2.2, True),
    ("ds2000", [43], "ds2000-pdplus-fig11-7-speed.jpg", 2.2, True),
    ("ds2000", [44], "ds2000-pdplus-fig11-8-power.jpg", 2.2, True),
    ("ds2000", [45], "ds2000-pdplus-fig11-9-charge.jpg", 2.2, True),
    # Club Car 2000 PowerDrive System 48 — full vehicle maps (existing pack is pot-only)
    ("ds2000", [85], "ds2000-pd48-fig11-2-ds-villager4.jpg", 2.2, True),
    ("ds2000", [86], "ds2000-pd48-fig11-3-turf1-carryall1.jpg", 2.2, True),
    ("ds2000", [87], "ds2000-pd48-fig11-4-turf2-carryall2.jpg", 2.2, True),
    ("ds2000", [88], "ds2000-pd48-fig11-5-carryall6-transporter.jpg", 2.2, True),
    ("ds2000", [89], "ds2000-pd48-fig11-6-villager6-8.jpg", 2.2, True),
]


def main() -> None:
    for key, pages, dest, scale, crop in JOBS:
        pdf = PDF[key]
        if not pdf.exists():
            raise SystemExit(f"missing {pdf}")
        extract(pdf, pages, dest, scale, crop)


if __name__ == "__main__":
    main()
