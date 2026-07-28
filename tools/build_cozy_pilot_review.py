"""Create acceptance-review images for the Cozy Academy pilot."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
PILOT = ROOT / "assets" / "CozyAcademy" / "Pilot" / "Training"
ARTIFACTS = ROOT / "artifacts"
REFERENCE = ROOT / "assets" / "CozyAcademy" / "References" / "master-gameplay-reference.png"


def contain(image: Image.Image, size: tuple[int, int], background: str) -> Image.Image:
    result = Image.new("RGB", size, background)
    copy = image.convert("RGB")
    copy.thumbnail(size, Image.Resampling.LANCZOS)
    result.paste(copy, ((size[0] - copy.width) // 2, (size[1] - copy.height) // 2))
    return result


def build_comparison() -> None:
    reference = Image.open(REFERENCE)
    current = Image.open(ARTIFACTS / "cozy-academy-pilot-390x844.png")
    canvas = Image.new("RGB", (810, 900), "#173f58")
    canvas.paste(contain(reference, (390, 844), "#173f58"), (10, 42))
    canvas.paste(contain(current, (390, 844), "#173f58"), (410, 42))
    draw = ImageDraw.Draw(canvas)
    font = ImageFont.load_default()
    draw.text((10, 16), "MASTER ART / QUALITY REFERENCE", fill="#fff3cf", font=font)
    draw.text((410, 16), "COZY PILOT / REAL 390 x 844 RENDER", fill="#fff3cf", font=font)
    canvas.save(ARTIFACTS / "cozy-academy-pilot-comparison.png", optimize=True)


def build_chain_closeup() -> None:
    names = [
        ("LEVEL 1 / MARKER DISC", PILOT / "Items" / "training_lv1.png"),
        ("LEVEL 2 / SMALL CONE", PILOT / "Items" / "training_lv2.png"),
        ("LEVEL 3 / TALL CONE", PILOT / "Items" / "training_lv3.png"),
        ("LEVEL 4 / CONE STACK", PILOT / "Items" / "training_lv4.png"),
        ("LEVEL 5 / WEIGHTED CONE", PILOT / "Items" / "training_lv5.png"),
        ("LEVEL 6 / TRAINING KIT", PILOT / "Items" / "training_lv6.png"),
        ("PRODUCER / EQUIPMENT CART", PILOT / "Producers" / "producer_training_cart.png"),
    ]
    tile_size = 512
    label_height = 44
    canvas = Image.new("RGBA", (tile_size * 4, (tile_size + label_height) * 2), (79, 159, 157, 255))
    draw = ImageDraw.Draw(canvas)
    font = ImageFont.load_default()

    for index, (label, path) in enumerate(names):
        column = index % 4
        row = index // 4
        x = column * tile_size
        y = row * (tile_size + label_height)
        cell = Image.new("RGBA", (tile_size - 20, tile_size - 20), (184, 222, 218, 255))
        cell_draw = ImageDraw.Draw(cell)
        cell_draw.rounded_rectangle(
            (2, 2, cell.width - 3, cell.height - 3),
            radius=42,
            outline=(238, 248, 230, 220),
            width=8,
        )
        sprite = Image.open(path).convert("RGBA")
        cell.alpha_composite(sprite.resize(cell.size, Image.Resampling.LANCZOS))
        canvas.alpha_composite(cell, (x + 10, y + 10))
        draw.rounded_rectangle(
            (x + 10, y + tile_size, x + tile_size - 10, y + tile_size + label_height - 7),
            radius=14,
            fill=(255, 243, 207, 255),
        )
        draw.text((x + 24, y + tile_size + 12), label, fill="#173f58", font=font)

    canvas.convert("RGB").save(ARTIFACTS / "cozy-academy-pilot-chain-closeup.png", optimize=True)


if __name__ == "__main__":
    ARTIFACTS.mkdir(parents=True, exist_ok=True)
    build_comparison()
    build_chain_closeup()
