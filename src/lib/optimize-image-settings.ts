// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

export const MB_IN_BYTES = 1024 * 1024;
export const MIN_OPTIMIZE_SIZE_THRESHOLD_MB = 0;
export const MAX_OPTIMIZE_SIZE_THRESHOLD_MB = 20;

export function normalizeOptimizeSizeThresholdMB(sizeMB: number) {
  const clamped = Math.min(
    MAX_OPTIMIZE_SIZE_THRESHOLD_MB,
    Math.max(MIN_OPTIMIZE_SIZE_THRESHOLD_MB, sizeMB),
  );

  return clamped <= 0.5 ? Math.round(clamped * 2) / 2 : Math.round(clamped);
}

export function sizeThresholdToSliderValue(sizeMB: number) {
  if (sizeMB <= 0) return 0;
  if (sizeMB <= 0.5) return 1;
  return Math.round(sizeMB) + 1;
}

export function sliderValueToSizeThreshold(value: number) {
  if (value <= 0) return 0;
  if (value === 1) return 0.5;
  return value - 1;
}

export function formatOptimizeSizeThresholdMB(sizeMB: number) {
  return sizeMB === 0 ? "Any size" : `${sizeMB} MB`;
}
