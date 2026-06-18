// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

/** A minimal page shape for resolution (matches MediaPage). */
interface OpenPage {
  page_key: string;
  name: string;
}

/**
 * Resolution of the configured "send to" page against the currently open
 * Hydrus pages.
 * - `unset`: no target page is configured.
 * - `closed`: a page is configured but it isn't currently open in Hydrus.
 * - `ok`: the page is open; `name` is its current (live) name.
 */
export type SendToPageResolution =
  | { status: "unset" }
  | { status: "closed"; name: string | null }
  | { status: "ok"; pageKey: string; name: string };

/**
 * Decide what the "Send to Hydrus page" action should do given the configured
 * target and the currently open media pages. Pure — drives both the toast and
 * the mutation in the action handler.
 */
export function resolveSendToPageState(
  pageKey: string | null,
  pageName: string | null,
  mediaPages: ReadonlyArray<OpenPage>,
): SendToPageResolution {
  if (!pageKey) return { status: "unset" };
  const open = mediaPages.find((page) => page.page_key === pageKey);
  if (!open) return { status: "closed", name: pageName };
  return { status: "ok", pageKey, name: open.name };
}
