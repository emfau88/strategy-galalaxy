from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageChops


PROJECTILE_NAMES = ("scout-pulse", "fighter-laser", "siege-missile", "heavy-cannon")


def content_box(image: Image.Image, threshold: int = 8) -> tuple[int, int, int, int]:
    rgb = image.convert("RGB")
    maximum = ImageChops.lighter(ImageChops.lighter(rgb.getchannel("R"), rgb.getchannel("G")), rgb.getchannel("B"))
    return maximum.point(lambda value: 255 if value > threshold else 0).getbbox() or (0, 0, image.width, image.height)


def grid_cells(image: Image.Image, columns: int, rows: int) -> list[Image.Image]:
    cells = []
    for index in range(columns * rows):
        column, row = index % columns, index // columns
        x0, x1 = round(column * image.width / columns), round((column + 1) * image.width / columns)
        y0, y1 = round(row * image.height / rows), round((row + 1) * image.height / rows)
        cells.append(image.crop((x0, y0, x1, y1)).convert("RGB"))
    return cells


def build_engine_strip(source: Path, destination: Path) -> None:
    cells = grid_cells(Image.open(source), 4, 2)
    boxes = [content_box(cell) for cell in cells]
    maximum_width = max(box[2] - box[0] for box in boxes)
    maximum_height = max(box[3] - box[1] for box in boxes)
    scale = min(112 / maximum_width, 232 / maximum_height)
    output = Image.new("RGB", (128 * 8, 256), "black")
    for index, (cell, box) in enumerate(zip(cells, boxes)):
        content = cell.crop(box)
        size = (max(1, round(content.width * scale)), max(1, round(content.height * scale)))
        content = content.resize(size, Image.Resampling.LANCZOS)
        output.paste(content, (index * 128 + (128 - content.width) // 2, 8))
    destination.parent.mkdir(parents=True, exist_ok=True)
    output.save(destination, optimize=True)


def split_projectiles(source: Path, output_directory: Path, faction: str) -> None:
    cells = grid_cells(Image.open(source), 2, 2)
    output_directory.mkdir(parents=True, exist_ok=True)
    for name, cell in zip(PROJECTILE_NAMES, cells):
        content = cell.crop(content_box(cell))
        content.thumbnail((164, 164), Image.Resampling.LANCZOS)
        output = Image.new("RGB", (192, 192), "black")
        output.paste(content, ((192 - content.width) // 2, (192 - content.height) // 2))
        output.save(output_directory / f"{faction}-{name}-v1.png", optimize=True)


def main() -> None:
    parser = argparse.ArgumentParser(description="Normalize generated 4x2 engine or 2x2 projectile atlases.")
    subparsers = parser.add_subparsers(dest="mode", required=True)
    engine = subparsers.add_parser("engine")
    engine.add_argument("source", type=Path)
    engine.add_argument("destination", type=Path)
    projectiles = subparsers.add_parser("projectiles")
    projectiles.add_argument("source", type=Path)
    projectiles.add_argument("output_directory", type=Path)
    projectiles.add_argument("faction")
    args = parser.parse_args()
    if args.mode == "engine":
        build_engine_strip(args.source, args.destination)
    else:
        split_projectiles(args.source, args.output_directory, args.faction)


if __name__ == "__main__":
    main()
