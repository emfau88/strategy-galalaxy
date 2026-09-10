from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]

DERIVATIVES = {
    "assets/environment/strategy-galaxy-background-v1.png": ("assets/runtime/environment/strategy-galaxy-background-v1.png", 840),
    "assets/environment/orbital-garden-rival-sector-v1.png": ("assets/runtime/environment/orbital-garden-rival-sector-v1.png", 840),
    "assets/environment/orbital-garden-player-sector-v1.png": ("assets/runtime/environment/orbital-garden-player-sector-v1.png", 840),
    "assets/environment/twin-foundries-rival-sector-v1.png": ("assets/runtime/environment/twin-foundries-rival-sector-v1.png", 840),
    "assets/environment/twin-foundries-player-sector-v1.png": ("assets/runtime/environment/twin-foundries-player-sector-v1.png", 840),
    "assets/structures/orbital-garden-hq-v2.png": ("assets/runtime/structures/orbital-garden-hq-v2.png", 720),
    "assets/structures/orbital-garden-hq-rival-v1.png": ("assets/runtime/structures/orbital-garden-hq-rival-v1.png", 720),
    "assets/structures/orbital-garden-turret-player-v3.png": ("assets/runtime/structures/orbital-garden-turret-player-v3.png", 256),
    "assets/structures/orbital-garden-turret-rival-v3.png": ("assets/runtime/structures/orbital-garden-turret-rival-v3.png", 256),
    "assets/structures/orbital-garden-turret-head-v1.png": ("assets/runtime/structures/orbital-garden-turret-head-v1.png", 160),
    "assets/structures/orbital-sunwell-v2.png": ("assets/runtime/structures/orbital-sunwell-v2.png", 640),
    "assets/ui/orbital-command-medallion-v1.png": ("assets/runtime/ui/orbital-command-medallion-v1.png", 128),
}


def resize(source_path: Path, target_path: Path, width: int) -> None:
    with Image.open(source_path) as source:
        source.load()
        height = max(1, round(source.height * width / source.width))
        target = source.convert("RGBA").resize((width, height), Image.Resampling.LANCZOS)
        target_path.parent.mkdir(parents=True, exist_ok=True)
        target.save(target_path, format="PNG", optimize=True, compress_level=9)


for source, (target, width) in DERIVATIVES.items():
    resize(ROOT / source, ROOT / target, width)

print(f"Built {len(DERIVATIVES)} runtime image derivatives.")
