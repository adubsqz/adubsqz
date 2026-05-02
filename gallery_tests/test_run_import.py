import json

from gallery.manifest_store import load_manifest
from gallery.run_import import main
from gallery_tests.fixtures import write_one_pixel_png


def test_import_resolves_tilde_home_in_source(tmp_path, monkeypatch):
    monkeypatch.setenv("HOME", str(tmp_path))
    repo = tmp_path / "r"
    (repo / "src").mkdir(parents=True)
    monkeypatch.chdir(repo)
    monkeypatch.setenv("GALLERY_REPO_ROOT", str(repo))
    (repo / "src" / "gallery-manifest.json").write_text(
        json.dumps({"about": [], "bw": [], "color": []}),
        encoding="utf-8",
    )
    inbox = tmp_path / "staging"
    inbox.mkdir(parents=True)
    pix = inbox / "x.png"
    write_one_pixel_png(pix)
    mfile = repo / "map.json"
    mfile.write_text(
        json.dumps(
            {
                "entries": [
                    {"source": "~/staging/x.png", "bucket": "bw", "link_mode": "copy"},
                ]
            }
        ),
        encoding="utf-8",
    )
    assert main(["--map", str(mfile)]) == 0
    pub = repo / "public/photos/still-life/bw/x.png"
    assert pub.is_file()


def test_dry_run_does_not_write(tmp_path, monkeypatch):
    repo = tmp_path / "r"
    (repo / "src").mkdir(parents=True)
    monkeypatch.chdir(repo)
    monkeypatch.setenv("GALLERY_REPO_ROOT", str(repo))
    (repo / "src" / "gallery-manifest.json").write_text(
        json.dumps({"about": [], "bw": [], "color": []}),
        encoding="utf-8",
    )
    pix = repo / "in.png"
    write_one_pixel_png(pix)
    mfile = repo / "map.json"
    mfile.write_text(
        json.dumps(
            {
                "entries": [
                    {"source": str(pix), "bucket": "bw", "link_mode": "copy"},
                ]
            }
        ),
        encoding="utf-8",
    )
    assert main(["--map", str(mfile), "--dry-run"]) == 0
    assert not (repo / "public").exists()


def test_import_copy_updates_manifest(tmp_path, monkeypatch):
    repo = tmp_path / "r"
    (repo / "src").mkdir(parents=True)
    monkeypatch.chdir(repo)
    monkeypatch.setenv("GALLERY_REPO_ROOT", str(repo))
    (repo / "src" / "gallery-manifest.json").write_text(
        json.dumps({"about": [], "bw": [], "color": []}),
        encoding="utf-8",
    )
    pix = repo / "in.png"
    write_one_pixel_png(pix)
    mfile = repo / "map.json"
    mfile.write_text(
        json.dumps(
            {
                "entries": [
                    {"source": str(pix), "bucket": "bw", "link_mode": "copy"},
                ]
            }
        ),
        encoding="utf-8",
    )
    assert main(["--map", str(mfile)]) == 0
    pub = repo / "public/photos/still-life/bw/in.png"
    assert pub.is_file()
    buckets = load_manifest(repo)
    assert "bw/in.png" in buckets["bw"]


def test_symlink_materializes_when_artifact_under_tmp(tmp_path, monkeypatch):
    repo = tmp_path / "r"
    (repo / "src").mkdir(parents=True)
    monkeypatch.chdir(repo)
    monkeypatch.setenv("GALLERY_REPO_ROOT", str(repo))
    (repo / "src" / "gallery-manifest.json").write_text(
        json.dumps({"about": [], "bw": [], "color": []}),
        encoding="utf-8",
    )
    pix = repo / "in.png"
    write_one_pixel_png(pix)
    mfile = repo / "map.json"
    mfile.write_text(
        json.dumps(
            {
                "entries": [
                    {"source": str(pix), "bucket": "bw", "link_mode": "symlink"},
                ]
            }
        ),
        encoding="utf-8",
    )
    assert main(["--map", str(mfile)]) == 0
    pub = repo / "public/photos/still-life/bw/in.png"
    assert pub.is_file()
    assert not pub.is_symlink()


def test_import_twice_fails_without_replace_then_replaces(tmp_path, monkeypatch):
    repo = tmp_path / "r"
    (repo / "src").mkdir(parents=True)
    monkeypatch.chdir(repo)
    monkeypatch.setenv("GALLERY_REPO_ROOT", str(repo))
    (repo / "src" / "gallery-manifest.json").write_text(
        json.dumps({"about": [], "bw": [], "color": []}),
        encoding="utf-8",
    )
    pix = repo / "in.png"
    write_one_pixel_png(pix)
    mfile = repo / "map.json"
    mfile.write_text(
        json.dumps(
            {
                "entries": [
                    {"source": str(pix), "bucket": "bw", "link_mode": "copy"},
                ]
            }
        ),
        encoding="utf-8",
    )
    assert main(["--map", str(mfile)]) == 0
    assert main(["--map", str(mfile)]) == 1
    assert main(["--map", str(mfile), "--replace"]) == 0
    assert (repo / "public/photos/still-life/bw/in.png").is_file()
