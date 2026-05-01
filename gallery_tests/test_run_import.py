import json

from gallery.manifest_store import load_manifest
from gallery.run_import import main
from gallery_tests.fixtures import write_one_pixel_png


def test_dry_run_does_not_write(tmp_path, monkeypatch):
    repo = tmp_path / "r"
    (repo / "src").mkdir(parents=True)
    monkeypatch.chdir(repo)
    monkeypatch.setenv("GALLERY_REPO_ROOT", str(repo))
    (repo / "src" / "gallery-manifest.json").write_text(
        json.dumps({"still-life": [], "bw": [], "color": []}),
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
        json.dumps({"still-life": [], "bw": [], "color": []}),
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
