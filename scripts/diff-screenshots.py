#!/usr/bin/env python3
"""
Compares two screenshots pixel by pixel and reports where they differ.

Prints the overall difference and the worst 100px bands so a remaining visual
difference can be located, and writes a heat map next to the first image.
"""
import sys
from pathlib import Path

from PIL import Image, ImageChops

# Anti-aliasing and JPEG artefacts differ slightly between renders of identical
# markup; only channel differences above this are treated as a real difference.
THRESHOLD = 24
BAND = 100


def main(left_path, right_path):
    left = Image.open(left_path).convert("RGB")
    right = Image.open(right_path).convert("RGB")

    print(f"{Path(left_path).name}: {left.size[0]}x{left.size[1]}")
    print(f"{Path(right_path).name}: {right.size[0]}x{right.size[1]}")

    width = min(left.size[0], right.size[0])
    height = min(left.size[1], right.size[1])
    left = left.crop((0, 0, width, height))
    right = right.crop((0, 0, width, height))

    difference = ImageChops.difference(left, right).convert("L").point(
        lambda value: 255 if value > THRESHOLD else 0
    )

    total = width * height
    changed = sum(difference.histogram()[1:])
    print(f"differing pixels: {changed} / {total} ({changed / total:.3%})")

    rows = []
    for top in range(0, height, BAND):
        band = difference.crop((0, top, width, min(top + BAND, height)))
        count = sum(band.histogram()[1:])
        if count:
            rows.append((count, top))
    for count, top in sorted(rows, reverse=True)[:12]:
        band_pixels = width * min(BAND, height - top)
        print(f"  y {top:>5}-{min(top + BAND, height):<5} {count:>8} px ({count / band_pixels:.2%})")

    out = Path(left_path).with_name(f"{Path(left_path).stem}-diff.png")
    difference.save(out)
    print(f"heat map: {out}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
