"""Create the visual acceptance comparison for the Cozy Academy full theme."""

from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
REFERENCE = ROOT / "assets" / "CozyAcademy" / "References" / "master-gameplay-reference.png"
RESULT = ROOT / "artifacts" / "cozy-academy-full-390x844.png"
OUTPUT = ROOT / "artifacts" / "cozy-academy-full-comparison.png"


def fitted(source: Path, size: tuple[int, int]) -> Image.Image:
    image = Image.open(source).convert("RGB")
    image.thumbnail(size, Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", size, "#173f58")
    canvas.paste(image, ((size[0] - image.width) // 2, (size[1] - image.height) // 2))
    return canvas


def main() -> None:
    panel_size = (390, 844)
    gutter = 16
    label_height = 38
    canvas = Image.new("RGB", (panel_size[0] * 2 + gutter, panel_size[1] + label_height), "#173f58")
    canvas.paste(fitted(REFERENCE, panel_size), (0, label_height))
    canvas.paste(fitted(RESULT, panel_size), (panel_size[0] + gutter, label_height))
    draw = ImageDraw.Draw(canvas)
    draw.text((12, 12), "HEDEF REFERANS", fill="#fff3cf")
    draw.text((panel_size[0] + gutter + 12, 12), "CHAMPION TOUR", fill="#fff3cf")
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(OUTPUT, optimize=True)


if __name__ == "__main__":
    main()
