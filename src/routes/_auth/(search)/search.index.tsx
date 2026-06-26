// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import {
  IconCopy,
  IconDots,
  IconEdit,
  IconInfoCircle,
  IconPin,
  IconPinned,
  IconPinnedOff,
  IconSearch,
  IconTrash,
} from "@tabler/icons-react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { Fragment, useCallback, useMemo, useRef, useState } from "react";
import { queryToHydrusSearch } from "./-lib/query-to-hydrus-search";
import {
  getSearchSortColorHex,
  getSearchSortLabel,
} from "./-lib/search-sort-config";
import { useHydrusSearchPageActions } from "./-components/hydrus-search-page-actions";
import { SearchIndexSettingsPopover } from "./-components/search-index-settings-popover";
import { SearchSortTag } from "./-components/search-sort-tag";
import type { SavedSearchSort } from "@/stores/search-settings-store";
import { copySearchCache } from "@/lib/search-entry-utils";
import { getThemeAdjustedColorFromHex } from "@/lib/color-utils";
import { SavedSearchSortSelect } from "@/components/settings/saved-search-sort-select";
import { OverflowActionItem } from "@/components/page-shell/page-floating-footer";
import { PageHeaderActions } from "@/components/page-shell/page-header-actions";
import { PageHeading } from "@/components/page-shell/page-heading";
import { SearchTagList } from "@/components/tag/tag-badge";
import { Badge } from "@/components/ui-primitives/badge";
import { TagAutocompleteInput } from "@/components/tag/tag-autocomplete-input";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui-primitives/alert";
import { Button } from "@/components/ui-primitives/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui-primitives/dropdown-menu";
import { Input } from "@/components/ui-primitives/input";
import {
  nextDraftName,
  useOtherSearchKeys,
  usePinnedSearchKeys,
  useSearchDisplayName,
  useSearchPinned,
  useSearchQueriesActions,
  useSearchQueryEntry,
} from "@/stores/search-queries-store";
import {
  useSavedSearchSort,
  useSearchSettingsActions,
} from "@/stores/search-settings-store";
import { useActiveTheme } from "@/stores/theme-store";
import { Separator } from "@/components/ui-primitives/separator";

export const Route = createFileRoute("/_auth/(search)/search/")({
  component: SearchIndex,
});

function SearchIndex() {
  const pinnedSearchKeys = usePinnedSearchKeys();
  const otherSearchKeys = useOtherSearchKeys();
  const searchKeys = useMemo(
    () => [...pinnedSearchKeys, ...otherSearchKeys],
    [pinnedSearchKeys, otherSearchKeys],
  );
  const navigate = useNavigate();
  const { createSearchEntry, createSearchFromTag } = useSearchQueriesActions();
  const savedSearchSort = useSavedSearchSort();
  const { setSavedSearchSort } = useSearchSettingsActions();

  const handleAddNew = useCallback(() => {
    const displayName = nextDraftName();
    const searchId = createSearchEntry(displayName);
    navigate({ to: "/search/$searchId", params: { searchId } });
  }, [createSearchEntry, navigate]);

  const handleQuickSearch = useCallback(
    (tag: string) => {
      const trimmed = tag.trim();
      if (!trimmed) {
        handleAddNew();
        return;
      }
      const searchId = createSearchFromTag(trimmed);
      navigate({ to: "/search/$searchId", params: { searchId } });
    },
    [createSearchFromTag, navigate, handleAddNew],
  );

  return (
    <>
      <PageHeading title="Search" />
      <div className="flex flex-col gap-3 pt-2 sm:gap-4">
        <QuickTagSearch onSearch={handleQuickSearch} />
        <Separator />
        {searchKeys.length > 0 && (
          <SavedSearchHeader
            count={searchKeys.length}
            pinnedCount={pinnedSearchKeys.length}
            sort={savedSearchSort}
            onSortChange={setSavedSearchSort}
          />
        )}
        <SearchEntryList searchKeys={searchKeys} />
        {searchKeys.length > 0 && (
          <>
            <Separator />
            <Alert>
              <IconInfoCircle />
              <AlertTitle>Viewing a saved search often?</AlertTitle>
              <AlertDescription>
                Creating a matching page in Hydrus will make it load much
                faster.
                <br />
                <br />
                Use "Save as page" to create under hyAway / search, or "Save as
                page in..." to choose the top page notebook or another page of
                pages.
              </AlertDescription>
            </Alert>
          </>
        )}
      </div>
      <PageHeaderActions>
        <SearchIndexSettingsPopover />
      </PageHeaderActions>
    </>
  );
}

