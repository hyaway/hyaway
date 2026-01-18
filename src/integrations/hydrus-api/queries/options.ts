// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getClientOptions } from "../api-client";
import { useIsApiConfigured } from "../hydrus-config-store";
import { Permission } from "../models";
import { useHasPermission } from "./access";
import type { GetClientOptionsResponse } from "../models";
import type { GalleryBaseWidthMode } from "@/stores/gallery-settings-store";
import { useActiveTheme } from "@/stores/theme-store";
import { adjustColorForTheme, rgbToString } from "@/lib/color-utils";
import {
  DEFAULT_THUMBNAIL_SIZE,
  MAX_GALLERY_BASE_WIDTH,
  MIN_GALLERY_BASE_WIDTH,
  useGalleryBaseWidthMode,
} from "@/stores/gallery-settings-store";

export const useGetClientOptionsQuery = <T = GetClientOptionsResponse>(
  select?: (data: GetClientOptionsResponse) => T,
) => {
  const isConfigured = useIsApiConfigured();
  const hasPermission = useHasPermission(Permission.MANAGE_DATABASE);

  return useQuery({
    queryKey: ["getClientOptions"],
    queryFn: async () => {
      return getClientOptions();
    },
    enabled: isConfigured && hasPermission,
    select,
  });
};

export const useThumbnailDimensions = () => {
  const { data: thumbnail_dimensions, isFetched } = useGetClientOptionsQuery(
    (response) => response.old_options?.thumbnail_dimensions,
  );

  return useMemo(() => {
    // Return undefined if fetched but no data
    if (isFetched && !thumbnail_dimensions) {
      return undefined;
    }

    if (
      !thumbnail_dimensions ||
      thumbnail_dimensions.length !== 2 ||
      thumbnail_dimensions[0] <= 0 ||
      thumbnail_dimensions[1] <= 0
    ) {
      return {
        width: DEFAULT_THUMBNAIL_SIZE,
        height: DEFAULT_THUMBNAIL_SIZE,
      };
    }

    const width = thumbnail_dimensions[0];
    const height = thumbnail_dimensions[1];

    if (width > MAX_GALLERY_BASE_WIDTH) {
      const scaleFactor = width / MAX_GALLERY_BASE_WIDTH;
      return {
        width: Math.floor(width / scaleFactor),
        height: Math.floor(height / scaleFactor),
      };
    }

    if (width < MIN_GALLERY_BASE_WIDTH) {
      const scaleFactor = MIN_GALLERY_BASE_WIDTH / width;
      return {
        width: Math.floor(width * scaleFactor),
        height: Math.floor(height * scaleFactor),
      };
    }

    return { width, height };
  }, [thumbnail_dimensions, isFetched]);
};

/**
 * Hook to get namespace colors from client options.
 * Returns a record mapping namespace to RGB color string.
 * Empty string key ("") applies to un-namespaced tags.
 * Colors are automatically adjusted for accessible contrast based on the current theme.
 */
export const useNamespaceColors = (): Record<string, string> => {
  const { data: namespaceColours } = useGetClientOptionsQuery(
    (response) => response.old_options?.namespace_colours,
  );
  const theme = useActiveTheme();

  return useMemo(() => {
    if (!namespaceColours) return {};

    const result: Record<string, string> = {};
    for (const [namespace, rgb] of Object.entries(namespaceColours)) {
      const adjustedRgb = adjustColorForTheme([rgb[0], rgb[1], rgb[2]], theme);
      result[namespace] = rgbToString(adjustedRgb);
    }
    return result;
  }, [namespaceColours, theme]);
};

/**
 * Hook to get the color for a specific namespace.
 * Pass empty string for unnamespaced tags.
 */
export const useNamespaceColor = (namespace: string): string | undefined => {
  const colors = useNamespaceColors();
  return colors[namespace];
};

/**
 * Default values for file viewing statistics when not configured in Hydrus.
 * These match Hydrus defaults.
 */
const FILE_VIEWING_STATS_DEFAULTS = {
  active: false,
  minTimeMs: 2_000, // 2 seconds
  maxTimeMs: 600_000, // 10 minutes
};

/**
 * Hook to get file viewing statistics options from Hydrus.
 * Returns whether the feature is enabled and the min/max time thresholds.
 */
export const useFileViewingStatisticsOptions = () => {
  const {
    data: options,
    isFetched,
    isLoading,
  } = useGetClientOptionsQuery((response) => response.options);

  return useMemo(() => {
    const isActive =
      options?.booleans?.file_viewing_statistics_active ??
      FILE_VIEWING_STATS_DEFAULTS.active;

    // Get the raw values - could be number, null (disabled), or undefined (not set)
    const rawMinTimeMs =
      options?.noneable_integers?.file_viewing_statistics_media_min_time_ms;
    const rawMaxTimeMs =
      options?.noneable_integers?.file_viewing_statistics_media_max_time_ms;

    // Apply defaults only when undefined (not set), preserve null (means "disabled" for min, "no max" for max)
    // For simplicity, we treat null as "use default" since the Client API context makes sense with defaults
    const minTimeMs =
      rawMinTimeMs === null || rawMinTimeMs === undefined
        ? FILE_VIEWING_STATS_DEFAULTS.minTimeMs
        : rawMinTimeMs;

    const maxTimeMs =
      rawMaxTimeMs === null || rawMaxTimeMs === undefined
        ? FILE_VIEWING_STATS_DEFAULTS.maxTimeMs
        : rawMaxTimeMs;

    return {
      /** Whether file viewing statistics is enabled in Hydrus */
      isActive,
      /** Minimum time in ms before a view counts */
      minTimeMs,
      /** Maximum time in ms to track */
      maxTimeMs,
      /** Whether options have been fetched */
      isFetched,
      /** Whether options are currently loading */
      isLoading,
    };
  }, [options, isFetched, isLoading]);
};

/**
 * Returns the effective gallery base width mode.
 * Falls back to "custom" when "service" is selected but MANAGE_DATABASE permission is missing.
 */
export const useEffectiveGalleryBaseWidthMode = (): GalleryBaseWidthMode => {
  const storedMode = useGalleryBaseWidthMode();
  const hasPermission = useHasPermission(Permission.MANAGE_DATABASE);

  if (storedMode === "service" && !hasPermission) {
    return "custom";
  }
  return storedMode;
};
