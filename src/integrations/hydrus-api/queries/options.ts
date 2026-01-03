import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getClientOptions } from "../api-client";
import { useIsApiConfigured } from "../hydrus-config-store";
import { useActiveTheme } from "@/lib/theme-store";
import { adjustColorForTheme, rgbToString } from "@/lib/color-utils";
import {
  DEFAULT_SERVICE_THUMBNAIL_SIZE,
  MAX_GALLERY_BASE_WIDTH,
  MIN_GALLERY_BASE_WIDTH,
} from "@/lib/settings-store";

export const useGetClientOptionsQuery = () => {
  const isConfigured = useIsApiConfigured();

  return useQuery({
    queryKey: ["getClientOptions"],
    queryFn: async () => {
      return getClientOptions();
    },
    enabled: isConfigured,
    staleTime: Infinity, // Options don't change often
  });
};

export const useThumbnailDimensions = () => {
  const { data, isFetched } = useGetClientOptionsQuery();

  return useMemo(() => {
    // Return undefined if fetched but no data
    if (isFetched && !data) {
      return undefined;
    }

    if (
      !data ||
      !data.old_options?.thumbnail_dimensions ||
      data.old_options.thumbnail_dimensions.length !== 2 ||
      data.old_options.thumbnail_dimensions[0] <= 0 ||
      data.old_options.thumbnail_dimensions[1] <= 0
    ) {
      return {
        width: DEFAULT_SERVICE_THUMBNAIL_SIZE,
        height: DEFAULT_SERVICE_THUMBNAIL_SIZE,
      };
    }

    const width = data.old_options.thumbnail_dimensions[0];
    const height = data.old_options.thumbnail_dimensions[1];

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
  }, [data, isFetched]);
};

/**
 * Hook to get namespace colors from client options.
 * Returns a record mapping namespace to RGB color string.
 * Empty string key ("") applies to un-namespaced tags.
 * Colors are automatically adjusted for accessible contrast based on the current theme.
 */
export const useNamespaceColors = (): Record<string, string> => {
  const { data } = useGetClientOptionsQuery();
  const theme = useActiveTheme();

  return useMemo(() => {
    const namespaceColours = data?.old_options?.namespace_colours;
    if (!namespaceColours) return {};

    const result: Record<string, string> = {};
    for (const [namespace, rgb] of Object.entries(namespaceColours)) {
      const adjustedRgb = adjustColorForTheme([rgb[0], rgb[1], rgb[2]], theme);
      result[namespace] = rgbToString(adjustedRgb);
    }
    return result;
  }, [data, theme]);
};

/**
 * Hook to get the color for a specific namespace.
 * Pass empty string for unnamespaced tags.
 */
export const useNamespaceColor = (namespace: string): string | undefined => {
  const colors = useNamespaceColors();
  return colors[namespace];
};
