import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { focusPage, getPageInfo, getPages, refreshPage } from "../api-client";
import { useIsApiConfigured } from "../hydrus-config-store";
import { PageState, Permission } from "../models";
import { useHasPermission } from "./access";
import type { Page } from "../models";

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
  const isConfigured = useIsApiConfigured();
  const hasPermission = useHasPermission(Permission.MANAGE_PAGES);

  return useQuery({
    queryKey: ["getPages"],
    queryFn: async () => {
      return getPages();
    },
    enabled: isConfigured && hasPermission,
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

export const useGetPageInfoQuery = (pageKey: string, simple = true) => {
  const isConfigured = useIsApiConfigured();
  const hasPermission = useHasPermission(Permission.MANAGE_PAGES);

  return useQuery({
    queryKey: ["getPageInfo", pageKey, simple],
    queryFn: async () => {
      return getPageInfo(pageKey, simple);
    },
    enabled: isConfigured && hasPermission && !!pageKey,
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

export const useRefreshPageMutation = () => {
  const queryClient = useQueryClient();
  const isConfigured = useIsApiConfigured();

  return useMutation({
    mutationFn: async (pageKey: string) => {
      if (!isConfigured) {
        throw new Error("Hydrus API session not established.");
      }
      return refreshPage(pageKey);
    },
    onSuccess: (_data, pageKey) => {
      // Invalidate the specific getPageInfo for the refreshed page
      queryClient.invalidateQueries({
        queryKey: ["getPageInfo", pageKey],
      });
      // Invalidate getPages to refetch the page list, which might have updated states
      queryClient.invalidateQueries({
        queryKey: ["getPages"],
      });
    },
    mutationKey: ["refreshRemotePage"],
  });
};

export const useFocusPageMutation = () => {
  const isConfigured = useIsApiConfigured();

  return useMutation({
    mutationFn: async (pageKey: string) => {
      if (!isConfigured) {
        throw new Error("Hydrus API session not established.");
      }
      return focusPage(pageKey);
    },
    mutationKey: ["focusRemotePage"],
  });
};
