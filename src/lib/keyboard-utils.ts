// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

/**
 * Shared utilities for keyboard event handling across the app.
 */

/**
 * Returns true if the target is a text input-like element where keyboard
 * shortcuts should be disabled to allow normal typing.
 */
export function isTextInputTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;

  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target.isContentEditable ||
    target.getAttribute("role") === "textbox"
  );
}

/**
 * Returns true if the target is inside an open overlay (popover, dropdown menu)
 * or if any overlay is currently open. Useful for disabling global shortcuts
 * when overlays are active.
 */
export function isInOpenOverlay(target: EventTarget | null): boolean {
  const overlaySelectors =
    '[data-slot="popover-content"],[data-slot="dropdown-menu-content"],[data-slot="dropdown-menu-sub-content"]';

  if (target instanceof HTMLElement && target.closest(overlaySelectors)) {
    return true;
  }

  // If an overlay is open anywhere, disable shortcuts globally.
  const openOverlaySelectors =
    '[data-slot="popover-content"][data-open],[data-slot="dropdown-menu-content"][data-open],[data-slot="dropdown-menu-sub-content"][data-open]';

  return Boolean(document.querySelector(openOverlaySelectors));
}

/**
 * Common keyboard event guard checks. Returns true if the event should be
 * ignored (e.g., modified keys, text input, overlays).
 */
export function shouldIgnoreKeyboardEvent(
  event: KeyboardEvent,
  options: { checkOverlays?: boolean } = {},
): boolean {
  if (event.defaultPrevented) return true;
  if (event.metaKey || event.ctrlKey || event.altKey) return true;
  if (isTextInputTarget(event.target)) return true;
  if (options.checkOverlays && isInOpenOverlay(event.target)) return true;
  return false;
}
