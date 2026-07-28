"""Generate the original Champion Tour pixel HUD/control icon family."""

from pathlib import Path
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "ModernPixelArt" / "UI"
SCALE = 4


def canvas():
    image = Image.new("RGBA", (32, 32), (0, 0, 0, 0))
    return image, ImageDraw.Draw(image)


def save(image, name):
    OUT.mkdir(parents=True, exist_ok=True)
    image.resize((128, 128), Image.Resampling.NEAREST).save(OUT / name, optimize=True)


def energy(name="energy.png"):
    image, draw = canvas()
    bolt = [(18, 2), (5, 18), (13, 18), (10, 30), (27, 11), (19, 11)]
    draw.polygon(bolt, fill="#123a63")
    draw.polygon([(18, 5), (9, 16), (16, 16), (14, 25), (23, 13), (17, 13)], fill="#42ddff")
    draw.line([(14, 15), (19, 8)], fill="#c8fbff", width=2)
    save(image, name)


def coin():
    image, draw = canvas()
    draw.ellipse((3, 5, 29, 31), fill="#9f5b12")
    draw.ellipse((3, 2, 29, 28), fill="#f0a41b", outline="#5a4015", width=2)
    draw.ellipse((7, 6, 25, 24), fill="#ffd95d", outline="#bf7414", width=2)
    draw.polygon([(16, 8), (18, 13), (23, 13), (19, 17), (20, 22), (16, 19),
                  (12, 22), (13, 17), (9, 13), (14, 13)], fill="#fff2a0")
    save(image, "coin.png")


def gem():
    image, draw = canvas()
    draw.polygon([(7, 4), (25, 4), (31, 13), (16, 30), (1, 13)], fill="#49387f")
    draw.polygon([(8, 7), (24, 7), (27, 13), (16, 26), (5, 13)], fill="#d64ed9")
    draw.polygon([(8, 7), (13, 13), (5, 13)], fill="#ff9cec")
    draw.polygon([(24, 7), (27, 13), (19, 13)], fill="#b86af1")
    draw.polygon([(13, 13), (16, 26), (19, 13)], fill="#805ae3")
    draw.rectangle((10, 8, 16, 9), fill="#ffd2ff")
    save(image, "gem.png")


def level():
    image, draw = canvas()
    draw.polygon([(16, 1), (27, 5), (30, 16), (25, 27), (16, 31),
                  (7, 27), (2, 16), (5, 5)], fill="#123a63")
    draw.polygon([(16, 4), (24, 7), (27, 16), (22, 25), (16, 28),
                  (9, 24), (5, 16), (8, 7)], fill="#75c830")
    draw.rectangle((10, 11, 22, 21), fill="#eaffc0")
    draw.rectangle((12, 9, 14, 23), fill="#eaffc0")
    draw.rectangle((18, 9, 20, 23), fill="#eaffc0")
    save(image, "sp_badge.png")


def storage():
    image, draw = canvas()
    draw.rectangle((3, 8, 29, 29), fill="#123a63")
    draw.rectangle((6, 11, 26, 26), fill="#2aa8a4")
    draw.rectangle((2, 6, 30, 12), fill="#f7e8ae")
    draw.polygon([(5, 6), (9, 2), (23, 2), (28, 6)], fill="#57d5c7")
    draw.rectangle((12, 15, 20, 19), fill="#f5b82e")
    draw.rectangle((8, 22, 24, 25), fill="#0e5872")
    save(image, "storage.png")


def sell():
    image, draw = canvas()
    draw.polygon([(3, 5), (18, 5), (30, 17), (17, 30), (3, 16)], fill="#123a63")
    draw.polygon([(6, 8), (16, 8), (26, 17), (16, 26), (6, 15)], fill="#32b8a7")
    draw.rectangle((9, 10, 12, 13), fill="#fff3c5")
    draw.ellipse((14, 14, 29, 29), fill="#f0a41b", outline="#74470e", width=2)
    draw.rectangle((20, 17, 22, 25), fill="#fff2a0")
    save(image, "sell.png")


if __name__ == "__main__":
    energy()
    energy("producer_energy.png")
    coin()
    gem()
    level()
    storage()
    sell()
