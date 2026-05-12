// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import {
  IconCopy,
  IconInfoCircle,
  IconPencil,
  IconPlus,
  IconSearch,
  IconTrash,
} from "@tabler/icons-react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useRef, useState } from "react";
import { queryToHydrusSearch } from "./-lib/query-to-hydrus-search";
import { getSortLabel } from "./-lib/query-builder-fields";
import { SearchIndexSettingsPopover } from "./-components/search-index-settings-popover";
import { copySearchCache, generateSearchId } from "@/lib/search-entry-utils";
import { PageHeaderActions } from "@/components/page-shell/page-header-actions";
import { PageHeading } from "@/components/page-shell/page-heading";
import { SearchTagList } from "@/components/tag/tag-badge";
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
        {searchKeys.map((key) => (
          <SearchEntryCard key={key} searchId={key} />
        ))}
        <Separator />
        <Button
          variant="outline"
          size="default"
          onClick={handleAddNew}
          className="self-start"
        >
          <IconPlus data-icon="inline-start" className="size-5" />
          New default search
        </Button>
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

function SearchEntryCard({ searchId }: { searchId: string }) {
  const entry = useSearchQueryEntry(searchId);
  const displayName = useSearchDisplayName(searchId);
  const committed = entry.committed;
  const { saveAs, remove, rename } = useSearchQueriesActions();
  const queryClient = useQueryClient();

  const searchTags = useMemo(
    () => (committed ? queryToHydrusSearch(committed.query) : []),
    [committed],
  );

  const sortLabel = committed
    ? getSortLabel(committed.sort.sortType, committed.sort.sortAsc)
    : undefined;
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
        {isRenaming ? (
          <form onSubmit={handleRename} onClick={(e) => e.stopPropagation()}>
            <Input
              ref={renameInputRef}
              name="newname"
              defaultValue={displayName}
              onBlur={(e) =>
                handleRename(e as unknown as React.SubmitEvent<HTMLFormElement>)
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
          <span className="flex items-center gap-1 text-base font-medium">
            {displayName}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleStartRename}
              type="button"
              title="Rename"
            >
              <IconPencil className="size-5" />
            </Button>
          </span>
        )}
        {searchTags.length > 0 ? (
          <SearchTagList
            tags={searchTags}
            sortLabel={sortLabel}
            interactive={false}
            selectable={false}
          />
        ) : (
          <span className="text-muted-foreground text-sm">No active query</span>
        )}
      </div>
      <div className="flex items-center gap-1 self-end sm:self-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSave}
          type="button"
          title="Clone"
          className="size-10 shrink-0"
        >
          <IconCopy className="size-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          type="button"
          title="Delete"
          className="text-destructive size-10 shrink-0"
        >
          <IconTrash className="size-5" />
        </Button>
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
    (e: React.FormEvent<HTMLFormElement>) => {
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
      <Button type="submit" size="default" aria-label="Search">
        <IconSearch data-icon="inline-start" className="size-5" />
        Search
      </Button>
    </form>
  );
}
