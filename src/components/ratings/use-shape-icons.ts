// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useMemo } from "react";

import { createCustomSvgIcons } from "./custom-svg-icon";
import { DEFAULT_SHAPE, getShapeIcons } from "./shape-icons";
import type { ShapeIcons } from "./shape-icons";
import { useServiceRatingSvgQuery } from "@/integrations/hydrus-api/queries/service-rating-svg";

/**
 * Hook that returns shape icons for a rating service.
 * Handles both predefined shapes and custom SVGs.
 *
 * @param serviceKey - The service key to fetch custom SVG for (if needed)
 * @param starShape - The star_shape value from the service config
 * @returns ShapeIcons with filled/outline components, plus isLoading state
 */
export function useShapeIcons(
  serviceKey: string,
  starShape?: string,
): ShapeIcons & { isLoading: boolean } {
  const isCustomSvg = starShape?.toLowerCase() === "svg";

  // Only fetch SVG if star_shape is "svg"
  const { data: svgContent, isLoading } = useServiceRatingSvgQuery(
    serviceKey,
    isCustomSvg,
  );

  // Memoize the custom icons to prevent recreating on every render
  const customIcons = useMemo(() => {
    if (!isCustomSvg || !svgContent) return null;
    return createCustomSvgIcons(svgContent);
  }, [isCustomSvg, svgContent]);

  // Return custom icons if available, otherwise fall back to predefined shapes
  if (isCustomSvg) {
    if (customIcons) {
      return { ...customIcons, isLoading: false };
    }
    // Still loading or failed - use default
    return { ...DEFAULT_SHAPE, isLoading };
  }

  // Use predefined shape icons
  return { ...getShapeIcons(starShape), isLoading: false };
}
