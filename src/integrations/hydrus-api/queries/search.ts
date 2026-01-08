import { useMemo } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { searchFiles } from "../api-client";
import { useIsApiConfigured } from "../hydrus-config-store";
import { HydrusFileSortType, Permission, ServiceType } from "../models";
import { useGetServicesQuery } from "./services";
import { useHasPermission } from "./access";
import type { HydrusTagSearch, SearchFilesOptions } from "../models";
import {
  useLongestViewedLimit,
  useMostViewedLimit,
  useRandomInboxLimit,
  useRecentFilesDays,
  useRecentFilesLimit,
  useRemoteHistoryLimit,
} from "@/stores/search-limits-store";

const useCanSearch = () =>
  useHasPermission(Permission.SEARCH_FOR_AND_FETCH_FILES);

export const useRecentlyArchivedFilesQuery = () => {
  const recentFilesLimit = useRecentFilesLimit();
  const recentFilesDays = useRecentFilesDays();

  const tags: HydrusTagSearch = [
    `system:limit=${recentFilesLimit}`,
    "system:archive",
    `system:archived time < ${recentFilesDays} days ago`,
  ];
  const options: Omit<SearchFilesOptions, "tags"> = {
    file_sort_type: HydrusFileSortType.ArchiveTimestamp,
    file_sort_asc: false,
  };

  const isConfigured = useIsApiConfigured();
  const canSearch = useCanSearch();

  return useQuery({
    queryKey: ["searchFiles", "recentlyArchived", tags, options],
    queryFn: async () => {
      return searchFiles({
        tags,
        ...options,
      });
    },
    enabled: isConfigured && canSearch && tags.length > 0,
  });
};

export const useRecentlyTrashedFilesQuery = () => {
  const { data: servicesData } = useGetServicesQuery();
  const recentFilesLimit = useRecentFilesLimit();
  const recentFilesDays = useRecentFilesDays();

  const trashServiceKey = useMemo(() => {
    if (!servicesData) return undefined;
    return Object.entries(servicesData.services).find(
      ([_key, service]) => service.type === ServiceType.TRASH,
    )?.[0];
  }, [servicesData]);
  const tags: HydrusTagSearch = [
    `system:limit=${recentFilesLimit}`,
    `system:time imported < ${recentFilesDays} days ago`,
  ];
  const options: Omit<SearchFilesOptions, "tags"> = {
    file_sort_type: HydrusFileSortType.ImportTime,
    file_sort_asc: false,
  };

  const isConfigured = useIsApiConfigured();
  const canSearch = useCanSearch();

  return useQuery({
    queryKey: [
      "searchFiles",
      "recentlyTrashed",
      trashServiceKey,
      tags,
      options,
    ],
    queryFn: async () => {
      if (!trashServiceKey) {
        throw new Error("Trash service is required.");
      }
      return searchFiles({
        tags,
        ...options,
        file_service_key: trashServiceKey,
      });
    },
    enabled: isConfigured && canSearch && tags.length > 0 && !!trashServiceKey,
  });
};

export const useRecentlyInboxedFilesQuery = () => {
  const recentFilesLimit = useRecentFilesLimit();
  const recentFilesDays = useRecentFilesDays();

  const tags: HydrusTagSearch = [
    `system:limit=${recentFilesLimit}`,
    "system:inbox",
    `system:time imported < ${recentFilesDays} days ago`,
  ];
  const options: Omit<SearchFilesOptions, "tags"> = {
    file_sort_type: HydrusFileSortType.ImportTime,
    file_sort_asc: false,
  };

  const isConfigured = useIsApiConfigured();
  const canSearch = useCanSearch();

  return useQuery({
    queryKey: ["searchFiles", "recentlyInboxed", tags, options],
    queryFn: async () => {
      return searchFiles({
        tags,
        ...options,
      });
    },
    enabled: isConfigured && canSearch && tags.length > 0,
  });
};

