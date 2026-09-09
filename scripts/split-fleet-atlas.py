from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


CELLS = {
    "scout": (0.0, 0.0, 0.5, 0.4),
    "fighter": (0.5, 0.0, 1.0, 0.4),
    "bomber": (0.0, 0.4, 0.5, 1.0),
    "frigate": (0.5, 0.4, 1.0, 1.0),
}


def export_sprite(atlas: Image.Image, normalized_box: tuple[float, float, float, float], destination: Path) -> None:
    width, height = atlas.size
    box = tuple(round(value * (width if index % 2 == 0 else height)) for index, value in enumerate(normalized_box))
    cell = atlas.crop(box)
    alpha_box = cell.getchannel("A").getbbox()
    if alpha_box is None:
        raise ValueError(f"No visible sprite content in {destination.name}")
    sprite = cell.crop(alpha_box)
    sprite.thumbnail((344, 344), Image.Resampling.LANCZOS)
    output = Image.new("RGBA", (384, 384), (0, 0, 0, 0))
    output.alpha_composite(sprite, ((384 - sprite.width) // 2, (384 - sprite.height) // 2))
    output.save(destination, optimize=True)


def main() -> None:
    parser = argparse.ArgumentParser(description="Split a transparent 2x2 fleet atlas into normalized runtime sprites.")
    parser.add_argument("atlas", type=Path)
    parser.add_argument("output_directory", type=Path)
    parser.add_argument("prefix")
    args = parser.parse_args()

    atlas = Image.open(args.atlas).convert("RGBA")
    args.output_directory.mkdir(parents=True, exist_ok=True)
    for unit_type, box in CELLS.items():
        export_sprite(atlas, box, args.output_directory / f"{args.prefix}-{unit_type}-v1.png")


if __name__ == "__main__":
    main()
