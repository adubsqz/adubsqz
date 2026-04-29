#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

PROVIDER="auto"
MIN_SCORE="6.5"
MIN_EDIT_SCORE="4"
LIMIT=""
DRY_RUN=0
SKIP_SCORE=0
SKIP_PIPELINE=0
RETRY_FAILED=1
GIT_ADD=0

usage() {
  cat <<'EOF'
Orchestrate sellability flow end-to-end:
  score -> curation-map -> conditional edit/import pipeline

Usage:
  scripts/orchestrate-sellable.sh [options]

Options:
  --provider <mode>       auto | gemini | local (default: auto)
  --min-score <N>         Include in curation map if score >= N (default: 6.5)
  --min-edit-score <N>    In pipeline, edit only if score > N (default: 4)
  --limit <N>             Process only first N discovered images
  --no-retry-failed       Resume report but keep prior failed rows untouched
  --skip-score            Reuse existing curation-map.json; run pipeline only
  --skip-pipeline         Score/map only; do not import pipeline
  --git-add               Stage gallery outputs in pipeline step
  --dry-run               Dry-run both steps
  -h, --help              Show help

Examples:
  scripts/orchestrate-sellable.sh --provider auto --limit 300
  scripts/orchestrate-sellable.sh --provider local --dry-run
  scripts/orchestrate-sellable.sh --skip-score --git-add
EOF
}

while (($# > 0)); do
  case "$1" in
    --provider) PROVIDER="${2:-auto}"; shift 2 ;;
    --min-score) MIN_SCORE="${2:-6.5}"; shift 2 ;;
    --min-edit-score) MIN_EDIT_SCORE="${2:-4}"; shift 2 ;;
    --limit) LIMIT="${2:-}"; shift 2 ;;
    --no-retry-failed) RETRY_FAILED=0; shift ;;
    --skip-score) SKIP_SCORE=1; shift ;;
    --skip-pipeline) SKIP_PIPELINE=1; shift ;;
    --git-add) GIT_ADD=1; shift ;;
    --dry-run) DRY_RUN=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *)
      echo "Unknown option: $1" >&2
      echo >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [[ "$SKIP_SCORE" -eq 0 ]]; then
  SCORE_CMD=(node "scripts/score-sellable.mjs" "--provider" "$PROVIDER" "--min-score" "$MIN_SCORE")
  if [[ -n "$LIMIT" ]]; then
    SCORE_CMD+=("--limit" "$LIMIT")
  fi
  if [[ "$RETRY_FAILED" -eq 1 ]]; then
    SCORE_CMD+=("--retry-failed")
  fi
  if [[ "$DRY_RUN" -eq 1 ]]; then
    SCORE_CMD+=("--dry-run")
  fi

  echo "== Step 1: score + map =="
  echo "Command: ${SCORE_CMD[*]}"
  echo
  "${SCORE_CMD[@]}"
fi

if [[ "$SKIP_PIPELINE" -eq 0 ]]; then
  PIPE_CMD=("scripts/run-sellable-pipeline.sh" "--map" "curation-map.json" "--min-edit-score" "$MIN_EDIT_SCORE")
  if [[ -n "$LIMIT" ]]; then
    PIPE_CMD+=("--limit" "$LIMIT")
  fi
  if [[ "$GIT_ADD" -eq 1 ]]; then
    PIPE_CMD+=("--git-add")
  fi
  if [[ "$DRY_RUN" -eq 1 ]]; then
    PIPE_CMD+=("--dry-run")
  fi

  echo
  echo "== Step 2: conditional edit/import pipeline =="
  echo "Command: ${PIPE_CMD[*]}"
  echo
  "${PIPE_CMD[@]}"
fi

echo
echo "Orchestration complete."
