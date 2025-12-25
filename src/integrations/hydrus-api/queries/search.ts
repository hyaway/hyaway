import { useMemo } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { searchFiles } from "../api-client";
import { useSessionKeyHash } from "../hydrus-config-store";
import { HydrusFileSortType, ServiceType } from "../models";
import { useGetServicesQuery } from "./services";
import type { HydrusTagSearch, SearchFilesOptions } from "../models";
import {
  useRandomInboxLimit,
  useRecentFilesDays,
  useRecentFilesLimit,
} from "@/lib/ux-settings-store";

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

  const sessionKeyHash = useSessionKeyHash();

  return useQuery({
    queryKey: [
      "searchFiles",
      "recentlyArchived",
      tags,
      options,
      sessionKeyHash,
    ],
    queryFn: async () => {
      return searchFiles({
        tags,
        ...options,
      });
    },
    enabled: !!sessionKeyHash && tags.length > 0,
  });
};

export const useRecentlyDeletedFilesQuery = () => {
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

  const sessionKeyHash = useSessionKeyHash();

  return useQuery({
    queryKey: [
      "searchFiles",
      "recentlyDeleted",
      trashServiceKey,
      tags,
      options,
      sessionKeyHash,
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
    enabled: !!sessionKeyHash && tags.length > 0 && !!trashServiceKey,
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

  const sessionKeyHash = useSessionKeyHash();

  return useQuery({
    queryKey: ["searchFiles", "recentlyInboxed", tags, options, sessionKeyHash],
    queryFn: async () => {
      return searchFiles({
        tags,
        ...options,
      });
    },
    enabled: !!sessionKeyHash && tags.length > 0,
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

  const sessionKeyHash = useSessionKeyHash();

  return useQuery({
    queryKey: ["searchFiles", "randomInbox", tags, options, sessionKeyHash],
    queryFn: async () => {
      return searchFiles({
        tags,
        ...options,
      });
    },
    enabled: !!sessionKeyHash && tags.length > 0,
  });
};

export const useSearchFilesQuery = (
  tags: HydrusTagSearch,
  options?: Omit<SearchFilesOptions, "tags">,
) => {
  const sessionKeyHash = useSessionKeyHash();

  return useQuery({
    queryKey: ["searchFiles", tags, options, sessionKeyHash],
    queryFn: async () => {
      return searchFiles({ tags, ...options });
    },
    enabled: !!sessionKeyHash && tags.length > 0,
  });
};

export const useInfiniteSearchFilesQuery = (
  tags: HydrusTagSearch,
  options?: Omit<SearchFilesOptions, "tags">,
) => {
  const sessionKeyHash = useSessionKeyHash();
  const BATCH_SIZE = 256;

  return useInfiniteQuery({
    queryKey: [
      "infiniteSearchFiles",
      tags,
      options,
      BATCH_SIZE,
      sessionKeyHash,
    ],
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
    enabled: !!sessionKeyHash && tags.length > 0,
  });
};
