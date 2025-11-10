import { useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  useApiAccessKey,
  useApiEndpoint,
} from "../../integrations/hydrus-api/hydrus-config-store";
import {
  getClientOptions,
  getPageInfo,
  getPages,
  getServices,
  HydrusFileSortType,
  requestNewPermissions,
  searchFiles,
  ServiceType,
  verifyAccessKey,
} from "./hydrus-api";
import type { HydrusTagSearch, Page, SearchFilesOptions } from "./hydrus-api";
import { PageState, Permission } from "./hydrus-api";

// Simple hash for key (no crypto needed for cache key)
const simpleHash = (str: string) =>
  [...str].reduce((a, b) => a + b.charCodeAt(0), 0);

export const usePermissionsQuery = () => {
  const apiEndpoint = useApiEndpoint();
  const apiAccessKey = useApiAccessKey();

  return useQuery({
    queryKey: ["verifyAccess", apiEndpoint, simpleHash(apiAccessKey)],
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

export const useRequestNewPermissionsMutation = () => {
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
 * Iteratively flattens a page tree into an array of all pages
 */
const flattenPages = (root: Page): Array<Page> => {
  const result: Array<Page> = [];
  const stack: Array<Page> = [root];

  while (stack.length) {
    const current = stack.pop()!;
    result.push(current);

    if (current.pages && current.pages.length) {
      // Push in reverse to preserve original recursive order
      for (let i = current.pages.length - 1; i >= 0; i--) {
        stack.push(current.pages[i]);
      }
    }
  }
  return result;
};

/**
 * Check if all pages in the tree are in a stable state (ready or cancelled)
 */
const isStable = (page: { page_state: PageState }): boolean => {
  return (
    page.page_state === PageState.READY ||
    page.page_state === PageState.SEARCH_CANCELLED
  );
};
const areAllPagesStable = (page: Page): boolean => {
  return flattenPages(page).every(isStable);
};

/**
 * Query hook for getting all pages from Hydrus
 */
export const useGetPagesQuery = () => {
  const apiEndpoint = useApiEndpoint();
  const apiAccessKey = useApiAccessKey();

  return useQuery({
    queryKey: ["getPages", apiEndpoint, simpleHash(apiAccessKey)],
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
        ? flattenPages(data.pages)
            .filter((page) => page.is_media_page)
            .map((page) => ({ ...page, id: page.page_key }))
        : [],
    [data?.pages],
  );

  return {
    ...rest,
    data: mediaPages,
  };
};

export const useRecentlyDeletedFilesQuery = () => {
  const { data: servicesData } = useGetServicesQuery();

  const trashServiceKey = useMemo(() => {
    if (!servicesData) return undefined;
    return Object.entries(servicesData.services).find(
      ([_key, service]) => service.type === ServiceType.TRASH,
    )?.[0];
  }, [servicesData]);
  const tags: HydrusTagSearch = [
    "system:limit=1000",
    "system:time imported < 3 days ago",
  ];
  const options: Omit<SearchFilesOptions, "tags"> = {
    file_sort_type: HydrusFileSortType.ImportTime,
    file_sort_asc: false,
  };

  const apiEndpoint = useApiEndpoint();
  const apiAccessKey = useApiAccessKey();

  return useQuery({
    queryKey: [
      "searchFiles",
      "recentlyDeleted",
      trashServiceKey,
      tags,
      options,
      apiEndpoint,
      simpleHash(apiAccessKey),
    ],
    queryFn: () => {
      if (!apiEndpoint || !apiAccessKey || !trashServiceKey) {
        throw new Error(
          "API endpoint, access key, and trash service are required.",
        );
      }
      return searchFiles(apiEndpoint, apiAccessKey, {
        tags,
        ...options,
        file_service_key: trashServiceKey,
      });
    },
    enabled:
      !!apiEndpoint && !!apiAccessKey && tags.length > 0 && !!trashServiceKey,
  });
};

/**
 * Query hook for getting all options from Hydrus client
 */
export const useGetClientOptionsQuery = () => {
  const apiEndpoint = useApiEndpoint();
  const apiAccessKey = useApiAccessKey();

  return useQuery({
    queryKey: ["getClientOptions", apiEndpoint, simpleHash(apiAccessKey)],
    queryFn: () => {
      if (!apiEndpoint || !apiAccessKey) {
        throw new Error("API endpoint and access key are required.");
      }
      return getClientOptions(apiEndpoint, apiAccessKey);
    },
    enabled: !!apiEndpoint && !!apiAccessKey,
    staleTime: Infinity, // Options don't change often
  });
};

export const useGetServicesQuery = () => {
  const apiEndpoint = useApiEndpoint();
  const apiAccessKey = useApiAccessKey();

  return useQuery({
    queryKey: ["getServices", apiEndpoint, simpleHash(apiAccessKey)],
    queryFn: () => {
      if (!apiEndpoint || !apiAccessKey) {
        throw new Error("API endpoint and access key are required.");
      }
      return getServices(apiEndpoint, apiAccessKey);
    },
    enabled: !!apiEndpoint && !!apiAccessKey,
    staleTime: Infinity, // Services don't change often
  });
};

export const useGetPageInfoQuery = (pageKey: string, simple = true) => {
  const apiEndpoint = useApiEndpoint();
  const apiAccessKey = useApiAccessKey();

  return useQuery({
    queryKey: [
      "getPageInfo",
      pageKey,
      simple,
      apiEndpoint,
      simpleHash(apiAccessKey),
    ],
    queryFn: () => {
      if (!apiEndpoint || !apiAccessKey) {
        throw new Error("API endpoint and access key are required.");
      }
      return getPageInfo(apiEndpoint, apiAccessKey, pageKey, simple);
    },
    enabled: !!apiEndpoint && !!apiAccessKey && !!pageKey,
    staleTime: Infinity, // We want this to be not change while performing the archive/delete actions
    refetchInterval: (query) => {
      // Stop refetching if there's no data or an error
      if (!query.state.data || query.state.error) {
        return false;
      }

      // If all pages are stable (ready or cancelled), stop refetching
      if (isStable(query.state.data.page_info)) {
        return false;
      }

      // Otherwise, refetch every 5 seconds
      return 5000;
    },
  });
};

export const useSearchFilesQuery = (
  tags: HydrusTagSearch,
  options?: Omit<SearchFilesOptions, "tags">,
) => {
  const apiEndpoint = useApiEndpoint();
  const apiAccessKey = useApiAccessKey();

  return useQuery({
    queryKey: [
      "searchFiles",
      tags,
      options,
      apiEndpoint,
      simpleHash(apiAccessKey),
    ],
    queryFn: () => {
      if (!apiEndpoint || !apiAccessKey) {
        throw new Error("API endpoint and access key are required.");
      }
      return searchFiles(apiEndpoint, apiAccessKey, { tags, ...options });
    },
    enabled: !!apiEndpoint && !!apiAccessKey && tags.length > 0,
  });
};

export const useThumbnailDimensions = () => {
  const { data } = useGetClientOptionsQuery();

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
