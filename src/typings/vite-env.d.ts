/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Show debug overlays for swipe zones in the review feature */
  readonly VITE_DEBUG_SWIPE_ZONES?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