function SavedSearchHeader({
  count,
  pinnedCount,
  sort,
  onSortChange,
}: {
  count: number;
  pinnedCount: number;
  sort: SavedSearchSort;
  onSortChange: (sort: SavedSearchSort) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0 gap-1">
        <h2 className="text-base/6 font-semibold">Saved searches</h2>
        {count > 0 && (
          <span className="text-muted-foreground text-sm/5">
            <IconSearch className="inline size-4" />
            {count}{" "}
          </span>
        )}
        {pinnedCount > 0 && (
          <span className="text-muted-foreground text-sm/5">
            <IconPinned className="inline size-4" />
            {pinnedCount}
          </span>
        )}
      </div>
      <SavedSearchSortSelect
        ariaLabel="Sort saved searches"
        value={sort}
        onValueChange={onSortChange}
      />
    </div>
  );
}

function SearchEntryList({ searchKeys }: { searchKeys: Array<string> }) {
  const listRef = useRef<HTMLDivElement>(null);
  const getItemKey = useCallback(
    (index: number) => searchKeys[index] ?? index,
    [searchKeys],
  );

  const rowVirtualizer = useWindowVirtualizer({
    count: searchKeys.length,
    getItemKey,
    estimateSize: () => 148,
    overscan: 4,
    gap: 8,
    scrollMargin: listRef.current?.offsetTop ?? 0,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  if (searchKeys.length === 0) {
    return null;
  }

  return (
    <div ref={listRef} className="relative w-full">
      <div
        style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
        className="relative w-full"
      >
        {virtualItems.map((virtualRow) => {
          const searchId = searchKeys[virtualRow.index];

          return (
            <div
              key={searchId}
              ref={rowVirtualizer.measureElement}
              data-index={virtualRow.index}
              className="absolute top-0 left-0 w-full"
              style={{
                transform: `translateY(${virtualRow.start - rowVirtualizer.options.scrollMargin}px)`,
              }}
            >
              <SearchEntryCard searchId={searchId} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SearchEntryCard({ searchId }: { searchId: string }) {
  const entry = useSearchQueryEntry(searchId);
  const displayName = useSearchDisplayName(searchId);
  const isPinned = useSearchPinned(searchId);
  const {
    duplicateSearchEntry,
    removeSearchEntry,
    renameSearchEntry,
    setSearchPinned,
  } = useSearchQueriesActions();
  const queryClient = useQueryClient();

  const { staged } = entry;
  const theme = useActiveTheme();

  const searchTags = useMemo(
    () => queryToHydrusSearch(staged.query),
    [staged.query],
  );
  const hydrusPageActions = useHydrusSearchPageActions({
    searchState: staged,
    displayName,
    searchTags,
  });

  const sortLabel = getSearchSortLabel(staged.sort);
  const sortColor = getThemeAdjustedColorFromHex(
    getSearchSortColorHex(staged.sort),
    theme,
  );
  const [isRenaming, setIsRenaming] = useState(false);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const handleSave = useCallback(
    (e?: React.MouseEvent) => {
      e?.preventDefault();
      e?.stopPropagation();
      const clonedSearchId = duplicateSearchEntry(searchId);
      copySearchCache(queryClient, searchId, clonedSearchId);
    },
    [searchId, duplicateSearchEntry, queryClient],
  );

  const handleDelete = useCallback(
    (e?: React.MouseEvent) => {
      e?.preventDefault();
      e?.stopPropagation();
      removeSearchEntry(searchId);
    },
    [searchId, removeSearchEntry],
  );

  const handleStartRename = useCallback((e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setIsRenaming(true);
    requestAnimationFrame(() => renameInputRef.current?.focus());
  }, []);

  const handleTogglePinned = useCallback(
    (e?: React.MouseEvent) => {
      e?.preventDefault();
      e?.stopPropagation();
      setSearchPinned(searchId, !isPinned);
    },
    [searchId, isPinned, setSearchPinned],
  );

  const handleRename = useCallback(
    (e: React.SubmitEvent<HTMLFormElement>) => {
      e.preventDefault();
      const newName = renameInputRef.current?.value.trim() ?? "";
      if (!newName) {
        setIsRenaming(false);
        return;
      }
      const newId = encodeURIComponent(newName);
      if (newId === searchId) {
        // Same ID — just update display name
        renameSearchEntry(searchId, searchId, newName);
        setIsRenaming(false);
        return;
      }
      const renamedSearchId = renameSearchEntry(searchId, newId, newName);
      copySearchCache(queryClient, searchId, renamedSearchId, true);
      setIsRenaming(false);
    },
    [searchId, renameSearchEntry, queryClient],
  );

  return (
    <div className="bg-muted/50 @container/search-card relative flex flex-col gap-2.5 rounded-2xl border border-transparent p-3 transition-colors sm:gap-3 sm:p-4">
      {!isRenaming && (
        <Link
          to="/search/$searchId"
          params={{ searchId }}
          aria-label={displayName}
          className="focus-visible:ring-ring/50 hover:bg-muted absolute inset-0 z-0 rounded-2xl outline-hidden transition-colors focus-visible:ring-[3px]"
        />
      )}
      <div className="pointer-events-none relative z-20 flex min-w-0 items-start justify-between gap-2 sm:gap-3">
        <div className="pointer-events-none min-w-0 flex-1 basis-48">
          {isRenaming ? (
            <form
              onSubmit={handleRename}
              onClick={(e) => e.stopPropagation()}
              className="pointer-events-auto"
            >
              <Input
                ref={renameInputRef}
                name="newname"
                defaultValue={displayName}
                aria-label="Search name"
                onBlur={(e) =>
                  handleRename(
                    e as unknown as React.SubmitEvent<HTMLFormElement>,
                  )
                }
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setIsRenaming(false);
                  }
                }}
                className="h-10 w-full sm:w-72"
                autoComplete="off"
              />
            </form>
          ) : (
            <span className="flex min-h-9 min-w-0 items-center gap-1 text-lg/6 font-semibold">
              {isPinned && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleTogglePinned}
                  type="button"
                  title="Unpin"
                  aria-label="Unpin saved search"
                  className="group pointer-events-auto relative hidden size-4 shrink-0 @3xs/search-card:inline-flex @sm/search-card:size-6 @md/search-card:size-9"
                >
                  <IconPinned className="size-5 group-hover:hidden group-focus-visible:hidden" />
                  <IconPinnedOff className="hidden size-5 group-hover:block group-focus-visible:block" />
                </Button>
              )}
              <span className="min-w-[5ch] wrap-break-word">{displayName}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleStartRename}
                type="button"
                title="Rename"
                aria-label="Rename saved search"
                className="pointer-events-auto hidden size-9 shrink-0 @md/search-card:inline-flex"
              >
                <IconEdit className="size-5.5 -translate-y-px" />
              </Button>
            </span>
          )}
        </div>
        <div className="pointer-events-auto flex shrink-0 items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  title="Search actions"
                  aria-label={`Actions for ${displayName}`}
                  className="size-9 shrink-0"
                >
                  <IconDots className="size-5" />
                </Button>
              }
            />
            <DropdownMenuContent side="bottom" align="end">
              <DropdownMenuItem onClick={handleTogglePinned}>
                {isPinned ? <IconPinnedOff /> : <IconPin />}
                {isPinned ? "Unpin" : "Pin"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleStartRename}>
                <IconEdit />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSave}>
                <IconCopy />
                Clone
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {hydrusPageActions.map((action) =>
                action.renderOverflow ? (
                  <Fragment key={action.id}>
                    {action.renderOverflow(action)}
                  </Fragment>
                ) : (
                  <OverflowActionItem key={action.id} action={action} />
                ),
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDelete} variant="destructive">
                <IconTrash />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="pointer-events-none relative z-10 flex min-w-0 flex-col gap-2">
        {searchTags.length > 0 ? (
          <div className="pointer-events-none select-none **:select-none">
            <SearchTagList
              tags={searchTags}
              interactive={false}
              badgeSize="compact-mobile-wrap"
            >
              <SearchSortTag
                label={sortLabel}
                sort={staged.sort}
                color={sortColor}
                size="compact-mobile-wrap"
              />
            </SearchTagList>
          </div>
        ) : (
          <Badge
            variant="outline"
            size="compact-mobile-wrap"
            className="select-none"
          >
            No query yet
          </Badge>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Quick tag search
// ---------------------------------------------------------------------------

function QuickTagSearch({ onSearch }: { onSearch: (tag: string) => void }) {
  const inputRef = useRef<string>("");

  const handleSubmit = useCallback(
    (e: React.SubmitEvent<HTMLFormElement>) => {
      e.preventDefault();
      onSearch(inputRef.current);
    },
    [onSearch],
  );

  return (
    <form onSubmit={handleSubmit} className="flex w-full gap-2">
      <TagAutocompleteInput
        className="relative min-w-0 flex-1"
        inputClassName="h-11"
        placeholder="Search tags…"
        ariaLabel="Search tags"
        name="hyaway-quick-tag-search"
        onChange={(val) => {
          inputRef.current = val;
        }}
        onSelect={onSearch}
      />
      <Button
        type="submit"
        size="default"
        aria-label="Search"
        className="size-11 shrink-0 sm:w-auto"
      >
        <IconSearch data-icon="inline-start" className="size-5" />
        <span className="hidden sm:inline">Search</span>
      </Button>
    </form>
  );
}
