// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { focusPage, getPageInfo, getPages, refreshPage } from "../api-client";
import { useIsApiConfigured } from "../hydrus-config-store";
import { PageState, Permission } from "../models";
import { useHasPermission } from "./access";

import type { MediaPage, Page } from "../models";

import { createPageSlug } from "@/lib/format-utils";

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
 * Flattens a page tree and transforms to MediaPage array with computed fields.
 * Filters to only include media pages (pages that can hold files).
 * Use this outside React components (e.g., in route loaders).
 */
export function flattenPagesToMedia(rootPage: Page): Array<MediaPage> {
  return flattenPages(rootPage)
    .filter((page) => page.is_media_page)
    .map((page) => ({
      ...page,
      id: page.page_key,
      slug: createPageSlug(page.name, page.page_key),
    }));
}

export type PagesTreeNode = Omit<Page, "pages"> & {
  /** Same as page_key */
  id: string;
  /** URL-friendly slug for media pages */
  slug?: string;
  pages?: Array<PagesTreeNode>;
};

/**
 * Builds a hierarchical pages tree that only includes nodes with media pages
 * in their subtree. Media pages get computed `id` and `slug` fields.
 */
export function buildPagesTree(rootPage: Page): PagesTreeNode | null {
  const nodes = new Map<string, PagesTreeNode | null>();
  const stack: Array<{ page: Page; visited: boolean }> = [
    { page: rootPage, visited: false },
  ];

  while (stack.length) {
    const current = stack.pop()!;

    if (!current.visited) {
      stack.push({ page: current.page, visited: true });

      if (current.page.pages?.length) {
        current.page.pages.forEach((child) => {
          stack.push({ page: child, visited: false });
        });
      }
      continue;
    }

    const childNodes = (current.page.pages ?? [])
      .map((child) => nodes.get(child.page_key) ?? null)
      .filter((child): child is PagesTreeNode => child !== null);

    const hasMedia = current.page.is_media_page || childNodes.length > 0;
    if (!hasMedia) {
      nodes.set(current.page.page_key, null);
      continue;
    }

    const node: PagesTreeNode = {
      ...current.page,
      id: current.page.page_key,
      pages: childNodes.length > 0 ? childNodes : undefined,
    };

    if (current.page.is_media_page) {
      node.slug = createPageSlug(current.page.name, current.page.page_key);
    }

    nodes.set(current.page.page_key, node);
  }

  return nodes.get(rootPage.page_key) ?? null;
}

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
 * Adds computed `id` and `slug` fields to each page.
 */
export const useGetMediaPagesQuery = () => {
  const { data, ...rest } = useGetPagesQuery();

  const mediaPages = useMemo(
    (): Array<MediaPage> =>
      data?.pages ? flattenPagesToMedia(data.pages) : [],
    [data?.pages],
  );

  return {
    ...rest,
    data: mediaPages,
  };
};

/**
 * Query hook for getting a hierarchical pages tree that includes only nodes
 * with media pages in their subtree.
 */
export const useGetPagesTreeQuery = () => {
  const { data, ...rest } = useGetPagesQuery();

  const pagesTree = useMemo(
    () => (data?.pages ? buildPagesTree(data.pages) : null),
    [data?.pages],
  );

  return {
    ...rest,
    data: pagesTree,
  };
};

/** Length of the slug suffix including the dash (e.g., "-abc12345" = 9 chars) */
const SLUG_SUFFIX_LENGTH = 9; // 1 dash + 8 char ID

/**
 * Extracts the name-slug part from a full slug (without the ID suffix).
 * E.g., "my-search-abc12345" → "my-search"
 */
function extractNameSlug(slug: string): string | null {
  if (slug.length <= SLUG_SUFFIX_LENGTH) return null;
  return slug.slice(0, -SLUG_SUFFIX_LENGTH);
}

export type PageResolution =
  | { page: MediaPage; needsRedirect: false }
  | { page: MediaPage; needsRedirect: true }
  | null;

/**
 * Resolves a URL parameter to a page_key.
 * Resolution order:
 * 1. If param matches any existing page_key exactly, returns it (ID passthrough)
 * 2. If param matches any slug exactly, returns that page
 * 3. If param looks like a slug with ID suffix (e.g., "my-search-abc12345"),
 *    finds first page whose name-slug matches exactly (fallback for when
 *    Hydrus restarts and page_keys change). This won't match
 *    "my-search-extended-xyz" when looking for "my-search-abc12345".
 *    Returns needsRedirect: true so caller can redirect to correct URL.
 * - Returns null if no match found
 */
export function resolvePageKeyFromParam(
  param: string,
  pages: Array<MediaPage>,
): PageResolution {
  // First check if param is an exact page_key match
  const exactMatch = pages.find((page) => page.page_key === param);
  if (exactMatch) {
    return { page: exactMatch, needsRedirect: false };
  }

  // Otherwise try to match by slug
  const slugMatch = pages.find((page) => page.slug === param);
  if (slugMatch) {
    return { page: slugMatch, needsRedirect: false };
  }

  // Fallback: try to match by name-slug (without the ID suffix)
  // Slug format is "name-slug-abc12345" where suffix is 8-char ID
  const paramNameSlug = extractNameSlug(param);
  if (paramNameSlug) {
    const nameSlugMatch = pages.find(
      (page) => extractNameSlug(page.slug) === paramNameSlug,
    );
    if (nameSlugMatch) {
      return { page: nameSlugMatch, needsRedirect: true };
    }
  }

  return null;
}

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
