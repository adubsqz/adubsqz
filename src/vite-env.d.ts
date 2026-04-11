/// <reference types="vite/client" />
/// <reference types="vitest/globals" />

interface ImportMetaEnv {
  /** When set, shows a password gate (value is embedded at build time). Omit for a public site. */
  readonly VITE_GALLERY_PASSWORD?: string;
  readonly VITE_E2E?: string;
}
