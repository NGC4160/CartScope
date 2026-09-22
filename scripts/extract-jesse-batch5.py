#!/usr/bin/env python3
"""Extract Jesse-binder Batch 5 wiring plates (EZ-GO gap-fill)."""
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
    "2five": UPLOADS / "EZ-GO_2Five___Wiring_Diagrams__pre-extracted__a7a6.pdf",
    "rxv": UPLOADS / "EZ-GO_RXV___Wiring_Diagrams__pre-extracted__6ede.pdf",
    "txt48": UPLOADS / "EZ-GO_TXT_48V___Electrical_018c.pdf",
    "fleet": UPLOADS / "EZ-GO_TXT_2014__Fleet___Electrical_1eca.pdf",
    "s4": UPLOADS / "EZ-GO_Express_S4_High_Output___Electrical_ee5e.pdf",
    "dcs": UPLOADS / "EZ-GO_TXT_1996-2001_DCS___Electrical_803f.pdf",
    "early": UPLOADS / "EZ-GO_Electric_1989-1994___Electrical_9e23.pdf",
}

# (pdf_key, page_1based, dest)
JOBS: list[tuple[str, int, str]] = [
    ("2five", 6, "2five-fig20-main-harness.jpg"),
    ("2five", 7, "2five-fig21-accessory-harness.jpg"),
    ("rxv", 1, "rxv-fig29-main-harness-2012.jpg"),
    ("rxv", 2, "rxv-fig30-main-harness-2009-2012.jpg"),
    ("rxv", 3, "rxv-fig31-main-harness-2009.jpg"),
    ("rxv", 4, "rxv-fig32-accessory-harness.jpg"),
    ("txt48", 10, "txt48-fig8-controller-connectors.jpg"),
    ("txt48", 11, "txt48-fig9-controller-wiring.jpg"),
    ("fleet", 3, "fleet2014-fig1-electrical.jpg"),
    ("fleet", 11, "fleet2014-fig10-accessory-early.jpg"),
    ("fleet", 12, "fleet2014-fig11-accessory-late.jpg"),
    ("s4", 18, "s4-fig7-48v-fault-codes.jpg"),
    ("s4", 19, "s4-fig8-j1-pins.jpg"),
    ("s4", 20, "s4-fig9-j1-pins-cont.jpg"),
    ("s4", 21, "s4-fig10-j2-pins.jpg"),
    ("s4", 22, "s4-fig11-secondary-wiring.jpg"),
    ("s4", 27, "s4-fig15-controller-wiring.jpg"),
    ("dcs", 32, "dcs-fig-g21-wiring.jpg"),
    ("dcs", 38, "dcs-fig-l3-powerwise.jpg"),
    ("dcs", 39, "dcs-fig-l4-powerwise-plus.jpg"),
    ("early", 26, "early-fig-k1-resistor.jpg"),
    ("early", 42, "early-fig-n1-solid-state.jpg"),
    ("early", 56, "early-fig-n9-wiring.jpg"),
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
    print(f"  {name:64s} {im.size[0]:4d}x{im.size[1]:4d}  {dest.stat().st_size / 1024:6.1f} KB")


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
