// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getServiceRatingSvg } from "../api-client";
import { useIsApiConfigured } from "../hydrus-config-store";

/**
 * Query key factory for service rating SVG queries.
 */
export const serviceRatingSvgKeys = {
  all: ["serviceRatingSvg"] as const,
  byService: (serviceKey: string) =>
    [...serviceRatingSvgKeys.all, serviceKey] as const,
};

/**
 * Fetches the custom SVG icon for a rating service.
 * Only enabled when the service has `star_shape: "svg"`.
 *
 * @param serviceKey - The service key to fetch the SVG for
 * @param enabled - Whether the query should be enabled (typically `star_shape === "svg"`)
 */
export const useServiceRatingSvgQuery = (
  serviceKey: string,
  enabled = true,
) => {
  const isConfigured = useIsApiConfigured();

  return useQuery({
    queryKey: serviceRatingSvgKeys.byService(serviceKey),
    queryFn: () => getServiceRatingSvg(serviceKey),
    enabled: isConfigured && enabled && !!serviceKey,
    // SVGs are static - cache them for a long time
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

/**
 * Hook to prefetch SVGs for all rating services that have `star_shape: "svg"`.
 * Call this once when loading rating services to ensure SVGs are cached.
 */
export const usePrefetchServiceRatingSvgs = () => {
  const queryClient = useQueryClient();
  const isConfigured = useIsApiConfigured();

  return async (serviceKeys: Array<string>) => {
    if (!isConfigured) return;

    await Promise.all(
      serviceKeys.map((serviceKey) =>
        queryClient.prefetchQuery({
          queryKey: serviceRatingSvgKeys.byService(serviceKey),
          queryFn: () => getServiceRatingSvg(serviceKey),
          staleTime: 24 * 60 * 60 * 1000,
        }),
      ),
    );
  };
};
