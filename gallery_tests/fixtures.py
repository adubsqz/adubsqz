"""Tiny valid PNG fixtures for gallery tests."""

from pathlib import Path

from PIL import Image


def write_one_pixel_png(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    Image.new("RGB", (1, 1), (255, 0, 0)).save(path, format="PNG")
