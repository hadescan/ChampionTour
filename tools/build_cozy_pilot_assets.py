"""Normalize the supplied Cozy Academy pilot sprites by their visible alpha bounds."""

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
PILOT = ROOT / "assets" / "CozyAcademy" / "Pilot" / "Training"
SOURCES = PILOT / "Sources"
ITEMS = PILOT / "Items"
PRODUCERS = PILOT / "Producers"

ITEM_SOURCES = (
    "cone-lv1-marker-disc.png",
    "cone-lv2-small-cone.png",
    "cone-lv3-tall-cone.png",
    "cone-lv4-cone-stack.png",
    "cone-lv5-weighted-cone.png",
    "cone-lv6-training-kit.png",
)


def normalize(source: Path, destination: Path, visible_fill: float) -> None:
    image = Image.open(source).convert("RGBA")
    alpha_box = image.getchannel("A").getbbox()
    if not alpha_box:
        raise RuntimeError(f"No visible pixels in {source.name}")

    sprite = image.crop(alpha_box)
    target_extent = round(512 * visible_fill)
    scale = min(target_extent / sprite.width, target_extent / sprite.height)
    size = (round(sprite.width * scale), round(sprite.height * scale))
    sprite = sprite.resize(size, Image.Resampling.LANCZOS)

    canvas = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    x = (512 - size[0]) // 2
    y = (512 - size[1]) // 2
    canvas.alpha_composite(sprite, (x, y))
    destination.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(destination, optimize=True)


def main() -> None:
    for level, source_name in enumerate(ITEM_SOURCES, start=1):
        visible_fill = 0.72 if level == 1 else 0.84
        normalize(
            SOURCES / source_name,
            ITEMS / f"training_lv{level}.png",
            visible_fill,
        )

    normalize(
        SOURCES / "cone-producer-equipment-cart.png",
        PRODUCERS / "producer_training_cart.png",
        0.91,
    )


if __name__ == "__main__":
    main()
