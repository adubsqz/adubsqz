# Scripts Overview

This directory contains the gallery ingest, curation, and verification utilities.

## Primary workflow (current)

### 1) Curated ingest (recommended)

Use recipe-driven curation for selected originals:

```bash
# Preview
npm run curate -- run --map .tmp/recipes/curation-map.json --dry-run

# Run full flow
npm run curate -- run --map .tmp/recipes/curation-map.json
```

Use `run` for both preview and execution (no need to manually run `link`/`apply` first):

```bash
npm run curate -- run --map .tmp/recipes/curation-map.json --dry-run
npm run curate -- run --map .tmp/recipes/curation-map.json
```

`run` performs:

1. symlink selected originals into `.tmp/review`
2. apply `photo-prompt` recipes into `.tmp/edited`
3. import edited files with `--update-manifest`
4. sync `.gitignore` from manifest references
5. verify manifest files exist on disk

Edit gate behavior in `run`:

- `photo-prompt` edits are applied only when a review score is present and `score > min-edit-score`
- default threshold is `4` (`--min-edit-score` changes it)
- if score is missing or `<= threshold`, the original is passed through unchanged to import

Useful flags:

```bash
npm run curate -- run --map .tmp/recipes/curation-map.json --limit 10
npm run curate -- run --map .tmp/recipes/curation-map.json --git-add
npm run curate -- run --map .tmp/recipes/curation-map.json --min-edit-score 4
```

Mapping file shapes supported by `scripts/curate.mjs`:

```json
{
  "entries": [
    {
      "source": "balconysunset.jpg",
      "recipe": ".tmp/recipes/balconysunset.recipe.json",
      "marketScore": 7.5
    }
  ]
}
```

```json
{
  "balconysunset.jpg": ".tmp/recipes/balconysunset.recipe.json"
}
```

Recommended: add `marketScore` from your `/parallel-search` review output as `0..10`.

### Planned helper: score template generator

Planned convenience command (not implemented yet):

```bash
npm run curate -- score-template --out .tmp/recipes/curation-map.json
```

Goal: generate starter mapping entries so you can fill `marketScore` and optional `recipe` quickly before running `curate run`.

### 2) Bulk ingest from `~/originals`

Use when processing many top-level originals at once:

```bash
node scripts/process-originals-batch.mjs --dry-run --limit 20
node scripts/process-originals-batch.mjs
npm run sync:gallery-ignore
npm run verify:gallery-manifest
```

### 3) Import from prepared folder

If edited files already exist:

```bash
node scripts/process-gallery-import.mjs --input .tmp/edited --update-manifest
npm run sync:gallery-ignore
npm run verify:gallery-manifest
```

## Script index

- `curate.mjs` - orchestration entrypoint (`link`, `apply`, `run`)
- `process-originals-batch.mjs` - bulk process new top-level originals
- `process-gallery-import.mjs` - import an input folder into still-life galleries
- `verify-gallery-manifest.mjs` - ensure manifest paths exist on disk
- `prepare-gallery-assets.mjs` - process a curated hard-coded job list
- `classify-still-life.mjs` - classify still-life assets helper
- `review-semantic-categories.mjs`, `reclassify-gallery-semantic.mjs` - semantic category review tools
- `optimize-images-example.mjs` - sample sharp optimization script

## Legacy/optional utilities

These are not the default ingest path:

- `optimize_images.py` - older Python image optimizer/watermarker
- `check_new_photos.py` - compare originals vs public photos by filename
- `check_watermark.py`, `refresh_still_life.py`, Ruby categorization scripts

Use them only when you explicitly need those legacy behaviors.