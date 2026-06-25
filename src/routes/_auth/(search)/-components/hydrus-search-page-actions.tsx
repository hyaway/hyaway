// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useMemo } from "react";
import { IconFolder, IconFolderPlus } from "@tabler/icons-react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import type { FloatingFooterAction } from "@/components/page-shell/page-floating-footer";
import type { HydrusTagSearch } from "@/integrations/hydrus-api/models";
import type { SearchState } from "@/stores/search-defaults";
import { OverflowActionItem } from "@/components/page-shell/page-floating-footer";
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
  formatHydrusPagePath,
  useCreatePageMutation,
  useGetPagesQuery,
} from "@/integrations/hydrus-api/queries/manage-pages";
import { usePermissions } from "@/integrations/hydrus-api/queries/permissions";

export function useHydrusSearchPageActions({
  searchState,
  displayName,
  searchTags,
}: {
  searchState: SearchState | undefined;
  displayName: string;
  searchTags: HydrusTagSearch;
}): Array<FloatingFooterAction> {
  const navigate = useNavigate();
  const apiVersionQuery = useApiVersionQuery();
  const permissions = usePermissions();
  const createHydrusPageMutation = useCreatePageMutation();
  const { data: pagesData } = useGetPagesQuery();

  const pageOfPagesSections = useMemo(
    () =>
      pagesData?.pages
        ? buildPageOfPagesDestinationSections(pagesData.pages)
        : [],
    [pagesData?.pages],
  );

  const handleOpenCreatedPage = useCallback(
    (pageKey: string) => {
      navigate({ to: "/pages/$pageId", params: { pageId: pageKey } });
    },
    [navigate],
  );

  const handleCreateHydrusPage = useCallback(
    (pageOfPagesKey?: string, parentPath?: string) => {
      if (!searchState || searchTags.length === 0) return;

      createHydrusPageMutation.mutate(
        {
          page_type: PageType.FILE_SEARCH,
          page_name: displayName,
          page_of_pages_key: pageOfPagesKey,
          focus_page: false,
          tags: searchTags,
          file_service_key: searchState.fileServiceKey ?? undefined,
          file_sort_type: searchState.sort.sortType,
          file_sort_asc: searchState.sort.sortAsc,
        },
        {
          onSuccess: (page) => {
            toast.success("Hydrus page created", {
              description: formatHydrusPagePath(page.page_name, parentPath),
              action: {
                label: "Open page",
                onClick: () => handleOpenCreatedPage(page.page_key),
              },
            });
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
      handleOpenCreatedPage,
      searchState,
      searchTags,
    ],
  );

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
        id: "create-hydrus-page-root",
        label: "Create Hydrus page",
        icon: IconFolderPlus,
        onClick: () => handleCreateHydrusPage(),
        disabled: createHydrusPageDisabled,
        title: createHydrusPageDisabledTitle,
        isPending: isCreating,
        overflowOnly: true,
      },
      {
        id: "create-hydrus-page-in-group",
        label: "Create in...",
        icon: IconFolder,
        onClick: () => undefined,
        disabled: createHydrusPageDisabled || pageOfPagesSections.length === 0,
        title: createHydrusPageDisabledTitle,
        overflowOnly: true,
        renderOverflow: (action) =>
          createHydrusPageDisabled || pageOfPagesSections.length === 0 ? (
            <OverflowActionItem action={action} />
          ) : (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <action.icon />
                {action.label}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="max-h-[min(60dvh,var(--available-height))] min-w-64">
                {pageOfPagesSections.map((section) =>
                  section.descendants.length === 0 ? (
                    <DropdownMenuItem
                      key={section.pageKey}
                      onClick={() =>
                        handleCreateHydrusPage(section.pageKey, section.path)
                      }
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
                            handleCreateHydrusPage(
                              section.pageKey,
                              section.path,
                            )
                          }
                          disabled={isCreating}
                        >
                          /
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {section.descendants.map((destination) => (
                          <DropdownMenuItem
                            key={destination.pageKey}
                            onClick={() =>
                              handleCreateHydrusPage(
                                destination.pageKey,
                                destination.path,
                              )
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
    handleCreateHydrusPage,
    pageOfPagesSections,
    permissions,
    searchState,
    searchTags,
  ]);
}
