"""One-off: build a tiny idle-loop GIF for the dorm HUD (subtle vertical bob)."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "characters" / "dorm-player.gif"


def frame(dy: int) -> Image.Image:
    w, h = 100, 128
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    dr = ImageDraw.Draw(im)
    cx = w // 2
    base = h - 18 + dy

    # legs
    dr.rectangle((cx - 20, base - 44, cx - 6, base), fill=(35, 38, 52, 255))
    dr.rectangle((cx + 6, base - 44, cx + 20, base), fill=(35, 38, 52, 255))
    # body (OSU orange)
    dr.rounded_rectangle(
        (cx - 26, base - 88, cx + 26, base - 40),
        radius=10,
        fill=(215, 63, 9, 255),
        outline=(120, 40, 5, 255),
        width=2,
    )
    # head
    dr.ellipse(
        (cx - 22, base - 118, cx + 22, base - 78),
        fill=(255, 214, 176, 255),
        outline=(110, 75, 55, 255),
        width=2,
    )
    # simple hair cap
    dr.arc((cx - 24, base - 120, cx + 24, base - 82), 200, 340, fill=(55, 45, 40, 255), width=6)
    return im


def main() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    deltas = (0, -2, 0, 2, 0, -1, 0, 1)
    frames = [frame(d) for d in deltas]
    first, *rest = frames
    first.save(
        OUT,
        save_all=True,
        append_images=rest,
        duration=180,
        loop=0,
        disposal=2,
        optimize=False,
    )
    print("Wrote", OUT)


if __name__ == "__main__":
    main()
