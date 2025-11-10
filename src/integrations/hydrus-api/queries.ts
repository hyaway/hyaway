import { useMemo } from "react";
import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { HydrusApiClient } from "./api-client";
import { useHydrusApiClient } from "./hydrus-config-store";
import { HydrusFileSortType, Permission, ServiceType } from "./models";
import type { HydrusTagSearch, SearchFilesOptions } from "./models";

export {
  useFocusPageMutation,
  useGetMediaPagesQuery,
  useGetPageInfoQuery,
  useGetPagesQuery,
  useRefreshPageMutation,
} from "./manage-pages";
export { useGetFilesMetadata, useInfiniteGetFilesMetadata } from "./get-files";

export const usePermissionsQuery = () => {
  const hydrusApi = useHydrusApiClient();

  return useQuery({
    queryKey: ["verifyAccess", hydrusApi],
    queryFn: async () => {
      if (!hydrusApi) {
        throw new Error("Hydrus API client is required.");
      }
      return hydrusApi.verifyAccessKey();
    },
    enabled: !!hydrusApi,
    select: (data) => {
      return {
        hasAllPermissions: data.permits_everything,
        permissions: data.basic_permissions,
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
      return HydrusApiClient.requestNewPermissions(apiEndpoint, name);
    },
  });
};

export const useRecentlyArchivedFilesQuery = () => {
  const tags: HydrusTagSearch = [
    "system:limit=1000",
    "system:archive",
    "system:archived time < 3 days ago",
  ];
  const options: Omit<SearchFilesOptions, "tags"> = {
    file_sort_type: HydrusFileSortType.ArchiveTimestamp,
    file_sort_asc: false,
  };

  const hydrusApi = useHydrusApiClient();

  return useQuery({
    queryKey: ["searchFiles", "recentlyArchived", tags, options, hydrusApi],
    queryFn: async () => {
      if (!hydrusApi) {
        throw new Error("Hydrus API client is required.");
      }
      return hydrusApi.searchFiles({
        tags,
        ...options,
      });
    },
    enabled: !!hydrusApi && tags.length > 0,
  });
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

  const hydrusApi = useHydrusApiClient();

  return useQuery({
    queryKey: [
      "searchFiles",
      "recentlyDeleted",
      trashServiceKey,
      tags,
      options,
      hydrusApi,
    ],
    queryFn: async () => {
      if (!hydrusApi || !trashServiceKey) {
        throw new Error("API client and trash service are required.");
      }
      return hydrusApi.searchFiles({
        tags,
        ...options,
        file_service_key: trashServiceKey,
      });
    },
    enabled: !!hydrusApi && tags.length > 0 && !!trashServiceKey,
  });
};

export const useRecentlyInboxedFilesQuery = () => {
  const tags: HydrusTagSearch = [
    "system:limit=1000",
    "system:inbox",
    "system:time imported < 3 days ago",
  ];
  const options: Omit<SearchFilesOptions, "tags"> = {
    file_sort_type: HydrusFileSortType.ImportTime,
    file_sort_asc: false,
  };

  const hydrusApi = useHydrusApiClient();

  return useQuery({
    queryKey: ["searchFiles", "recentlyInboxed", tags, options, hydrusApi],
    queryFn: async () => {
      if (!hydrusApi) {
        throw new Error("Hydrus API client is required.");
      }
      return hydrusApi.searchFiles({
        tags,
        ...options,
      });
    },
    enabled: !!hydrusApi && tags.length > 0,
  });
};

/**
 * Query hook for getting all options from Hydrus client
 */
export const useGetClientOptionsQuery = () => {
  const hydrusApi = useHydrusApiClient();

  return useQuery({
    queryKey: ["getClientOptions", hydrusApi],
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

export const useGetServicesQuery = () => {
  const hydrusApi = useHydrusApiClient();

  return useQuery({
    queryKey: ["getServices", hydrusApi],
    queryFn: async () => {
      if (!hydrusApi) {
        throw new Error("Hydrus API client is required.");
      }
      return hydrusApi.getServices();
    },
    enabled: !!hydrusApi,
    staleTime: Infinity, // Services don't change often
  });
};

export const useSearchFilesQuery = (
  tags: HydrusTagSearch,
  options?: Omit<SearchFilesOptions, "tags">,
) => {
  const hydrusApi = useHydrusApiClient();

  return useQuery({
    queryKey: ["searchFiles", tags, options, hydrusApi],
    queryFn: async () => {
      if (!hydrusApi) {
        throw new Error("Hydrus API client is required.");
      }
      return hydrusApi.searchFiles({ tags, ...options });
    },
    enabled: !!hydrusApi && tags.length > 0,
  });
};

export const useInfiniteSearchFilesQuery = (
  tags: HydrusTagSearch,
  options?: Omit<SearchFilesOptions, "tags">,
) => {
  const hydrusApi = useHydrusApiClient();
  const BATCH_SIZE = 256;

  return useInfiniteQuery({
    queryKey: ["infiniteSearchFiles", tags, options, BATCH_SIZE, hydrusApi],
    queryFn: async ({ pageParam = 0 }) => {
      if (!hydrusApi) {
        throw new Error("Hydrus API client is required.");
      }

      const searchTags: HydrusTagSearch = [
        ...tags,
        `system:limit=${BATCH_SIZE}`,
        `system:offset=${pageParam}`,
      ];

      const result = await hydrusApi.searchFiles({
        ...options,
        tags: searchTags,
      });
      return {
        file_ids: result.file_ids ?? [],
        offset: pageParam,
      };
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.file_ids.length < BATCH_SIZE) {
        return undefined; // No more pages
      }
      return lastPage.offset + BATCH_SIZE;
    },
    initialPageParam: 0,
    enabled: !!hydrusApi && tags.length > 0,
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
