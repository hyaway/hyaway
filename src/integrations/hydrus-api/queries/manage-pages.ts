// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addFilesToPage,
  createPage,
  focusPage,
  getPageInfo,
  getPages,
  refreshPage,
} from "../api-client";
import { useIsApiConfigured } from "../hydrus-config-store";
import { PageState, PageType, Permission } from "../models";
import { useHasPermission } from "./access";

import type { QueryClient } from "@tanstack/react-query";
import type { FileIdentifiers } from "../api-client";
import type { CreatePageOptions, MediaPage, Page } from "../models";

import { createPageSlug } from "@/lib/format-utils";
import {
  getScratchpadPageLocation,
  getScratchpadPageName,
} from "@/stores/pages-settings-store";

const HYAWAY_PAGE_NAME = "hyAway";

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

export type PageOfPagesDestination = {
  pageKey: string;
  label: string;
};

export type PageOfPagesDestinationSection = PageOfPagesDestination & {
  descendants: Array<PageOfPagesDestination>;
};

const isPageOfPages = (page: Pick<Page, "page_type">) =>
  page.page_type === PageType.PAGE_OF_PAGES;

const isFileSearchPage = (page: Pick<Page, "page_type">) =>
  page.page_type === PageType.FILE_SEARCH;

const findRootPageOfPages = (rootPage: Page, name: string) =>
  rootPage.pages?.find((page) => page.name === name && isPageOfPages(page)) ??
  null;

const findFileSearchChildPage = (page: Page, name: string) =>
  page.pages?.find((child) => child.name === name && isFileSearchPage(child)) ??
  null;

async function getOrCreateScratchpadPageKey(
  queryClient: QueryClient,
): Promise<string> {
  const scratchpadPageLocation = getScratchpadPageLocation();
  const scratchpadPageName = getScratchpadPageName();
  const pagesResponse = await queryClient.ensureQueryData({
    queryKey: ["getPages"],
    queryFn: getPages,
  });
  const rootPage = pagesResponse.pages;

  if (scratchpadPageLocation === "root") {
    const scratchpadPage = findFileSearchChildPage(
      rootPage,
      scratchpadPageName,
    );
    if (scratchpadPage) {
      return scratchpadPage.page_key;
    }

    return (
      await createPage({
        page_type: PageType.FILE_SEARCH,
        page_name: scratchpadPageName,
        focus_page: false,
      })
    ).page_key;
  }

  const hyAwayPage = findRootPageOfPages(rootPage, HYAWAY_PAGE_NAME);

  if (hyAwayPage) {
    const scratchpadPage = findFileSearchChildPage(
      hyAwayPage,
      scratchpadPageName,
    );
    if (scratchpadPage) {
      return scratchpadPage.page_key;
    }
  }

  const hyAwayPageKey = hyAwayPage
    ? hyAwayPage.page_key
    : (
        await createPage({
          page_type: PageType.PAGE_OF_PAGES,
          page_name: HYAWAY_PAGE_NAME,
          focus_page: false,
        })
      ).page_key;

  const scratchpadPage = await createPage({
    page_type: PageType.FILE_SEARCH,
    page_name: scratchpadPageName,
    page_of_pages_key: hyAwayPageKey,
    focus_page: false,
  });

  return scratchpadPage.page_key;
}

function collectPageOfPagesDescendants(
  page: Page,
  path: Array<string>,
  out: Array<PageOfPagesDestination>,
) {
  for (const child of page.pages ?? []) {
    if (!isPageOfPages(child)) continue;

    const childPath = [...path, child.name];
    out.push({
      pageKey: child.page_key,
      label: `./${childPath.slice(1).join("/")}`,
    });
    collectPageOfPagesDescendants(child, childPath, out);
  }
}

export function buildPageOfPagesDestinationSections(
  rootPage: Page,
): Array<PageOfPagesDestinationSection> {
  const sections: Array<PageOfPagesDestinationSection> = [];

  for (const child of rootPage.pages ?? []) {
    if (!isPageOfPages(child)) continue;

    const descendants: Array<PageOfPagesDestination> = [];
    collectPageOfPagesDescendants(child, [child.name], descendants);

    sections.push({
      pageKey: child.page_key,
      label: child.name,
      descendants,
    });
  }

  return sections;
}

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
  const query = useGetPagesQuery();

  const mediaPages = useMemo(
    (): Array<MediaPage> =>
      query.data?.pages ? flattenPagesToMedia(query.data.pages) : [],
    [query.data?.pages],
  );

  return {
    data: mediaPages,
    isPending: query.isPending,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Query hook for getting a hierarchical pages tree that includes only nodes
 * with media pages in their subtree.
 */
export const useGetPagesTreeQuery = () => {
  const query = useGetPagesQuery();

  const pagesTree = useMemo(
    () => (query.data?.pages ? buildPagesTree(query.data.pages) : null),
    [query.data?.pages],
  );

  return {
    data: pagesTree,
    isPending: query.isPending,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
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

export const useCreatePageMutation = () => {
  const queryClient = useQueryClient();
  const isConfigured = useIsApiConfigured();
  const hasPermission = useHasPermission(Permission.MANAGE_PAGES);

  return useMutation({
    mutationFn: async (options: CreatePageOptions) => {
      if (!isConfigured) {
        throw new Error("Hydrus API session not established.");
      }
      if (!hasPermission) {
        throw new Error("Hydrus API key is missing Manage pages permission.");
      }
      return createPage(options);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["getPages"],
      });
    },
    mutationKey: ["createRemotePage"],
  });
};

export const useAddFilesToScratchpadMutation = () => {
  const queryClient = useQueryClient();
  const isConfigured = useIsApiConfigured();
  const hasPermission = useHasPermission(Permission.MANAGE_PAGES);

  return useMutation({
    mutationFn: async (fileIdentifiers: FileIdentifiers) => {
      if (!isConfigured) {
        throw new Error("Hydrus API session not established.");
      }
      if (!hasPermission) {
        throw new Error("Hydrus API key is missing Manage pages permission.");
      }

      const scratchpadPageKey = await getOrCreateScratchpadPageKey(queryClient);
      await addFilesToPage({
        ...fileIdentifiers,
        page_key: scratchpadPageKey,
      });
      return scratchpadPageKey;
    },
    onSuccess: (scratchpadPageKey) => {
      queryClient.invalidateQueries({
        queryKey: ["getPages"],
      });
      queryClient.invalidateQueries({
        queryKey: ["getPageInfo", scratchpadPageKey],
      });
    },
    mutationKey: ["addFilesToScratchpad"],
  });
};
