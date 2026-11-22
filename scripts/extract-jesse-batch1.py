#!/usr/bin/env python3
"""Extract Jesse-binder Batch 1 wiring plates (Tomberlin, Evolution, Yamaha YTF1, Bad Boy Curtis)."""
from __future__ import annotations

from pathlib import Path

import pypdfium2 as pdfium
from PIL import Image

ROOT = Path("/workspace")
UPLOADS = Path("/home/ubuntu/.cursor/projects/workspace/uploads")
OUT = ROOT / "public" / "wiring"
OUT.mkdir(parents=True, exist_ok=True)

PDF = {
    "tb0709": UPLOADS / "Tomberlin_EMerge_2007-2009___Electrical_a3de.pdf",
    "tbge403": UPLOADS / "Tomberlin_EMerge_2008___Wiring_GE403_Controller_3a89.pdf",
    "tb1268": UPLOADS / "Tomberlin_EMerge_2009-2014___Wiring_Curtis_1268_33ea.pdf",
    "tb1011": UPLOADS / "Tomberlin_EMerge_2010-2011___Electrical_f678.pdf",
    "tb2015": UPLOADS / "Tomberlin_EMerge_2015___Wiring_Sevcon_and_12V_e971.pdf",
    "tb2016": UPLOADS / "Tomberlin_EMerge_2016-2019___Wiring_Sevcon_and_12V_4b1a.pdf",
    "tb2018": UPLOADS / "Tomberlin_EMerge_2018___Electrical_2369.pdf",
    "tb2023": UPLOADS / "Tomberlin_EMerge_2023___Wiring_Sevcon_and_12V_67ac.pdf",
    "evoac": UPLOADS / "Evolution_Alternating-Current_Drive___Electrical_b1f0.pdf",
    "evod5": UPLOADS / "Evolution_D5___AC_System_Wiring_Diagrams_132b.pdf",
    "evots": UPLOADS / "Evolution___Touchscreen_Wiring_Diagram_e000.pdf",
    "ytf1": UPLOADS / "Yamaha_YTF1___Wiring_Diagram_b5c2.pdf",
    "bbcurtis": UPLOADS / "Bad_Boy_Buggy___Curtis_Controller_Manual_88c9.pdf",
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
    # Tomberlin EMerge — dedicated year wiring sheets
    ("tbge403", [1], "emerge-ge403-2008.jpg", 2.2, True),
    ("tb0709", [6], "emerge-0709-lighting-circuit.jpg", 2.2, True),
    ("tb1268", [1], "emerge-curtis1268-2009-2014.jpg", 2.4, True),
    ("tb1011", [7], "emerge-1011-control-circuit-9-7.jpg", 2.2, True),
    ("tb1011", [8], "emerge-1011-lighting-circuit-9-8.jpg", 2.2, True),
    ("tb2015", [1], "emerge-sevcon-2015.jpg", 2.2, True),
    ("tb2016", [1], "emerge-sevcon-2016-2019.jpg", 2.2, True),
    ("tb2018", [11], "emerge-2018-se-schematic-9-7-1.jpg", 2.2, True),
    ("tb2018", [12], "emerge-2018-ssle-schematic-9-7-2.jpg", 2.2, True),
    ("tb2023", [1], "emerge-sevcon-2023-p75.jpg", 2.2, True),
    # Evolution AC Drive electrical — 1232SE system + 35-pin (skip title / component-test photos)
    ("evoac", [15], "evo-1232se-system-diagram.jpg", 2.2, True),
    ("evoac", [16], "evo-1232se-35pin-connector.jpg", 2.2, True),
    ("evots", [1], "evo-touchscreen-wiring.jpg", 2.2, True),
    # Evolution D5 — do not crop the wide AC system spread
    ("evod5", [2], "evo-d5-ac-system-v1.jpg", 1.1, False),
    ("evod5", [3], "evo-d5-general-communication.jpg", 2.0, False),
    ("evod5", [4], "evo-d5-touch-panel-v1.jpg", 2.0, False),
    ("evod5", [5], "evo-d5-communication-soundbar.jpg", 2.0, False),
    ("evod5", [7], "evo-d5-lithium-battery-layout.jpg", 2.0, False),
    ("evod5", [8], "evo-d5-lithium-internal-circuit.jpg", 2.0, False),
    # Yamaha YTF1 — new plate (YDRA/YDRE pre-extracted pages already in catalog)
    ("ytf1", [1], "yamaha-ytf1-wiring.jpg", 2.2, True),
    # Bad Boy — Curtis 1232E/SE genuine wiring / connector pages only
    ("bbcurtis", [16], "bb-curtis-fig3-basic-wiring.jpg", 2.2, True),
    ("bbcurtis", [13], "bb-curtis-35pin-ampseal.jpg", 2.2, True),
    ("bbcurtis", [14], "bb-curtis-table2-low-power-p1.jpg", 2.2, True),
    ("bbcurtis", [15], "bb-curtis-table2-low-power-p2.jpg", 2.2, True),
    ("bbcurtis", [24], "bb-curtis-fig4-type1-throttle.jpg", 2.2, True),
    ("bbcurtis", [26], "bb-curtis-fig5-type2-throttle.jpg", 2.2, True),
    ("bbcurtis", [27], "bb-curtis-fig6-type3-throttle.jpg", 2.2, True),
]


def main() -> None:
    for key, pages, dest, scale, crop in JOBS:
        pdf = PDF[key]
        if not pdf.exists():
            raise SystemExit(f"missing {pdf}")
        extract(pdf, pages, dest, scale, crop)


if __name__ == "__main__":
    main()
