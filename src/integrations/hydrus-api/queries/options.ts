import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useHydrusApiClient } from "../hydrus-config-store";

export const useGetClientOptionsQuery = () => {
  const hydrusApi = useHydrusApiClient();

  return useQuery({
    queryKey: ["getClientOptions", hydrusApi, hydrusApi?.toJSON()],
    queryFn: async () => {
      if (!hydrusApi) {
        throw new Error("Hydrus API client is required.");
      }
      return hydrusApi.getClientOptions();
    },
    enabled: !!hydrusApi,
    staleTime: Infinity, // Options don't change often
  });
};

export const useThumbnailDimensions = () => {
  const { data, isFetched } = useGetClientOptionsQuery();
  if (isFetched && !data) {
    return undefined;
  }

  return useMemo(() => {
    if (
      !data ||
      !data.old_options?.thumbnail_dimensions ||
      data.old_options.thumbnail_dimensions.length !== 2 ||
      data.old_options.thumbnail_dimensions[0] <= 0 ||
      data.old_options.thumbnail_dimensions[1] <= 0
    ) {
      return { width: 200, height: 200 };
    }

    const width = data.old_options.thumbnail_dimensions[0];
    const height = data.old_options.thumbnail_dimensions[1];

    if (width > 500) {
      const scaleFactor = width / 500;
      return {
        width: Math.floor(width / scaleFactor),
        height: Math.floor(height / scaleFactor),
      };
    }
    return { width, height };
  }, [data]);
};

/**
 * Hook to get namespace colors from client options.
 * Returns a record mapping namespace to RGB color string.
 * Empty string key ("") applies to un-namespaced tags.
 */
export const useNamespaceColors = (): Record<string, string> => {
  const { data } = useGetClientOptionsQuery();

  return useMemo(() => {
    const namespaceColours = data?.old_options?.namespace_colours;
    if (!namespaceColours) return {};

    const result: Record<string, string> = {};
    for (const [namespace, rgb] of Object.entries(namespaceColours)) {
      result[namespace] = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
    }
    return result;
  }, [data]);
};

/**
 * Hook to get the color for a specific namespace.
 * Pass empty string for unnamespaced tags.
 */
export const useNamespaceColor = (namespace: string): string | undefined => {
  const colors = useNamespaceColors();
  return colors[namespace];
};
