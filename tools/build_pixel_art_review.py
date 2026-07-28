"""Build visual review sheets for the Champion Tour pixel-art readability pass."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets" / "ModernPixelArt"
ARTIFACTS = ROOT / "artifacts"
REFERENCE = ROOT.parents[2] / "Champion-Tour-Modern-Pixel-Art-Visual-Reference.png"


def contain(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    result = Image.new("RGB", size, "#102f3c")
    copy = image.convert("RGB")
    copy.thumbnail(size, Image.Resampling.LANCZOS)
    result.paste(copy, ((size[0] - copy.width) // 2, (size[1] - copy.height) // 2))
    return result


def title(draw: ImageDraw.ImageDraw, text: str, x: int, y: int) -> None:
    draw.text((x, y), text, fill="#fff7d2", font=ImageFont.load_default())


def build_comparison() -> None:
    reference = Image.open(REFERENCE)
    current = Image.open(ARTIFACTS / "champion-tour-readable-pixel-art-390x844.png")
    panel = Image.new("RGB", (810, 910), "#102f3c")
    panel.paste(contain(reference, (390, 844)), (10, 42))
    panel.paste(contain(current, (390, 844)), (410, 42))
    draw = ImageDraw.Draw(panel)
    title(draw, "GÖRSEL DİL REFERANSI", 10, 18)
    title(draw, "CHAMPION TOUR — 390 × 844 GERÇEK RENDER", 410, 18)
    panel.save(ARTIFACTS / "pixel-art-readability-comparison.png", optimize=True)


def build_asset_closeups() -> None:
    footballs = [
        Image.open(ASSETS / "Items" / f"football_lv{level}.png").convert("RGBA")
        for level in range(1, 7)
    ]
    producers = [
        Image.open(ASSETS / "Producers" / f"producer_{name}_v2.png").convert("RGBA")
        for name in ("football", "hydration", "training", "trophy")
    ]
    sheet = Image.new("RGBA", (768, 420), (246, 239, 201, 255))
    draw = ImageDraw.Draw(sheet)
    title(draw, "FUTBOL ZİNCİRİ — 6 AYRI SİLUET", 18, 14)
    for index, sprite in enumerate(footballs):
        tile = sprite.resize((112, 112), Image.Resampling.NEAREST)
        sheet.alpha_composite(tile, (16 + index * 124, 42))
        draw.text((55 + index * 124, 158), f"Lv{index + 1}", fill="#173f58")
    title(draw, "PRODUCERLAR — ÜRÜNÜ ÖNDEN OKUNAN 4 AYRI MAKİNE", 18, 198)
    for index, sprite in enumerate(producers):
        tile = sprite.resize((160, 160), Image.Resampling.NEAREST)
        sheet.alpha_composite(tile, (16 + index * 186, 224))
    sheet.convert("RGB").save(ARTIFACTS / "pixel-art-asset-closeups.png", optimize=True)


if __name__ == "__main__":
    ARTIFACTS.mkdir(parents=True, exist_ok=True)
    build_comparison()
    build_asset_closeups()
