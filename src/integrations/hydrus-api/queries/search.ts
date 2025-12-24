import { useMemo } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useHydrusApiClient } from "../hydrus-config-store";
import { HydrusFileSortType, ServiceType } from "../models";
import { useGetServicesQuery } from "./services";
import type { HydrusTagSearch, SearchFilesOptions } from "../models";

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
    queryKey: [
      "searchFiles",
      "recentlyArchived",
      tags,
      options,
      hydrusApi,
      hydrusApi?.toJSON(),
    ],
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
      hydrusApi?.toJSON(),
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
    queryKey: [
      "searchFiles",
      "recentlyInboxed",
      tags,
      options,
      hydrusApi,
      hydrusApi?.toJSON(),
    ],
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

export const useRandomInboxFilesQuery = () => {
  const tags: HydrusTagSearch = ["system:limit=100", "system:inbox"];
  const options: Omit<SearchFilesOptions, "tags"> = {
    file_sort_type: HydrusFileSortType.Random,
  };

  const hydrusApi = useHydrusApiClient();

  return useQuery({
    queryKey: [
      "searchFiles",
      "randomInbox",
      tags,
      options,
      hydrusApi,
      hydrusApi?.toJSON(),
    ],
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

export const useSearchFilesQuery = (
  tags: HydrusTagSearch,
  options?: Omit<SearchFilesOptions, "tags">,
) => {
  const hydrusApi = useHydrusApiClient();

  return useQuery({
    queryKey: ["searchFiles", tags, options, hydrusApi, hydrusApi?.toJSON()],
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
    queryKey: [
      "infiniteSearchFiles",
      tags,
      options,
      BATCH_SIZE,
      hydrusApi,
      hydrusApi?.toJSON(),
    ],
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
