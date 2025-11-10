import { useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  useApiAccessKey,
  useApiEndpoint,
} from "../../integrations/hydrus-api/hydrus-config-store";
import {
  getPages,
  type Page,
  Permission,
  requestNewPermissions,
  verifyAccessKey,
} from "./hydrus-api";

export const usePermissionsQuery = () => {
  const apiEndpoint = useApiEndpoint();
  const apiAccessKey = useApiAccessKey();

  return useQuery({
    queryKey: ["verifyAccess", apiEndpoint, apiAccessKey],
    queryFn: () => {
      if (!apiEndpoint || !apiAccessKey) {
        throw new Error("API endpoint and access key are required.");
      }
      return verifyAccessKey(apiEndpoint, apiAccessKey);
    },
    enabled: !!apiEndpoint && !!apiAccessKey,
    select: (data) => {
      return {
        hasAllPermissions: data.permits_everything,
        permissions: data.basic_permissions ?? [],
      };
    },
    staleTime: Infinity,
  });
};

export const useVerifyAccessQuery = () => {
  const { data: permissionsData, ...rest } = usePermissionsQuery();

  const requiredPermissions = [
    Permission.IMPORT_AND_DELETE_FILES,
    Permission.EDIT_FILE_TAGS,
    Permission.SEARCH_FOR_AND_FETCH_FILES,
    Permission.MANAGE_PAGES,
  ];

  const hasRequiredPermissions =
    permissionsData?.hasAllPermissions ||
    requiredPermissions.every((p) => permissionsData?.permissions.includes(p));

  return {
    ...rest,
    hasRequiredPermissions,
  };
};

export const useRequestNewPermissionsQuery = () => {
  return useMutation({
    mutationFn: async ({
      apiEndpoint,
      name,
    }: {
      apiEndpoint: string;
      name: string;
    }) => {
      return requestNewPermissions(apiEndpoint, name);
    },
  });
};

/**
 * Recursively flattens a page tree into an array of all pages
 */
const flattenPages = (page: Page): Page[] => {
  const result: Page[] = [page];
  if (page.pages) {
    for (const childPage of page.pages) {
      result.push(...flattenPages(childPage));
    }
  }
  return result;
};

/**
 * Check if all pages in the tree are in a stable state (ready or cancelled)
 */
const areAllPagesStable = (page: Page): boolean => {
  const isStable =
    page.page_state === 0 /* ready */ || page.page_state === 3; /* cancelled */

  if (!page.pages) {
    return isStable;
  }

  return isStable && flattenPages(page).every(areAllPagesStable);
};

/**
 * Query hook for getting all pages from Hydrus
 */
export const useGetPagesQuery = () => {
  const apiEndpoint = useApiEndpoint();
  const apiAccessKey = useApiAccessKey();

  return useQuery({
    queryKey: ["getPages", apiEndpoint, apiAccessKey],
    queryFn: () => {
      if (!apiEndpoint || !apiAccessKey) {
        throw new Error("API endpoint and access key are required.");
      }
      return getPages(apiEndpoint, apiAccessKey);
    },
    enabled: !!apiEndpoint && !!apiAccessKey,
    staleTime: 5 * 60 * 1000, // Pages can change frequently, but don't need to refetch constantly
    refetchInterval: (query) => {
      // Stop refetching if there's no data or an error
      if (!query.state.data || query.state.error) {
        return false;
      }

      // If all pages are stable (ready or cancelled), stop refetching
      if (areAllPagesStable(query.state.data.pages)) {
        return false;
      }

      // Otherwise, refetch every 5 seconds
      return 5000;
    },
  });
};

/**
 * Query hook for getting only media pages (pages that can hold files)
 */
export const useGetMediaPagesQuery = () => {
  const { data, ...rest } = useGetPagesQuery();

  const mediaPages = useMemo(
    () =>
      data?.pages
        ? flattenPages(data.pages).filter((page) => page.is_media_page)
        : [],
    [data?.pages],
  );

  return {
    ...rest,
    data: mediaPages,
  };
};
