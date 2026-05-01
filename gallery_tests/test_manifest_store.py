import json

from pathlib import Path

from gallery.manifest_store import append_if_absent, load_manifest, save_manifest


def _minimal_manifest():
    return {"still-life": [], "bw": [], "color": []}


def test_manifest_key_order_stable(tmp_path, monkeypatch):
    repo = tmp_path / "r"
    (repo / "src").mkdir(parents=True)
    m = repo / "src" / "gallery-manifest.json"
    monkeypatch.setenv("GALLERY_REPO_ROOT", str(repo))
    m.write_text(json.dumps({"bw": [], "color": [], "still-life": []}), encoding="utf-8")
    save_manifest(repo, load_manifest(repo))
    text = m.read_text(encoding="utf-8")
    i_still = text.index('"still-life"')
    i_bw = text.index('"bw"')
    i_co = text.index('"color"')
    assert i_still < i_bw < i_co


def test_append_duplicate_returns_false(tmp_path, monkeypatch):
    repo = tmp_path / "r"
    (repo / "src").mkdir(parents=True)
    monkeypatch.setenv("GALLERY_REPO_ROOT", str(repo))
    save_manifest(repo, {**_minimal_manifest(), "bw": ["bw/foo.jpg"]})
    assert append_if_absent(repo, "bw", "bw/foo.jpg") is False


def test_append_new_returns_true(tmp_path, monkeypatch):
    repo = tmp_path / "r"
    (repo / "src").mkdir(parents=True)
    monkeypatch.setenv("GALLERY_REPO_ROOT", str(repo))
    save_manifest(repo, _minimal_manifest())
    assert append_if_absent(repo, "color", "color/z.png") is True
    buckets = load_manifest(repo)
    assert "color/z.png" in buckets["color"]
