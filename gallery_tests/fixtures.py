"""Tiny valid PNG fixtures for gallery tests."""

import base64
from pathlib import Path

_ONE_PX_PNG = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z/C/"
    "HwAHggJ/PchI7wAAAABJRU5ErkJggg=="
)


def write_one_pixel_png(path: Path) -> None:
    path.write_bytes(_ONE_PX_PNG)
