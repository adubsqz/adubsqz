from pathlib import Path

import pytest
from PIL import Image

from gallery.optimize_publish import _publish_options, burn_resize_watermark


def test_burn_respects_max_dimensions(monkeypatch, tmp_path: Path):
    monkeypatch.delenv("GALLERY_MAX_WIDTH", raising=False)
    monkeypatch.delenv("GALLERY_MAX_HEIGHT", raising=False)

    src = tmp_path / "wide.png"
    Image.new("RGB", (3200, 800), color=(200, 0, 50)).save(src)

    dst = tmp_path / "out.jpg"
    burn_resize_watermark(src, dst)

    with Image.open(dst) as img:
        assert img.size == (1500, 375)


def test_burn_skips_resize_when_already_small(monkeypatch, tmp_path: Path):
    monkeypatch.delenv("GALLERY_MAX_WIDTH", raising=False)
    monkeypatch.delenv("GALLERY_MAX_HEIGHT", raising=False)

    src = tmp_path / "small.png"
    Image.new("RGB", (120, 80), color=(10, 20, 30)).save(src)

    dst = tmp_path / "tiny.jpg"
    burn_resize_watermark(src, dst)

    with Image.open(dst) as img:
        assert img.size == (120, 80)


def test_publish_options_rejects_non_integer_env(monkeypatch):
    monkeypatch.setenv("GALLERY_MAX_WIDTH", "not-a-number")
    with pytest.raises(ValueError, match="GALLERY_MAX_WIDTH"):
        _publish_options()

