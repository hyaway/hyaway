// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import type {
  RatingColor,
  RatingServiceInfo,
} from "@/integrations/hydrus-api/models";

/**
 * Default rating colors to use when the service doesn't provide them.
 * These match the typical Hydrus defaults.
 */
export const DEFAULT_LIKE_COLORS: RatingColor = {
  brush: "#50C878",
  pen: "#50C878",
}; // Emerald green

export const DEFAULT_DISLIKE_COLORS: RatingColor = {
  brush: "#E5484D",
  pen: "#E5484D",
}; // Destructive red

const DEFAULT_COLORS = {
  like: DEFAULT_LIKE_COLORS,
  dislike: DEFAULT_DISLIKE_COLORS,
  mixed: { brush: "#5F5F5F", pen: "#5F5F5F" },
  null: { brush: "#BFBFBF", pen: "#BFBFBF" },
} satisfies Record<string, RatingColor>;

/**
 * Default color for filled numerical ratings (amber/gold).
 */
export const DEFAULT_NUMERICAL_FILLED: RatingColor = {
  brush: "#F59E0B",
  pen: "#F59E0B",
};

/**
 * Gets the colors for the "like" rating state.
 *
 * @param service - The rating service info
 * @returns Object with brush (fill) and pen (stroke) colors
 */
export function getLikeColors(service: RatingServiceInfo): RatingColor {
  return service.colours?.like ?? DEFAULT_COLORS.like;
}

/**
 * Gets the colors for the "dislike" rating state.
 *
 * @param service - The rating service info
 * @returns Object with brush (fill) and pen (stroke) colors
 */
export function getDislikeColors(service: RatingServiceInfo): RatingColor {
  const colors = (service.colours as Record<string, RatingColor> | undefined)
    ?.dislike;
  return colors ?? DEFAULT_COLORS.dislike;
}

/**
 * Gets the colors for numerical rating's filled state.
 * Uses the 'like' color as the filled star color.
 *
 * @param service - The rating service info
 * @returns Object with brush (fill) and pen (stroke) colors
 */
export function getNumericalFilledColors(
  service: RatingServiceInfo,
): RatingColor {
  return service.colours?.like ?? DEFAULT_NUMERICAL_FILLED;
}

/**
 * Gets the colors for inc/dec rating's positive state.
 * Uses the 'like' color for positive values.
 *
 * @param service - The rating service info
 * @returns Object with brush (fill) and pen (stroke) colors
 */
export function getIncDecPositiveColors(
  service: RatingServiceInfo,
): RatingColor | undefined {
  return service.colours?.like;
}

/**
 * Gets the colors for inc/dec rating's zero (mixed) state.
 * Uses the 'mixed' color when provided by the service.
 *
 * @param service - The rating service info
 * @returns Object with brush (fill) and pen (stroke) colors
 */
export function getIncDecMixedColors(
  service: RatingServiceInfo,
): RatingColor | undefined {
  return (service.colours as Record<string, RatingColor> | undefined)?.mixed;
}
