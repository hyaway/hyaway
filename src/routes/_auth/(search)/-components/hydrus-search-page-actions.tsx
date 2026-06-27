// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useMemo } from "react";
import { IconFolder, IconFolderPlus } from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import type { FloatingFooterAction } from "@/components/page-shell/page-floating-footer";
import type { HydrusTagSearch } from "@/integrations/hydrus-api/models";
import type { SearchState } from "@/stores/search-defaults";
import { OverflowActionItem } from "@/components/page-shell/page-floating-footer";
import { isNamespaceSortConfig } from "@/stores/search-defaults";
import { useSearchQueriesActions } from "@/stores/search-queries-store";
import { useDeleteSearchAfterPageSave } from "@/stores/search-settings-store";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui-primitives/dropdown-menu";
import {
  MIN_CREATE_PAGE_CLIENT_API_VERSION,
  PageType,
  Permission,
} from "@/integrations/hydrus-api/models";
import { useApiVersionQuery } from "@/integrations/hydrus-api/queries/access";
import {
  buildPageOfPagesDestinationSections,
  ensurePageOfPagesPath,
  useCreatePageMutation,
  useGetPagesQuery,
} from "@/integrations/hydrus-api/queries/manage-pages";
import { usePermissions } from "@/integrations/hydrus-api/queries/permissions";

export const HYAWAY_PAGE_NAME = "hyAway";
export const SEARCH_PAGE_NAME = "search";
export const PINNED_SEARCH_PAGE_NAME = "pinned";

function getPageSortOptions(sort: SearchState["sort"]) {
  if (isNamespaceSortConfig(sort)) {
    return {
      file_sort_namespaces: sort.namespaces,
      file_sort_asc: sort.sortAsc,
    };
  }

  return {
    file_sort_type: sort.sortType,
    file_sort_asc: sort.sortAsc,
  };
}

