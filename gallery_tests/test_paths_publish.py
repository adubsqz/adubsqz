import pytest

from gallery.paths_publish import manifest_token, publish_file_for


def test_publish_bw(tmp_path):
    repo = tmp_path / "repo"
    p = publish_file_for(repo, "bw", "a.jpg")
    assert p == repo / "public" / "photos" / "still-life" / "bw" / "a.jpg"


def test_publish_still_life(tmp_path):
    repo = tmp_path / "repo"
    p = publish_file_for(repo, "still-life", "about_me.jpg")
    assert p == repo / "public" / "photos" / "still-life" / "about_me.jpg"


def test_manifest_token():
    assert manifest_token("bw", "z.jpg") == "bw/z.jpg"
    assert manifest_token("still-life", "about.jpg") == "about.jpg"


def test_invalid_bucket(tmp_path):
    with pytest.raises(ValueError, match=r"invalid bucket"):
        publish_file_for(tmp_path, "other", "a.jpg")
