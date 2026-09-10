from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageChops


PROJECTILE_NAMES = ("scout-pulse", "fighter-laser", "siege-missile", "heavy-cannon")


def content_box(image: Image.Image, threshold: int = 8) -> tuple[int, int, int, int]:
    rgb = image.convert("RGB")
    maximum = ImageChops.lighter(ImageChops.lighter(rgb.getchannel("R"), rgb.getchannel("G")), rgb.getchannel("B"))
    return maximum.point(lambda value: 255 if value > threshold else 0).getbbox() or (0, 0, image.width, image.height)


def black_to_alpha(image: Image.Image, threshold: int = 4) -> Image.Image:
    rgba = image.convert("RGBA")
    red, green, blue, _ = rgba.split()
    maximum = ImageChops.lighter(ImageChops.lighter(red, green), blue)
    alpha = maximum.point(lambda value: 0 if value <= threshold else min(255, round((value - threshold) * 255 / (255 - threshold))))
    rgba.putalpha(alpha)
    return rgba


def grid_cells(image: Image.Image, columns: int, rows: int) -> list[Image.Image]:
    cells = []
    for index in range(columns * rows):
        column, row = index % columns, index // columns
        x0, x1 = round(column * image.width / columns), round((column + 1) * image.width / columns)
        y0, y1 = round(row * image.height / rows), round((row + 1) * image.height / rows)
        cells.append(image.crop((x0, y0, x1, y1)).convert("RGB"))
    return cells


def split_projectiles(source: Path, output_directory: Path, faction: str) -> None:
    cells = grid_cells(Image.open(source), 2, 2)
    output_directory.mkdir(parents=True, exist_ok=True)
    for name, cell in zip(PROJECTILE_NAMES, cells):
        content = cell.crop(content_box(cell))
        content.thumbnail((164, 164), Image.Resampling.LANCZOS)
        output = Image.new("RGB", (192, 192), "black")
        output.paste(content, ((192 - content.width) // 2, (192 - content.height) // 2))
        output.save(output_directory / f"{faction}-{name}-v1.png", optimize=True)


def normalize_projectile(source: Path, destination: Path) -> None:
    image = black_to_alpha(Image.open(source))
    box = image.getchannel("A").point(lambda value: 255 if value > 6 else 0).getbbox()
    if not box:
        raise ValueError(f"No projectile content found in {source}")
    content = image.crop(box)
    content.thumbnail((176, 176), Image.Resampling.LANCZOS)
    output = Image.new("RGBA", (192, 192), (0, 0, 0, 0))
    output.alpha_composite(content, ((192 - content.width) // 2, (192 - content.height) // 2))
    destination.parent.mkdir(parents=True, exist_ok=True)
    output.save(destination, optimize=True)


def main() -> None:
    parser = argparse.ArgumentParser(description="Normalize generated projectile atlases and sprites.")
    subparsers = parser.add_subparsers(dest="mode", required=True)
    projectiles = subparsers.add_parser("projectiles")
    projectiles.add_argument("source", type=Path)
    projectiles.add_argument("output_directory", type=Path)
    projectiles.add_argument("faction")
    projectile_asset = subparsers.add_parser("projectile-alpha")
    projectile_asset.add_argument("source", type=Path)
    projectile_asset.add_argument("destination", type=Path)
    args = parser.parse_args()
    if args.mode == "projectiles":
        split_projectiles(args.source, args.output_directory, args.faction)
    else:
        normalize_projectile(args.source, args.destination)


if __name__ == "__main__":
    main()
