#!/usr/bin/env python3
"""
Stacks the same vertical slice of two screenshots, local above reference, so a
difference reported by diff-screenshots.py can be looked at directly.

    scripts/crop-compare.py <local.png> <reference.png> <top> <bottom> <out.png>
"""
import sys

from PIL import Image, ImageDraw


def main(left_path, right_path, top, bottom, out):
    top, bottom = int(top), int(bottom)
    slices = []
    for path in (left_path, right_path):
        image = Image.open(path).convert("RGB")
        slices.append(image.crop((0, top, image.size[0], min(bottom, image.size[1]))))

    width = max(part.size[0] for part in slices)
    gap = 24
    canvas = Image.new("RGB", (width, sum(part.size[1] for part in slices) + gap), "magenta")
    offset = 0
    for part in slices:
        canvas.paste(part, (0, offset))
        offset += part.size[1] + gap

    draw = ImageDraw.Draw(canvas)
    draw.text((8, 4), "LOCAL", fill="red")
    draw.text((8, slices[0].size[1] + gap + 4), "REFERENCE", fill="red")
    canvas.save(out)
    print(f"wrote {out} (y {top}-{bottom})")


if __name__ == "__main__":
    main(*sys.argv[1:6])
