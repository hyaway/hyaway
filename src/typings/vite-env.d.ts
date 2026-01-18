// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Show debug overlays for swipe zones in the review feature */
  readonly VITE_DEBUG_SWIPE_ZONES?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
