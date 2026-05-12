/// <reference types="vite/client" />
/// <reference types="vitest/globals" />

interface ImportMetaEnv {
  readonly VITE_E2E?: string;
  /** Set to `"1"` to keep the password gate when running \`vite\` locally (defaults to open gallery in dev). */
  readonly VITE_REQUIRE_PASSWORD_GATE?: string;
}
