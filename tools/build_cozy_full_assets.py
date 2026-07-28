"""Build the full Cozy Academy asset family from generated chroma-key atlases."""

from collections import deque
from pathlib import Path

from PIL import Image, ImageChops, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
FULL = ROOT / "assets" / "CozyAcademy" / "Full"
SOURCES = FULL / "Sources"


def remove_connected_magenta(image: Image.Image, clear_isolated_key: bool = True) -> Image.Image:
    """Remove only magenta connected to the canvas edge, preserving purple art."""
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    width, height = rgba.size
    background = Image.new("L", rgba.size, 0)
    mask = background.load()
    queue: deque[tuple[int, int]] = deque()

    def is_key(x: int, y: int) -> bool:
        red, green, blue, _ = pixels[x, y]
        return red > 145 and blue > 105 and green < 135 and red - green > 65 and blue - green > 45

    for x in range(width):
        for y in (0, height - 1):
            if is_key(x, y) and not mask[x, y]:
                mask[x, y] = 255
                queue.append((x, y))
    for y in range(height):
        for x in (0, width - 1):
            if is_key(x, y) and not mask[x, y]:
                mask[x, y] = 255
                queue.append((x, y))

    while queue:
        x, y = queue.popleft()
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < width and 0 <= ny < height and not mask[nx, ny] and is_key(nx, ny):
                mask[nx, ny] = 255
                queue.append((nx, ny))

    feathered = background.filter(ImageFilter.GaussianBlur(0.7))
    alpha = ImageChops.darker(rgba.getchannel("A"), ImageChops.invert(feathered))
    if clear_isolated_key:
        alpha_pixels = alpha.load()
        for y in range(height):
            for x in range(width):
                if is_key(x, y):
                    alpha_pixels[x, y] = 0
    rgba.putalpha(alpha)
    return rgba


def normalized(sprite: Image.Image, visible_fill: float, canvas_size: int = 512) -> Image.Image:
    alpha_box = sprite.getchannel("A").getbbox()
    if not alpha_box:
        raise RuntimeError("Atlas cell contains no visible sprite")
    sprite = sprite.crop(alpha_box)
    extent = round(canvas_size * visible_fill)
    scale = min(extent / sprite.width, extent / sprite.height)
    size = (max(1, round(sprite.width * scale)), max(1, round(sprite.height * scale)))
    sprite = sprite.resize(size, Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    canvas.alpha_composite(sprite, ((canvas_size - size[0]) // 2, (canvas_size - size[1]) // 2))
    return canvas


def normalized_portrait(sprite: Image.Image) -> Image.Image:
    """Crop to face/upper torso so characters stay readable on narrow order cards."""
    alpha_box = sprite.getchannel("A").getbbox()
    if not alpha_box:
        raise RuntimeError("Portrait cell contains no visible character")
    left, top, right, bottom = alpha_box
    width = right - left
    height = bottom - top
    focus = sprite.crop((
        left + round(width * .12),
        top,
        right - round(width * .12),
        top + round(height * .78),
    ))
    alpha_box = focus.getchannel("A").getbbox()
    focus = focus.crop(alpha_box)
    canvas = Image.new("RGBA", (384, 512), (0, 0, 0, 0))
    scale = min(368 / focus.width, 500 / focus.height)
    size = (round(focus.width * scale), round(focus.height * scale))
    focus = focus.resize(size, Image.Resampling.LANCZOS)
    canvas.alpha_composite(focus, ((384 - size[0]) // 2, 512 - size[1]))
    return canvas


def split_atlas(
    source: str,
    names: tuple[str, ...],
    destination: str,
    fill: float,
    clear_isolated_key: bool = True,
) -> None:
    image = remove_connected_magenta(
        Image.open(SOURCES / source),
        clear_isolated_key=clear_isolated_key,
    )
    width, height = image.size
    alpha = image.getchannel("A")
    occupied = [
        alpha.crop((x, 0, x + 1, height)).getbbox() is not None
        for x in range(width)
    ]
    gaps: list[tuple[int, int]] = []
    gap_start = None
    for x, has_art in enumerate(occupied):
        if not has_art and gap_start is None:
            gap_start = x
        if has_art and gap_start is not None:
            if gap_start > 0:
                gaps.append((gap_start, x))
            gap_start = None
    internal_gaps = [
        gap for gap in gaps
        if gap[0] > width * .02 and gap[1] < width * .98
    ]
    separators = sorted(
        ((left + right) // 2 for left, right in sorted(
            internal_gaps,
            key=lambda gap: gap[1] - gap[0],
            reverse=True,
        )[:len(names) - 1])
    )
    if len(separators) != len(names) - 1:
        separators = [round(width * index / len(names)) for index in range(1, len(names))]
    bounds = [0, *separators, width]
    output = FULL / destination
    output.mkdir(parents=True, exist_ok=True)
    for index, name in enumerate(names):
        left = bounds[index]
        right = bounds[index + 1]
        cell = image.crop((left, 0, right, height))
        result = normalized(cell, fill)
        result.save(output / name, optimize=True)


def split_portraits() -> None:
    names = ("customer_derya.png", "customer_emre.png", "customer_maya.png")
    image = remove_connected_magenta(Image.open(SOURCES / "customer_atlas.png"))
    width, height = image.size
    alpha = image.getchannel("A")
    empty_columns = [
        x for x in range(width)
        if alpha.crop((x, 0, x + 1, height)).getbbox() is None
    ]
    gap_runs: list[list[int]] = []
    for x in empty_columns:
        if not gap_runs or x != gap_runs[-1][-1] + 1:
            gap_runs.append([x])
        else:
            gap_runs[-1].append(x)
    separators = sorted(
        run[len(run) // 2]
        for run in sorted(
            (run for run in gap_runs if run[0] > width * .02 and run[-1] < width * .98),
            key=len,
            reverse=True,
        )[:2]
    )
    if len(separators) != 2:
        separators = [round(width / 3), round(width * 2 / 3)]
    bounds = [0, *separators, width]
    output = FULL / "Customers"
    output.mkdir(parents=True, exist_ok=True)
    for index, name in enumerate(names):
        cell = image.crop((bounds[index], 0, bounds[index + 1], height))
        normalized_portrait(cell).save(output / name, optimize=True)


def main() -> None:
    split_atlas(
        "football_atlas.png",
        tuple(f"football_lv{level}.png" for level in range(1, 7)),
        "Items",
        .84,
    )
    split_atlas(
        "hydration_atlas.png",
        tuple(f"hydration_lv{level}.png" for level in range(1, 7)),
        "Items",
        .84,
    )
    split_atlas(
        "trophy_atlas.png",
        tuple(f"trophy_lv{level}.png" for level in range(1, 7)),
        "Items",
        .84,
    )
    split_atlas(
        "producer_atlas.png",
        ("producer_football.png", "producer_hydration.png", "producer_trophy.png"),
        "Producers",
        .92,
    )
    split_portraits()
    split_atlas(
        "ui_atlas.png",
        ("level.png", "energy.png", "coin.png", "gem.png", "storage.png", "sell.png", "info.png", "menu.png"),
        "UI",
        .86,
        clear_isolated_key=False,
    )


if __name__ == "__main__":
    main()
