## Learned User Preferences
- Prefers clear runtime-path explanations when behavior is unexpected, especially whether execution is in local scripts versus Cursor tooling.
- Uses `.env.local` for local script configuration and expects environment updates to apply cleanly to CLI workflows.

## Learned Workspace Facts
- The sellable-scoring flow runs through `scripts/score-sellable.mjs` (via `npm run score:sellable` and `scripts/run-sellable-pipeline.sh`), not Cursor model providers.
- The sellable-scoring path is Gemini-oriented by default and depends on `GEMINI_*` style configuration and Google Generative Language API calls unless the script is generalized.
