// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

/**
 * Polyfill for requestIdleCallback and cancelIdleCallback.
 * Safari doesn't support these APIs natively (as of Safari 26.x).
 *
 * Import this file once at app entry (main.tsx) to enable global usage.
 * The polyfill is registered in eslint.config.js under settings.polyfills.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback
 * @see https://caniuse.com/requestidlecallback
 */

// Only polyfill if the API doesn't exist
if (typeof window !== "undefined" && !("requestIdleCallback" in window)) {
  // Simple polyfill using setTimeout
  // Uses a 50ms time slice which is reasonable for "idle" work
  const IDLE_TIME_REMAINING = 50;

  (window as Window).requestIdleCallback = (
    callback: IdleRequestCallback,
    options?: IdleRequestOptions,
  ): number => {
    const start = Date.now();

    return window.setTimeout(() => {
      callback({
        didTimeout: options?.timeout
          ? Date.now() - start >= options.timeout
          : false,
        timeRemaining: () =>
          Math.max(0, IDLE_TIME_REMAINING - (Date.now() - start)),
      });
    }, 1);
  };

  (window as Window).cancelIdleCallback = (id: number): void => {
    window.clearTimeout(id);
  };
}
