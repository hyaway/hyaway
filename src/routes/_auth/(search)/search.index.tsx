// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import {
  IconCopy,
  IconEdit,
  IconInfoCircle,
  IconSearch,
  IconTrash,
} from "@tabler/icons-react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { useCallback, useMemo, useRef, useState } from "react";
import { queryToHydrusSearch } from "./-lib/query-to-hydrus-search";
import { getSortColorHex, getSortLabel } from "./-lib/query-builder-fields";
import { SearchIndexSettingsPopover } from "./-components/search-index-settings-popover";
import { SearchSortTag } from "./-components/search-sort-tag";
import { copySearchCache, generateSearchId } from "@/lib/search-entry-utils";
import { getThemeAdjustedColorFromHex } from "@/lib/color-utils";
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
import { Input } from "@/components/ui-primitives/input";
import {
  nextDraftName,
  useSearchDisplayName,
  useSearchKeys,
  useSearchQueriesActions,
  useSearchQueryEntry,
} from "@/stores/search-queries-store";
import { useActiveTheme } from "@/stores/theme-store";
import { Separator } from "@/components/ui-primitives/separator";

export const Route = createFileRoute("/_auth/(search)/search/")({
  component: SearchIndex,
});

function SearchIndex() {
  const searchKeys = useSearchKeys();
  const navigate = useNavigate();
  const { setDisplayName, createFromTag } = useSearchQueriesActions();

  const handleAddNew = useCallback(() => {
    const displayName = nextDraftName();
    const searchId = generateSearchId(displayName);
    setDisplayName(searchId, displayName);
    navigate({ to: "/search/$searchId", params: { searchId } });
  }, [setDisplayName, navigate]);

  const handleQuickSearch = useCallback(
    (tag: string) => {
      const trimmed = tag.trim();
      if (!trimmed) {
        handleAddNew();
        return;
      }
      const searchId = createFromTag(trimmed);
      navigate({ to: "/search/$searchId", params: { searchId } });
    },
    [createFromTag, navigate, handleAddNew],
  );

  return (
    <>
      <PageHeading title="Search" />
      <div className="flex flex-col gap-4 pt-2">
        <QuickTagSearch onSearch={handleQuickSearch} />
        <Separator />
        <SearchEntryList searchKeys={searchKeys} />
        {searchKeys.length > 0 && (
          <>
            <Separator />
            <Alert>
              <IconInfoCircle />
              <AlertTitle>Viewing a saved search often?</AlertTitle>
              <AlertDescription>
                Creating a matching page in hydrus will make it load much
                faster.
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

function SearchEntryList({ searchKeys }: { searchKeys: Array<string> }) {
  const listRef = useRef<HTMLDivElement>(null);
  const getItemKey = useCallback(
    (index: number) => searchKeys[index] ?? index,
    [searchKeys],
  );

  const rowVirtualizer = useWindowVirtualizer({
    count: searchKeys.length,
    getItemKey,
    estimateSize: () => 168,
    overscan: 4,
    gap: 16,
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
  const { saveAs, remove, rename } = useSearchQueriesActions();
  const queryClient = useQueryClient();

  const { staged } = entry;
  const theme = useActiveTheme();

  const searchTags = useMemo(() => queryToHydrusSearch(staged.query), [staged]);

  const sortLabel = getSortLabel(staged.sort.sortType, staged.sort.sortAsc);
  const sortColor = getThemeAdjustedColorFromHex(
    getSortColorHex(staged.sort.sortType, staged.sort.sortAsc),
    theme,
  );
  const [isRenaming, setIsRenaming] = useState(false);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const handleSave = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const newId = generateSearchId(displayName);
      saveAs(searchId, newId);
      copySearchCache(queryClient, searchId, newId);
    },
    [searchId, saveAs, queryClient],
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      remove(searchId);
    },
    [searchId, remove],
  );

  const handleStartRename = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsRenaming(true);
    requestAnimationFrame(() => renameInputRef.current?.focus());
  }, []);

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
        rename(searchId, searchId, newName);
        setIsRenaming(false);
        return;
      }
      rename(searchId, newId, newName);
      copySearchCache(queryClient, searchId, newId, true);
      setIsRenaming(false);
    },
    [searchId, rename, queryClient],
  );

  return (
    <Link
      to="/search/$searchId"
      params={{ searchId }}
      disabled={isRenaming}
      className="border-border hover:bg-muted/50 flex flex-col gap-3 rounded-xl border p-5 transition-colors sm:flex-row sm:items-start sm:gap-4"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-col items-start gap-1">
          {isRenaming ? (
            <form onSubmit={handleRename} onClick={(e) => e.stopPropagation()}>
              <Input
                ref={renameInputRef}
                name="newname"
                defaultValue={displayName}
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
            <span className="flex items-center gap-1 text-lg leading-tight font-semibold">
              {displayName}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleStartRename}
                type="button"
                title="Rename"
                className="size-9"
              >
                <IconEdit className="size-5.5 -translate-y-px" />
              </Button>
            </span>
          )}
        </div>
        {searchTags.length > 0 ? (
          <div className="pointer-events-none select-none **:select-none">
            <SearchTagList
              tags={searchTags}
              interactive={false}
              badgeSize="compact-mobile-wrap"
            >
              <SearchSortTag
                label={sortLabel}
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
      <div className="flex items-center gap-1 self-end sm:self-center">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSave}
            type="button"
            title="Clone"
            className="size-11 shrink-0"
          >
            <IconCopy className="size-5.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            type="button"
            title="Delete"
            className="text-destructive size-11 shrink-0"
          >
            <IconTrash className="size-5.5" />
          </Button>
        </div>
      </div>
    </Link>
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
