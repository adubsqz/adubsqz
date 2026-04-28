#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

DEFAULT_MAP_PRIMARY="curation-map.json"
DEFAULT_MAP_FALLBACK=".tmp/recipes/curation-map.json"

MAP_PATH=""
ORIGINALS_DIR="${HOME}/originals"
REVIEW_DIR=".tmp/review"
EDITED_DIR=".tmp/edited"
LIMIT=""
MIN_EDIT_SCORE="4"
DRY_RUN=0
GIT_ADD=0
INCLUDE_SCREENSHOTS=0

usage() {
  cat <<'EOF'
Run the sellable-photo pipeline end-to-end.

Usage:
  scripts/run-sellable-pipeline.sh [options]

Options:
  --map <path>              Mapping JSON path.
                            Default: curation-map.json, fallback .tmp/recipes/curation-map.json
  --originals-dir <path>    Originals directory (default: ~/originals)
  --review-dir <path>       Review directory (default: .tmp/review)
  --edited-dir <path>       Edited directory (default: .tmp/edited)
  --limit <N>               Process first N mapping entries
  --min-edit-score <N>      Only apply recipe when score > N (default: 4)
  --dry-run                 Print actions without writing files
  --git-add                 Stage gallery outputs after success
  --include-screenshots     Forward to gallery import step
  -h, --help                Show this help

Examples:
  scripts/run-sellable-pipeline.sh --dry-run
  scripts/run-sellable-pipeline.sh --limit 25 --git-add
  scripts/run-sellable-pipeline.sh --map .tmp/recipes/curation-map.json --min-edit-score 5
EOF
}

while (($# > 0)); do
  case "$1" in
    --map)
      MAP_PATH="${2:-}"
      shift 2
      ;;
    --originals-dir)
      ORIGINALS_DIR="${2:-}"
      shift 2
      ;;
    --review-dir)
      REVIEW_DIR="${2:-}"
      shift 2
      ;;
    --edited-dir)
      EDITED_DIR="${2:-}"
      shift 2
      ;;
    --limit)
      LIMIT="${2:-}"
      shift 2
      ;;
    --min-edit-score)
      MIN_EDIT_SCORE="${2:-}"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    --git-add)
      GIT_ADD=1
      shift
      ;;
    --include-screenshots)
      INCLUDE_SCREENSHOTS=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      echo >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [[ -z "$MAP_PATH" ]]; then
  if [[ -f "$DEFAULT_MAP_PRIMARY" ]]; then
    MAP_PATH="$DEFAULT_MAP_PRIMARY"
  elif [[ -f "$DEFAULT_MAP_FALLBACK" ]]; then
    MAP_PATH="$DEFAULT_MAP_FALLBACK"
  else
    echo "No mapping file found." >&2
    echo "Looked for '$DEFAULT_MAP_PRIMARY' and '$DEFAULT_MAP_FALLBACK'." >&2
    echo "Pass --map <path> to specify one." >&2
    exit 1
  fi
fi

if [[ ! -f "$MAP_PATH" ]]; then
  echo "Mapping file not found: $MAP_PATH" >&2
  exit 1
fi

CMD=(
  node
  "scripts/curate.mjs"
  "run"
  "--map" "$MAP_PATH"
  "--originals-dir" "$ORIGINALS_DIR"
  "--review-dir" "$REVIEW_DIR"
  "--edited-dir" "$EDITED_DIR"
  "--min-edit-score" "$MIN_EDIT_SCORE"
)

if [[ -n "$LIMIT" ]]; then
  CMD+=("--limit" "$LIMIT")
fi
if [[ "$DRY_RUN" -eq 1 ]]; then
  CMD+=("--dry-run")
fi
if [[ "$GIT_ADD" -eq 1 ]]; then
  CMD+=("--git-add")
fi
if [[ "$INCLUDE_SCREENSHOTS" -eq 1 ]]; then
  CMD+=("--include-screenshots")
fi

echo "Running sellable pipeline from: $ROOT_DIR"
echo "Map: $MAP_PATH"
echo "Originals: $ORIGINALS_DIR"
echo "Review dir: $REVIEW_DIR"
echo "Edited dir: $EDITED_DIR"
echo "Command: ${CMD[*]}"
echo

"${CMD[@]}"
