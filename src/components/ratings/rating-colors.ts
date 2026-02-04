// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import type {
  RatingColour,
  RatingServiceInfo,
} from "@/integrations/hydrus-api/models";

/**
 * Default rating colors to use when the service doesn't provide them.
 * These match the typical Hydrus defaults.
 */
export const DEFAULT_LIKE_COLORS: RatingColour = {
  brush: "#50C878",
  pen: "#000000",
}; // Emerald green

export const DEFAULT_DISLIKE_COLORS: RatingColour = {
  brush: "#FFFFFF",
  pen: "#000000",
};

const DEFAULT_COLORS = {
  like: DEFAULT_LIKE_COLORS,
  dislike: DEFAULT_DISLIKE_COLORS,
  mixed: { brush: "#5F5F5F", pen: "#000000" },
  null: { brush: "#BFBFBF", pen: "#000000" },
} satisfies Record<string, RatingColour>;

/**
 * Default color for filled numerical ratings (amber/gold).
 */
export const DEFAULT_NUMERICAL_FILLED: RatingColour = {
  brush: "#F59E0B",
  pen: "#000000",
};

/**
 * Gets the colors for the "like" rating state.
 *
 * @param service - The rating service info
 * @returns Object with brush (fill) and pen (stroke) colors
 */
export function getLikeColors(service: RatingServiceInfo): RatingColour {
  return service.colours?.like ?? DEFAULT_COLORS.like;
}

/**
 * Gets the colors for the "dislike" rating state.
 *
 * @param service - The rating service info
 * @returns Object with brush (fill) and pen (stroke) colors
 */
export function getDislikeColors(service: RatingServiceInfo): RatingColour {
  const colors = (service.colours as Record<string, RatingColour> | undefined)
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
): RatingColour {
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
): RatingColour {
  return service.colours?.like ?? DEFAULT_COLORS.like;
}
