import { useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  useApiAccessKey,
  useApiEndpoint,
} from "../../integrations/hydrus-api/hydrus-config-store";
import {
  HydrusFileSortType,
  Permission,
  ServiceType,
  getClientOptions,
  getServices,
  requestNewPermissions,
  searchFiles,
  verifyAccessKey,
} from "./hydrus-api";
import type { HydrusTagSearch, SearchFilesOptions } from "./hydrus-api";
import { simpleHash } from "@/lib/utils";

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
      return requestNewPermissions(apiEndpoint, name);
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

  const apiEndpoint = useApiEndpoint();
  const apiAccessKey = useApiAccessKey();

  return useQuery({
    queryKey: [
      "searchFiles",
      "recentlyArchived",
      tags,
      options,
      apiEndpoint,
      simpleHash(apiAccessKey),
    ],
    queryFn: () => {
      if (!apiEndpoint || !apiAccessKey) {
        throw new Error("API endpoint and access key are required.");
      }
      return searchFiles(apiEndpoint, apiAccessKey, {
        tags,
        ...options,
      });
    },
    enabled: !!apiEndpoint && !!apiAccessKey && tags.length > 0,
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
