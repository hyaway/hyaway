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
import { useCallback, useMemo, useRef, useState } from "react";
import { queryToHydrusSearch } from "./-lib/query-to-hydrus-search";
import { SYSTEM_TAGS, getSortLabel } from "./-lib/query-builder-fields";
import { SearchIndexSettingsPopover } from "./-components/search-index-settings-popover";
import { InstantSearchSwitch } from "./-components/instant-search-switch";
import { copySearchCache, generateSearchId } from "@/lib/search-entry-utils";
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
  const { saveAs, remove, rename } = useSearchQueriesActions();
  const queryClient = useQueryClient();

  const { staged } = entry;

  const searchTags = useMemo(() => queryToHydrusSearch(staged.query), [staged]);

  const sortLabel = getSortLabel(staged.sort.sortType, staged.sort.sortAsc);
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
          <InstantSearchSwitch
            searchId={searchId}
            className="text-muted-foreground pt-1 pb-2"
            size="default"
          />
        </div>
        {searchTags.length > 0 ? (
          <SearchTagList
            tags={searchTags}
            sortLabel={sortLabel}
            interactive={false}
            className="pointer-events-none select-none **:select-none"
          />
        ) : (
          <Badge variant="outline" size="default-wrap" className="select-none">
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
        staticSuggestions={SYSTEM_TAGS}
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