export const useRandomInboxFilesQuery = () => {
  const randomInboxLimit = useRandomInboxLimit();
  const tags: HydrusTagSearch = [
    `system:limit=${randomInboxLimit}`,
    "system:inbox",
  ];
  const options: Omit<SearchFilesOptions, "tags"> = {
    file_sort_type: HydrusFileSortType.Random,
  };

  const isConfigured = useIsApiConfigured();
  const canSearch = useCanSearch();

  return useQuery({
    queryKey: ["searchFiles", "randomInbox", tags, options],
    queryFn: async () => {
      return searchFiles({
        tags,
        ...options,
      });
    },
    enabled: isConfigured && canSearch && tags.length > 0,
  });
};

export const useSearchFilesQuery = (
  tags: HydrusTagSearch,
  options?: Omit<SearchFilesOptions, "tags">,
) => {
  const isConfigured = useIsApiConfigured();
  const canSearch = useCanSearch();

  return useQuery({
    queryKey: ["searchFiles", tags, options],
    queryFn: async () => {
      return searchFiles({ tags, ...options });
    },
    enabled: isConfigured && canSearch && tags.length > 0,
  });
};

export const useInfiniteSearchFilesQuery = (
  tags: HydrusTagSearch,
  options?: Omit<SearchFilesOptions, "tags">,
) => {
  const isConfigured = useIsApiConfigured();
  const canSearch = useCanSearch();
  const BATCH_SIZE = 256;

  return useInfiniteQuery({
    queryKey: ["infiniteSearchFiles", tags, options, BATCH_SIZE],
    queryFn: async ({ pageParam = 0 }) => {
      const searchTags: HydrusTagSearch = [
        ...tags,
        `system:limit=${BATCH_SIZE}`,
        `system:offset=${pageParam}`,
      ];

      const result = await searchFiles({
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
    enabled: isConfigured && canSearch && tags.length > 0,
  });
};

export const useRemoteWatchHistoryQuery = () => {
  const limit = useRemoteHistoryLimit();

  const tags: HydrusTagSearch = [
    `system:limit=${limit}`,
    "system:last viewed time < 7 years 45 days 7 hours ago",
  ];
  const options: Omit<SearchFilesOptions, "tags"> = {
    file_sort_type: HydrusFileSortType.LastViewedTime,
    file_sort_asc: false,
  };

  const isConfigured = useIsApiConfigured();
  const canSearch = useCanSearch();

  return useQuery({
    queryKey: ["searchFiles", "remoteWatchHistory", tags, options],
    queryFn: async () => {
      return searchFiles({
        tags,
        ...options,
      });
    },
    enabled: isConfigured && canSearch && tags.length > 0,
  });
};

export const useMostViewedFilesQuery = () => {
  const limit = useMostViewedLimit();

  const tags: HydrusTagSearch = [`system:limit=${limit}`];
  const options: Omit<SearchFilesOptions, "tags"> = {
    file_sort_type: HydrusFileSortType.NumberOfMediaViews,
    file_sort_asc: false,
  };

  const isConfigured = useIsApiConfigured();
  const canSearch = useCanSearch();

  return useQuery({
    queryKey: ["searchFiles", "mostViewed", tags, options],
    queryFn: async () => {
      return searchFiles({
        tags,
        ...options,
      });
    },
    enabled: isConfigured && canSearch && tags.length > 0,
  });
};

export const useLongestViewedFilesQuery = () => {
  const limit = useLongestViewedLimit();

  const tags: HydrusTagSearch = [`system:limit=${limit}`];
  const options: Omit<SearchFilesOptions, "tags"> = {
    file_sort_type: HydrusFileSortType.TotalMediaViewtime,
    file_sort_asc: false,
  };

  const isConfigured = useIsApiConfigured();
  const canSearch = useCanSearch();

  return useQuery({
    queryKey: ["searchFiles", "longestViewed", tags, options],
    queryFn: async () => {
      return searchFiles({
        tags,
        ...options,
      });
    },
    enabled: isConfigured && canSearch && tags.length > 0,
  });
};
