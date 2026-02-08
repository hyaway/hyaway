// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Override the PWA app name shown on the home screen (defaults to "hyAway") */
  readonly VITE_APP_NAME?: string;

  /** Use an alternate icon set (e.g. "dev" for blue-gradient icons) */
  readonly VITE_APP_ICON_VARIANT?: string;

  /** Show debug overlays for swipe zones in the review feature */
  readonly VITE_DEBUG_SWIPE_ZONES?: string;

  /**
   * Preset Hydrus API endpoint for self-hosted instances.
   * ⚠️ DANGER: This value is embedded in the built JavaScript bundle.
   * @example "http://127.0.0.1:45869"
   */
  readonly VITE_HYDRUS_ENDPOINT?: string;

  /**
   * Preset Hydrus API access key for self-hosted instances.
   * ⚠️ DANGER: This value is embedded in the built JavaScript bundle,
   * exposing it to all users who access the instance.
   */
  readonly VITE_HYDRUS_ACCESS_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
