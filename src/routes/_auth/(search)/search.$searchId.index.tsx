// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import {
  IconCopy,
  IconDeviceFloppy,
  IconFolderPlus,
  IconInfoCircle,
  IconPin,
  IconPinned,
  IconPinnedOff,
  IconTrash,
} from "@tabler/icons-react";
import {
  createFileRoute,
  linkOptions,
  useNavigate,
} from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import z from "zod";
import { SearchQueryBuilder } from "./-components/system-predicate-builder";
import { useHydrusSearchPageActions } from "./-components/hydrus-search-page-actions";
import {
  committedSearchQueryKey,
  useCommittedSearchFilesQuery,
} from "./-hooks/use-committed-search-query";
import { useSearchPageState } from "./-hooks/use-search-page-state";
import { queryToHydrusSearch } from "./-lib/query-to-hydrus-search";
import {
  getSearchSortColorHex,
  getSearchSortLabel,
} from "./-lib/search-sort-config";
import { SearchSettingsPopover } from "./-components/search-settings-popover";
import { SearchSortTag } from "./-components/search-sort-tag";
import type { FileLinkBuilder } from "@/components/thumbnail-gallery/thumbnail-gallery-item";
import type { FloatingFooterAction } from "@/components/page-shell/page-floating-footer";
import { copySearchCache } from "@/lib/search-entry-utils";
import { getThemeAdjustedColorFromHex } from "@/lib/color-utils";
import { EmptyState } from "@/components/page-shell/empty-state";
import { PageError } from "@/components/page-shell/page-error";
import { PageFloatingFooter } from "@/components/page-shell/page-floating-footer";
import { PageHeaderActions } from "@/components/page-shell/page-header-actions";
import { PageHeading } from "@/components/page-shell/page-heading";
import { RefetchButton } from "@/components/page-shell/refetch-button";
import { ThumbnailGalleryFloatingFooter } from "@/components/thumbnail-gallery/thumbnail-gallery-floating-footer";
import { ThumbnailGallery } from "@/components/thumbnail-gallery/thumbnail-gallery";
import { ThumbnailGalleryProvider } from "@/components/thumbnail-gallery/thumbnail-gallery-context";
import { ThumbnailGallerySkeleton } from "@/components/thumbnail-gallery/thumbnail-gallery-skeleton";
import { useThumbnailGalleryModel } from "@/components/thumbnail-gallery/use-thumbnail-gallery-model";
import { Button } from "@/components/ui-primitives/button";
import { SearchTagList } from "@/components/tag/tag-badge";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui-primitives/alert";
import {
  useCommittedSearch,
  useSearchDirty,
  useSearchDisplayName,
  useSearchPinned,
  useSearchQueriesActions,
  useSearchQueryEntry,
} from "@/stores/search-queries-store";
import {
  useLoadAllMetadataByDefault,
  useLoadAllMetadataWhenNamespaceSort,
} from "@/stores/metadata-settings-store";
import { useSearchSettingsActions } from "@/stores/search-settings-store";
import { useActiveTheme } from "@/stores/theme-store";
import { isNamespaceSortConfig } from "@/stores/search-defaults";

const SearchResultsSearchSchema = z.object({
  builder: z.boolean().optional(),
  instant: z.boolean().optional(),
});

export const Route = createFileRoute("/_auth/(search)/search/$searchId/")({
  validateSearch: (search) => SearchResultsSearchSchema.parse(search),
  component: SearchPage,
});

