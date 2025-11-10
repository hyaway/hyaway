import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import z from "zod";
import { BaseResponseSchema, HYDRUS_API_HEADER_ACCESS_KEY } from "./hydrus-api";
import { useApiAccessKey, useApiEndpoint } from "./hydrus-config-store";
import { simpleHash } from "@/lib/utils";

// ============================================================================
// Constants and Enums
// ============================================================================

/**
 * Page type enumeration
 */
export enum PageType {
  GALLERY_DOWNLOADER = 1,
  SIMPLE_DOWNLOADER = 2,
  HARD_DRIVE_IMPORT = 3,
  PETITIONS = 5,
  FILE_SEARCH = 6,
  URL_DOWNLOADER = 7,
  DUPLICATES = 8,
  THREAD_WATCHER = 9,
  PAGE_OF_PAGES = 10,
}

/**
 * Page state enumeration
 */
export enum PageState {
  READY = 0,
  INITIALIZING = 1,
  SEARCHING_LOADING = 2,
  SEARCH_CANCELLED = 3,
}

/**
 * Page schema - recursive structure for nested pages
 */
const PageSchema: z.ZodType<Page> = z.lazy(() =>
  z.object({
    name: z.string(),
    page_key: z.string(),
    page_state: z.enum(PageState),
    page_type: z.enum(PageType),
    is_media_page: z.boolean(),
    selected: z.boolean(),
    pages: z.array(PageSchema).optional(),
  }),
);

export type Page = {
  name: string;
  page_key: string;
  page_state: PageState;
  page_type: PageType;
  is_media_page: boolean;
  selected: boolean;
  pages?: Array<Page>;
};

const GetPagesResponseSchema = BaseResponseSchema.extend({
  pages: PageSchema, // Singular page at to level
});

export type GetPagesResponse = z.infer<typeof GetPagesResponseSchema>;

const MediaSchema = z.object({
  num_files: z.number(),
  hash_ids: z.array(z.number()),
});

const PageInfoSchema = z.object({
  name: z.string(),
  page_key: z.string(),
  page_state: z.enum(PageState),
  page_type: z.enum(PageType),
  is_media_page: z.boolean(),
  media: MediaSchema,
});

const GetPageInfoResponseSchema = BaseResponseSchema.extend({
  page_info: PageInfoSchema,
});

export type GetPageInfoResponse = z.infer<typeof GetPageInfoResponseSchema>;

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get the page structure of the current UI session.
 * @param apiEndpoint The base URL of the Hydrus API.
 * @param apiAccessKey The access key for authentication.
 * @returns A promise that resolves to the pages structure.
 */
export async function getPages(
  apiEndpoint: string,
  apiAccessKey: string,
): Promise<GetPagesResponse> {
  const response = await axios.get(`${apiEndpoint}/manage_pages/get_pages`, {
    headers: {
      [HYDRUS_API_HEADER_ACCESS_KEY]: apiAccessKey,
    },
  });
  return GetPagesResponseSchema.parse(response.data);
}

/**
 * Get information about a specific page.
 * @param apiEndpoint The base URL of the Hydrus API.
 * @param apiAccessKey The access key for authentication.
 * @param pageKey The key of the page to get info for.
 * @param simple Whether to get simple info.
 * @returns A promise that resolves to the page info.
 */
export async function getPageInfo(
  apiEndpoint: string,
  apiAccessKey: string,
  pageKey: string,
  simple = true,
): Promise<GetPageInfoResponse> {
  const response = await axios.get(
    `${apiEndpoint}/manage_pages/get_page_info`,
    {
      headers: {
        [HYDRUS_API_HEADER_ACCESS_KEY]: apiAccessKey,
      },
      params: {
        page_key: pageKey,
        simple,
      },
    },
  );
  return GetPageInfoResponseSchema.parse(response.data);
}

/**
 * Refresh a page in the main GUI.
 * @param apiEndpoint The base URL of the Hydrus API.
 * @param apiAccessKey The access key for authentication.
 * @param pageKey The key of the page to refresh.
 */
export async function refreshPage(
  apiEndpoint: string,
  apiAccessKey: string,
  pageKey: string,
): Promise<void> {
  await axios.post(
    `${apiEndpoint}/manage_pages/refresh_page`,
    {
      page_key: pageKey,
    },
    {
      headers: {
        [HYDRUS_API_HEADER_ACCESS_KEY]: apiAccessKey,
        "Content-Type": "application/json",
      },
    },
  );
}

/**
 * 'Show' a page in the main GUI, making it the current page in view.
 * @param apiEndpoint The base URL of the Hydrus API.
 * @param apiAccessKey The access key for authentication.
 * @param pageKey The key of the page to focus.
 */
export async function focusPage(
  apiEndpoint: string,
  apiAccessKey: string,
  pageKey: string,
): Promise<void> {
  await axios.post(
    `${apiEndpoint}/manage_pages/focus_page`,
    {
      page_key: pageKey,
    },
    {
      headers: {
        [HYDRUS_API_HEADER_ACCESS_KEY]: apiAccessKey,
        "Content-Type": "application/json",
      },
    },
  );
}

// ============================================================================
// Query Hooks
// ============================================================================

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

export const useRefreshPageMutation = () => {
  const queryClient = useQueryClient();
  const apiEndpoint = useApiEndpoint();
  const apiAccessKey = useApiAccessKey();

  return useMutation({
    mutationFn: (pageKey: string) => {
      if (!apiEndpoint || !apiAccessKey || !pageKey) {
        throw new Error("API endpoint, access key, and page key are required.");
      }
      return refreshPage(apiEndpoint, apiAccessKey, pageKey);
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
  });
};

export const useFocusPageMutation = () => {
  const apiEndpoint = useApiEndpoint();
  const apiAccessKey = useApiAccessKey();

  return useMutation({
    mutationFn: (pageKey: string) => {
      if (!apiEndpoint || !apiAccessKey || !pageKey) {
        throw new Error("API endpoint, access key, and page key are required.");
      }
      return focusPage(apiEndpoint, apiAccessKey, pageKey);
    },
  });
};
