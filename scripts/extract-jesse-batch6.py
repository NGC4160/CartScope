#!/usr/bin/env python3
"""Extract Jesse-binder Batch 6 wiring plates (Club Car / EZ-GO gas gap-fill)."""
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
    "ds2003": UPLOADS / "Club_Car_DS_2003___Electrical_2776.pdf",
    "prec08": UPLOADS / "Club_Car_Precedent_2008___Electrical_3222.pdf",
    "prec09": UPLOADS / "Club_Car_Precedent_2009-2011___Electrical_7de8.pdf",
    "prec17": UPLOADS / "Club_Car_Precedent_2017___Electrical_fc0c.pdf",
    "ezgas07": UPLOADS / "EZ-GO_Gas_2007___Electrical_9e43.pdf",
    "marathon": UPLOADS / "EZ-GO_Marathon_1991-1996_4-Cycle___Electrical_5379.pdf",
}

# (pdf_key, page_1based, dest)
JOBS: list[tuple[str, int, str]] = [
    ("ds2003", 3, "ds2003-fig11-1-obc.jpg"),
    ("ds2003", 5, "ds2003-fig11-2-speed.jpg"),
    ("ds2003", 7, "ds2003-fig11-3-towrun.jpg"),
    ("ds2003", 8, "ds2003-fig11-4-power.jpg"),
    ("ds2003", 9, "ds2003-fig11-5-charge.jpg"),
    ("ds2003", 10, "ds2003-fig11-6-wiring.jpg"),
    ("prec08", 2, "prec08-iq-fig11-1.jpg"),
    ("prec08", 3, "prec08-iq-fig11-2.jpg"),
    ("prec08", 42, "prec08-excel-fig12-1.jpg"),
    ("prec08", 43, "prec08-excel-fig12-2.jpg"),
    ("prec09", 2, "prec09-iq-tps-fig11-1.jpg"),
    ("prec09", 3, "prec09-iq-tps-fig11-2.jpg"),
    ("prec09", 36, "prec09-iq-mcor-fig12-1.jpg"),
    ("prec09", 37, "prec09-iq-mcor-fig12-2.jpg"),
    ("prec09", 82, "prec09-excel-tps-fig13-4.jpg"),
    ("prec09", 83, "prec09-excel-tps-fig13-5.jpg"),
    ("prec09", 116, "prec09-excel-mcor-fig14-4.jpg"),
    ("prec09", 117, "prec09-excel-mcor-fig14-5.jpg"),
    ("prec17", 34, "prec17-eric-fig12-1.jpg"),
    ("prec17", 35, "prec17-eric-fig12-2.jpg"),
    ("prec17", 36, "prec17-eric-fig12-3.jpg"),
    ("prec17", 37, "prec17-eric-fig12-4.jpg"),
    ("prec17", 120, "prec17-gas-fig18-1.jpg"),
    ("prec17", 121, "prec17-gas-fig18-2.jpg"),
    ("prec17", 122, "prec17-gas-fig18-3.jpg"),
    ("prec17", 123, "prec17-gas-fig18-4.jpg"),
    ("ezgas07", 12, "ezgas-2007-fig9-accessory.jpg"),
    ("marathon", 2, "marathon-fig-l1-electrical.jpg"),
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