function SearchPage() {
  const { searchId, builderOpen, instant, instantSearch } =
    useSearchPageState();
  const displayName = useSearchDisplayName(searchId);
  const committed = useCommittedSearch(searchId);
  const theme = useActiveTheme();
  const isDirty = useSearchDirty(searchId);
  const isPinned = useSearchPinned(searchId);
  const { duplicateSearchEntry, removeSearchEntry, setSearchPinned } =
    useSearchQueriesActions();
  const entry = useSearchQueryEntry(searchId);
  const { setDefaultQuery } = useSearchSettingsActions();
  const navigate = useNavigate();
  const [preserveCurrentScroll, setPreserveCurrentScroll] = useState(false);
  const committedQuery = committed?.query;

  const searchTags = useMemo(
    () => (committedQuery ? queryToHydrusSearch(committedQuery) : []),
    [committedQuery],
  );
  const hydrusPageSearchState = committed ?? entry.staged;
  const hydrusPageSearchTags = useMemo(
    () => queryToHydrusSearch(hydrusPageSearchState.query),
    [hydrusPageSearchState.query],
  );

  const { data, isLoading, isFetching, isError, error } =
    useCommittedSearchFilesQuery(searchId);
  const queryClient = useQueryClient();

  const fileIds = data?.file_ids ?? [];
  const namespaceSort =
    committed && isNamespaceSortConfig(committed.sort)
      ? committed.sort
      : undefined;
  const loadAllMetadataByDefault = useLoadAllMetadataByDefault();
  const loadAllMetadataWhenNamespaceSort =
    useLoadAllMetadataWhenNamespaceSort();
  const reviewSource = { type: "searchPage", entryKey: searchId } as const;
  const {
    metadataQuery,
    shouldLoadAllMetadata,
    hasLoadedAllMetadata,
    loadAllMetadataAction,
    visibleFileIds,
    hiddenLabel,
    showHiddenFilesAction,
    galleryView,
  } = useThumbnailGalleryModel({
    fileIds,
    hiddenFileViewData: data,
    reviewSource,
    namespaceSort,
    requestAllMetadata: !!namespaceSort && loadAllMetadataWhenNamespaceSort,
  });
  const LoadAllMetadataIcon = loadAllMetadataAction.icon;
  const hasFiles = visibleFileIds.length > 0;
  const showNamespaceSortWarning =
    !!namespaceSort &&
    hasFiles &&
    !loadAllMetadataByDefault &&
    !loadAllMetadataWhenNamespaceSort &&
    !hasLoadedAllMetadata;
  const showGallery = !isLoading && !isError && hasFiles;

  const handleCommit = useCallback(() => {
    setPreserveCurrentScroll(true);
  }, []);

  const getFileLink = useCallback<FileLinkBuilder>(
    (fileId) =>
      linkOptions({
        to: "/search/$searchId/$fileId",
        params: { searchId, fileId: String(fileId) },
      }),
    [searchId],
  );

  const refetchButton = (
    <RefetchButton
      isFetching={isFetching}
      onRefetch={() =>
        queryClient.invalidateQueries({
          queryKey: committedSearchQueryKey(searchId),
        })
      }
    />
  );

  const handleSaveAsNew = useCallback(() => {
    const clonedSearchId = duplicateSearchEntry(searchId);
    copySearchCache(queryClient, searchId, clonedSearchId);
    navigate({
      to: "/search/$searchId",
      params: { searchId: clonedSearchId },
      search: (current) => ({ ...current, builder: builderOpen, instant }),
    });
  }, [
    builderOpen,
    instant,
    searchId,
    duplicateSearchEntry,
    navigate,
    queryClient,
  ]);

  const handleDelete = useCallback(() => {
    removeSearchEntry(searchId);
    navigate({ to: "/search" });
  }, [searchId, removeSearchEntry, navigate]);

  const handleTogglePinned = useCallback(() => {
    setSearchPinned(searchId, !isPinned);
  }, [searchId, isPinned, setSearchPinned]);

  const handleSavePendingAsDefault = useCallback(() => {
    setDefaultQuery(entry.staged);
  }, [entry.staged, setDefaultQuery]);

  const handleSaveActiveAsDefault = useCallback(() => {
    if (committed) setDefaultQuery(committed);
  }, [committed, setDefaultQuery]);

  const handleSaveSearchAsDefault = useCallback(() => {
    setDefaultQuery(committed ?? entry.staged);
  }, [committed, entry.staged, setDefaultQuery]);

  const hydrusPageActions = useHydrusSearchPageActions({
    searchState: hydrusPageSearchState,
    displayName,
    searchTags: hydrusPageSearchTags,
  });
  const saveAsHydrusPageAction = useMemo(
    () =>
      hydrusPageActions.find((action) => action.id === "create-hydrus-page"),
    [hydrusPageActions],
  );

  const searchActions = useMemo((): Array<FloatingFooterAction> => {
    const showDraftDefaultActions = !instantSearch && isDirty;
    const defaultActions: Array<FloatingFooterAction> = !showDraftDefaultActions
      ? [
          {
            id: "save-search-as-default",
            label: "Save as default",
            icon: IconDeviceFloppy,
            onClick: handleSaveSearchAsDefault,
            overflowOnly: true,
          },
        ]
      : [
          {
            id: "save-pending-as-default",
            label: "Save draft as default",
            icon: IconDeviceFloppy,
            onClick: handleSavePendingAsDefault,
            overflowOnly: true,
          },
          {
            id: "save-active-as-default",
            label: "Save current as default",
            icon: IconDeviceFloppy,
            onClick: handleSaveActiveAsDefault,
            disabled: !committed,
            overflowOnly: true,
          },
        ];

    return [
      ...defaultActions,
      {
        id: isPinned ? "unpin-search" : "pin-search",
        label: isPinned ? "Unpin" : "Pin",
        icon: isPinned ? IconPinnedOff : IconPin,
        onClick: handleTogglePinned,
        overflowOnly: true,
      },
      {
        id: "clone-search",
        label: "Clone",
        icon: IconCopy,
        onClick: handleSaveAsNew,
        overflowOnly: true,
      },
      ...hydrusPageActions,
      loadAllMetadataAction,
      ...(showHiddenFilesAction ? [showHiddenFilesAction] : []),
      {
        id: "delete-search",
        label: "Delete",
        icon: IconTrash,
        onClick: handleDelete,
        variant: "destructive" as const,
        overflowOnly: true,
      },
    ];
  }, [
    instantSearch,
    isDirty,
    handleSavePendingAsDefault,
    handleSaveActiveAsDefault,
    handleSaveSearchAsDefault,
    isPinned,
    handleTogglePinned,
    handleSaveAsNew,
    hydrusPageActions,
    loadAllMetadataAction,
    showHiddenFilesAction,
    handleDelete,
  ]);
  const fileCount = visibleFileIds.length;
  const fileCountLabel = `${fileCount} ${fileCount === 1 ? "file" : "files"}`;
  const pageTitle =
    !isLoading && !isError
      ? `${displayName} (${fileCountLabel}${hiddenLabel ? `, ${hiddenLabel}` : ""})`
      : displayName;

  const activeLabel = isLoading
    ? "Loading files for:"
    : isError
      ? "Error for query:"
      : "Results for:";
  const showActiveSearchTags =
    !instantSearch && isDirty && searchTags.length > 0;

  return (
    <>
      <>
        <PageHeading
          title={pageTitle}
          eyebrow={
            isPinned ? (
              <span className="text-muted-foreground inline-flex items-center gap-1.5 font-medium">
                <IconPinned className="size-4" />
                Pinned
              </span>
            ) : undefined
          }
        />
        <div className="flex flex-col gap-2 pb-2">
          <SearchQueryBuilder onCommit={handleCommit} />
        </div>
        {showActiveSearchTags && (
          <div className="flex flex-col gap-1.5 pt-3 pb-3">
            <span className="text-muted-foreground text-sm font-medium">
              {activeLabel}
            </span>
            <SearchTagList tags={searchTags} badgeSize="compact-mobile-wrap">
              {committed && (
                <SearchSortTag
                  label={getSearchSortLabel(committed.sort)}
                  sort={committed.sort}
                  size="compact-mobile-wrap"
                  color={getThemeAdjustedColorFromHex(
                    getSearchSortColorHex(committed.sort),
                    theme,
                  )}
                />
              )}
            </SearchTagList>
          </div>
        )}
        {isLoading && searchTags.length > 0 && <ThumbnailGallerySkeleton />}
        {isError && committed && (
          <PageError
            error={error}
            fallbackMessage="An unknown error occurred while searching."
          />
        )}
        {!isLoading && !isError && showNamespaceSortWarning && (
          <>
            <Alert className="mb-3 gap-1 pb-3">
              <IconInfoCircle className="size-4" />
              <AlertTitle>Namespace sorting needs more metadata</AlertTitle>
              <AlertDescription className="flex min-w-0 flex-col gap-2">
                <span className="min-w-0 text-wrap">
                  Only loaded items are sorted right now.
                </span>
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="max-w-full min-w-0"
                    onClick={loadAllMetadataAction.onClick}
                    disabled={loadAllMetadataAction.disabled}
                    title={loadAllMetadataAction.title}
                  >
                    <LoadAllMetadataIcon className="size-4 shrink-0" />
                    <span className="min-w-0 truncate sm:hidden">
                      Load metadata
                    </span>
                    <span className="hidden min-w-0 truncate sm:inline">
                      {loadAllMetadataAction.label}
                    </span>
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
            {fileCount > 2000 && (
              <Alert className="mb-3 gap-1 pb-3">
                <IconInfoCircle className="size-4" />
                <AlertTitle>There are a lot of results</AlertTitle>
                <AlertDescription className="flex min-w-0 flex-col gap-2">
                  <span className="min-w-0 text-wrap">
                    Once you're happy with the query, consider saving as a
                    Hydrus page instead of namespace sorting here.
                  </span>
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="max-w-full min-w-0"
                      onClick={saveAsHydrusPageAction?.onClick}
                      disabled={
                        !saveAsHydrusPageAction ||
                        saveAsHydrusPageAction.disabled
                      }
                      title={saveAsHydrusPageAction?.title}
                    >
                      <IconFolderPlus className="size-4 shrink-0" />
                      <span className="min-w-0 truncate">
                        {saveAsHydrusPageAction?.isPending
                          ? "Saving"
                          : "Save page"}
                      </span>
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
        {showGallery && (
          <ThumbnailGalleryProvider
            reviewFileIds={galleryView.reviewFileIds}
            reviewSource={reviewSource}
          >
            <ThumbnailGallery
              sourceFileIds={fileIds}
              metadataQuery={metadataQuery}
              galleryView={galleryView}
              loadAll={shouldLoadAllMetadata}
              getFileLink={getFileLink}
              preserveCurrentScroll={preserveCurrentScroll}
            />
            <ThumbnailGalleryFloatingFooter
              leftContent={refetchButton}
              actions={searchActions}
            />
          </ThumbnailGalleryProvider>
        )}
        {!isLoading && !isError && !hasFiles && searchTags.length > 0 && (
          <EmptyState message="No files found for the current search." />
        )}
        {!isLoading && !isError && !hasFiles && searchTags.length === 0 && (
          <EmptyState
            message={
              instantSearch
                ? "Add filters above to search."
                : "Add filters above and click Search."
            }
          />
        )}
      </>
      <PageHeaderActions>
        <SearchSettingsPopover />
      </PageHeaderActions>
      {!showGallery && (
        <PageFloatingFooter
          leftContent={refetchButton}
          actions={searchActions}
        />
      )}
    </>
  );
}
