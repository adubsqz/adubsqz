import pytest

from gallery.paths_publish import manifest_token, publish_file_for, staging_file_for


def test_publish_bw(tmp_path):
    repo = tmp_path / "repo"
    p = publish_file_for(repo, "bw", "a.jpg")
    assert p == repo / "public" / "photos" / "still-life" / "bw" / "a.jpg"


def test_staging_bw_mirrors_publish(tmp_path):
    repo = tmp_path / "repo"
    p = staging_file_for(repo, "bw", "a.jpg")
    assert p == repo / ".tmp" / "gallery-hitl" / "photos" / "still-life" / "bw" / "a.jpg"


def test_publish_about_root_equivalent(tmp_path):
    repo = tmp_path / "repo"
    p_sl = publish_file_for(repo, "still-life", "about_me.jpg")
    p_about = publish_file_for(repo, "about", "about_me.jpg")
    assert p_sl == repo / "public" / "photos" / "still-life" / "about_me.jpg"
    assert p_about == p_sl


def test_manifest_token():
    assert manifest_token("bw", "z.jpg") == "bw/z.jpg"
    assert manifest_token("still-life", "about.jpg") == "about.jpg"
    assert manifest_token("about", "about.jpg") == "about.jpg"


def test_invalid_bucket(tmp_path):
    with pytest.raises(ValueError, match=r"invalid bucket"):
        publish_file_for(tmp_path, "other", "a.jpg")
