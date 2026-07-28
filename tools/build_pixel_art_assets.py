"""Build transparent, grid-safe Champion Tour sprites from generated category atlases."""

from pathlib import Path
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "assets" / "ModernPixelArt" / "Sources"
ITEM_DIR = ROOT / "assets" / "ModernPixelArt" / "Items"
PRODUCER_DIR = ROOT / "assets" / "ModernPixelArt" / "Producers"
CUSTOMER_DIR = ROOT / "assets" / "ModernPixelArt" / "Customers"


def remove_magenta(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            red, green, blue, _ = pixels[x, y]
            distance = ((255 - red) ** 2 + green**2 + (255 - blue) ** 2) ** 0.5
            is_magenta_edge = red > 190 and blue > 190 and green < 130
            alpha = 0 if distance < 74 or is_magenta_edge else 255
            pixels[x, y] = (red, green, blue, alpha)
    return rgba


def clear_atlas_gutters(image: Image.Image) -> Image.Image:
    """Remove neighboring-sprite fragments that touch atlas cell gutters."""
    rgba = image.copy()
    gutter = max(2, round(rgba.width * 0.035))
    alpha = rgba.getchannel("A")
    alpha.paste(0, (0, 0, gutter, rgba.height))
    alpha.paste(0, (rgba.width - gutter, 0, rgba.width, rgba.height))
    rgba.putalpha(alpha)
    return rgba


def export_atlas(
    source_name: str,
    names: list[str],
    destination: Path,
    target: int,
    clear_gutters: bool = False,
) -> None:
    source = Image.open(SOURCE_DIR / source_name).convert("RGBA")
    destination.mkdir(parents=True, exist_ok=True)
    cell_width = source.width / len(names)
    for index, name in enumerate(names):
        left = round(index * cell_width)
        right = round((index + 1) * cell_width)
        sprite = remove_magenta(source.crop((left, 0, right, source.height)))
        if clear_gutters:
            sprite = clear_atlas_gutters(sprite)
        alpha_box = sprite.getchannel("A").getbbox()
        if not alpha_box:
            raise RuntimeError(f"No visible sprite found for {name}")
        sprite = sprite.crop(alpha_box)
        scale = min((target - 24) / sprite.width, (target - 24) / sprite.height)
        size = (max(1, round(sprite.width * scale)), max(1, round(sprite.height * scale)))
        sprite = sprite.resize(size, Image.Resampling.NEAREST)
        canvas = Image.new("RGBA", (target, target), (0, 0, 0, 0))
        canvas.alpha_composite(sprite, ((target - size[0]) // 2, (target - size[1]) // 2))
        canvas.save(destination / f"{name}.png", optimize=True)


def main() -> None:
    export_atlas(
        "football_atlas_v2.png",
        [f"football_lv{level}" for level in range(1, 7)],
        ITEM_DIR,
        256,
        clear_gutters=True,
    )
    export_atlas(
        "hydration_atlas.png",
        [f"hydration_lv{level}" for level in range(1, 7)],
        ITEM_DIR,
        256,
    )
    export_atlas(
        "training_atlas.png",
        [f"training_lv{level}" for level in range(1, 7)],
        ITEM_DIR,
        256,
    )
    export_atlas(
        "trophy_atlas.png",
        [f"trophy_lv{level}" for level in range(1, 7)],
        ITEM_DIR,
        256,
    )
    export_atlas(
        "producer_atlas_v2.png",
        ["producer_football_v2", "producer_hydration_v2", "producer_training_v2", "producer_trophy_v2"],
        PRODUCER_DIR,
        320,
        clear_gutters=True,
    )
    export_atlas(
        "customer_atlas.png",
        ["customer_coach", "customer_player", "customer_scout"],
        CUSTOMER_DIR,
        256,
    )


if __name__ == "__main__":
    main()