export function useHydrusSearchPageActions({
  searchId,
  searchIsPinned = false,
  searchState,
  displayName,
  searchTags,
}: {
  searchId?: string;
  searchIsPinned?: boolean;
  searchState: SearchState | undefined;
  displayName: string;
  searchTags: HydrusTagSearch;
}): Array<FloatingFooterAction> {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const apiVersionQuery = useApiVersionQuery();
  const permissions = usePermissions();
  const createHydrusPageMutation = useCreatePageMutation();
  const { data: pagesData } = useGetPagesQuery();
  const deleteSearchAfterPageSave = useDeleteSearchAfterPageSave();
  const { removeSearchEntry } = useSearchQueriesActions();

  const pageOfPagesSections = useMemo(
    () =>
      pagesData?.pages
        ? buildPageOfPagesDestinationSections(pagesData.pages)
        : [],
    [pagesData?.pages],
  );

  const handleOpenCreatedPage = useCallback(
    (pageKey: string, replace: boolean) => {
      return navigate({
        to: "/pages/$pageId",
        params: { pageId: pageKey },
        replace,
      });
    },
    [navigate],
  );

  const handleCreateSuccess = useCallback(
    async (pageKey: string) => {
      const shouldDeleteSearch = deleteSearchAfterPageSave && Boolean(searchId);

      try {
        await handleOpenCreatedPage(pageKey, shouldDeleteSearch);
      } catch (error) {
        toast.error("Hydrus page created, but hyAway could not open it", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
        return;
      }

      if (shouldDeleteSearch && searchId) {
        removeSearchEntry(searchId);
      }
    },
    [
      deleteSearchAfterPageSave,
      handleOpenCreatedPage,
      removeSearchEntry,
      searchId,
    ],
  );

  const handleCreateHydrusPage = useCallback(
    (pageOfPagesKey?: string) => {
      if (!searchState || searchTags.length === 0) return;

      createHydrusPageMutation.mutate(
        {
          page_type: PageType.FILE_SEARCH,
          page_name: displayName,
          page_of_pages_key: pageOfPagesKey,
          focus_page: false,
          tags: searchTags,
          file_service_key: searchState.fileServiceKey ?? undefined,
          ...getPageSortOptions(searchState.sort),
        },
        {
          onSuccess: (page) => {
            void handleCreateSuccess(page.page_key);
          },
          onError: (error) => {
            toast.error("Failed to create Hydrus page", {
              description:
                error instanceof Error ? error.message : "Unknown error",
            });
          },
        },
      );
    },
    [
      createHydrusPageMutation,
      displayName,
      handleCreateSuccess,
      searchState,
      searchTags,
    ],
  );

  const handleCreateDefaultHydrusPage = useCallback(async () => {
    if (!searchState || searchTags.length === 0) return;

    try {
      const searchParentPage = await ensurePageOfPagesPath(
        queryClient,
        searchIsPinned
          ? [HYAWAY_PAGE_NAME, PINNED_SEARCH_PAGE_NAME]
          : [HYAWAY_PAGE_NAME, SEARCH_PAGE_NAME],
      );
      const page = await createHydrusPageMutation.mutateAsync({
        page_type: PageType.FILE_SEARCH,
        page_name: displayName,
        page_of_pages_key: searchParentPage.pageKey,
        focus_page: false,
        tags: searchTags,
        file_service_key: searchState.fileServiceKey ?? undefined,
        ...getPageSortOptions(searchState.sort),
      });

      void handleCreateSuccess(page.page_key);
    } catch (error) {
      toast.error("Failed to create Hydrus page", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }, [
    createHydrusPageMutation,
    displayName,
    handleCreateSuccess,
    queryClient,
    searchIsPinned,
    searchState,
    searchTags,
  ]);

  return useMemo((): Array<FloatingFooterAction> => {
    const canCreateHydrusPage = Boolean(searchState) && searchTags.length > 0;
    const canCreateHydrusPageWithClientApi =
      (apiVersionQuery.data?.version ?? 0) >=
      MIN_CREATE_PAGE_CLIENT_API_VERSION;
    const canManagePages = permissions.hasPermission(Permission.MANAGE_PAGES);
    const isCreating = createHydrusPageMutation.isPending;
    const createHydrusPageDisabled =
      !canCreateHydrusPage ||
      !canCreateHydrusPageWithClientApi ||
      !permissions.isFetched ||
      !canManagePages ||
      isCreating;
    const createHydrusPageDisabledTitle = !canCreateHydrusPageWithClientApi
      ? "Requires Hydrus v676"
      : !permissions.isFetched
        ? "Checking Hydrus permissions."
        : !canManagePages
          ? "Requires Manage pages permission."
          : !searchState
            ? "Add filters first."
            : searchTags.length === 0
              ? "Add filters first."
              : undefined;

    return [
      {
        id: "create-hydrus-page",
        label: "Save as page",
        icon: IconFolderPlus,
        onClick: handleCreateDefaultHydrusPage,
        disabled: createHydrusPageDisabled,
        title: createHydrusPageDisabledTitle,
        isPending: isCreating,
        overflowOnly: true,
      },
      {
        id: "create-hydrus-page-in-group",
        label: "Save as page in...",
        icon: IconFolder,
        onClick: () => undefined,
        disabled: createHydrusPageDisabled,
        title: createHydrusPageDisabledTitle,
        isPending: isCreating,
        overflowOnly: true,
        renderOverflow: (action) =>
          createHydrusPageDisabled ? (
            <OverflowActionItem action={action} />
          ) : (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <action.icon />
                {action.label}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="max-h-[min(60dvh,var(--available-height))] min-w-64">
                <DropdownMenuItem
                  onClick={() => handleCreateHydrusPage()}
                  disabled={isCreating}
                >
                  (new page here)
                </DropdownMenuItem>
                {pageOfPagesSections.length > 0 ? (
                  <DropdownMenuSeparator />
                ) : null}
                {pageOfPagesSections.map((section) =>
                  section.descendants.length === 0 ? (
                    <DropdownMenuItem
                      key={section.pageKey}
                      onClick={() => handleCreateHydrusPage(section.pageKey)}
                      disabled={isCreating}
                    >
                      {section.label}
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuSub key={section.pageKey}>
                      <DropdownMenuSubTrigger>
                        {section.label}
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="max-h-[min(60dvh,var(--available-height))] min-w-64">
                        <DropdownMenuItem
                          onClick={() =>
                            handleCreateHydrusPage(section.pageKey)
                          }
                          disabled={isCreating}
                        >
                          (new page here)
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {section.descendants.map((destination) => (
                          <DropdownMenuItem
                            key={destination.pageKey}
                            onClick={() =>
                              handleCreateHydrusPage(destination.pageKey)
                            }
                            disabled={isCreating}
                          >
                            <span className="max-w-80 truncate">
                              {destination.label}
                            </span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  ),
                )}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          ),
      },
    ];
  }, [
    apiVersionQuery.data?.version,
    createHydrusPageMutation.isPending,
    handleCreateDefaultHydrusPage,
    handleCreateHydrusPage,
    pageOfPagesSections,
    permissions,
    searchState,
    searchTags,
  ]);
}
