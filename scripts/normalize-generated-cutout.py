from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage


def isolate_subject(image: Image.Image) -> Image.Image:
    rgb = np.asarray(image.convert("RGB"), dtype=np.int16)
    maximum = rgb.max(axis=2)
    minimum = rgb.min(axis=2)
    luminance = rgb.mean(axis=2)
    # Image generation occasionally bakes a neutral checkerboard into an RGB
    # result. Authored armor, foliage, emissives and the dark outline are much
    # more chromatic or darker than that connected backdrop.
    candidate = ((maximum - minimum) >= 15) | (luminance <= 58)
    candidate = ndimage.binary_closing(candidate, iterations=2)
    labels, count = ndimage.label(candidate)
    if count == 0:
        raise ValueError("No foreground subject found")
    height, width = candidate.shape
    center = np.zeros_like(candidate)
    center[height // 5:height * 4 // 5, width // 5:width * 4 // 5] = True
    best_label = max(
        range(1, count + 1),
        key=lambda label: np.count_nonzero(labels == label) if np.any((labels == label) & center) else 0,
    )
    mask = labels == best_label
    mask = ndimage.binary_closing(mask, iterations=3)
    mask = ndimage.binary_fill_holes(mask)
    alpha = (mask * 255).astype(np.uint8)
    rgba = np.dstack((rgb.astype(np.uint8), alpha))
    return Image.fromarray(rgba)


def normalize(source: Path, destination: Path, target_height: int, target_bottom: int) -> None:
    isolated = isolate_subject(Image.open(source))
    bbox = isolated.getchannel("A").getbbox()
    if not bbox:
        raise ValueError(f"No alpha bounds in {source}")
    subject = isolated.crop(bbox)
    scale = target_height / subject.height
    width = max(1, round(subject.width * scale))
    subject = subject.resize((width, target_height), Image.Resampling.LANCZOS)
    output = Image.new("RGBA", (384, 384), (0, 0, 0, 0))
    output.alpha_composite(subject, ((384 - width) // 2, target_bottom - target_height))
    destination.parent.mkdir(parents=True, exist_ok=True)
    output.save(destination, optimize=True)


def main() -> None:
    parser = argparse.ArgumentParser(description="Extract an ImageGen cutout and normalize it for the unified fleet canvas.")
    parser.add_argument("source", type=Path)
    parser.add_argument("destination", type=Path)
    parser.add_argument("--height", type=int, required=True)
    parser.add_argument("--bottom", type=int, required=True)
    args = parser.parse_args()
    normalize(args.source, args.destination, args.height, args.bottom)


if __name__ == "__main__":
    main()
