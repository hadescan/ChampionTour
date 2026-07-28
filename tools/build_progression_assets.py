"""Build Producer Progression and L7-L12 Cozy Academy sprites."""

from pathlib import Path

from PIL import Image

from build_cozy_full_assets import normalized, remove_connected_magenta


ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "assets" / "CozyAcademy" / "Progression"
SOURCES = BASE / "Sources"
ITEMS = BASE / "Items"
PRODUCERS = BASE / "Producers"


def keep_largest_alpha_component(image: Image.Image) -> Image.Image:
    """Remove disconnected atlas dividers while preserving the main sprite."""
    rgba = image.convert("RGBA")
    alpha = rgba.getchannel("A")
    width, height = rgba.size
    visible = alpha.load()
    seen = set()
    components = []
    for y in range(height):
        for x in range(width):
            if visible[x, y] < 18 or (x, y) in seen:
                continue
            stack = [(x, y)]
            seen.add((x, y))
            component = []
            while stack:
                point = stack.pop()
                component.append(point)
                px, py = point
                for nx, ny in ((px - 1, py), (px + 1, py), (px, py - 1), (px, py + 1)):
                    if (
                        0 <= nx < width and 0 <= ny < height and
                        visible[nx, ny] >= 18 and (nx, ny) not in seen
                    ):
                        seen.add((nx, ny))
                        stack.append((nx, ny))
            components.append(component)
    if not components:
        return rgba
    keep = set(max(components, key=len))
    pixels = rgba.load()
    for y in range(height):
        for x in range(width):
            if (x, y) not in keep:
                pixels[x, y] = (0, 0, 0, 0)
    return rgba


def split_row(source_name: str, prefix: str, inset: float = .02) -> None:
    image = remove_connected_magenta(Image.open(SOURCES / source_name))
    width, height = image.size
    ITEMS.mkdir(parents=True, exist_ok=True)
    for index, level in enumerate(range(7, 13)):
        left = round(index * width / 6)
        right = round((index + 1) * width / 6)
        cell_width = right - left
        crop_x = round(cell_width * inset)
        crop_y = round(height * inset)
        cell = image.crop((left + crop_x, crop_y, right - crop_x, height - crop_y))
        if prefix == "football":
            cell = keep_largest_alpha_component(cell)
        normalized(cell, .86).save(ITEMS / f"{prefix}_lv{level}.png", optimize=True)


def split_producers() -> None:
    image = remove_connected_magenta(Image.open(SOURCES / "producer_progression_atlas.png"))
    width, height = image.size
    names = (
        "producer_football_lv2.png",
        "producer_football_lv3.png",
        "producer_jersey_lv1.png",
        "producer_training_lv2.png",
        "producer_training_lv3.png",
        "producer_hydration_lv2.png",
        "producer_hydration_lv3.png",
        "producer_trophy_lv2.png",
        "producer_trophy_lv3.png",
    )
    PRODUCERS.mkdir(parents=True, exist_ok=True)
    for index, name in enumerate(names):
        row, column = divmod(index, 3)
        cell = image.crop((
            round(column * width / 3),
            round(row * height / 3),
            round((column + 1) * width / 3),
            round((row + 1) * height / 3),
        ))
        normalized(cell, .92).save(PRODUCERS / name, optimize=True)


def main() -> None:
    split_row("football_advanced_atlas.png", "football", inset=.12)
    split_row("hydration_advanced_atlas.png", "hydration")
    split_row("training_advanced_atlas.png", "training")
    split_row("trophy_advanced_atlas.png", "trophy")
    split_producers()


if __name__ == "__main__":
    main()
