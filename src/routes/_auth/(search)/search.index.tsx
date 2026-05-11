// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { IconDeviceFloppy, IconPlus, IconTrash } from "@tabler/icons-react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { committedSearchQueryKey } from "./-hooks/use-committed-search-query";
import { queryToHydrusSearch } from "./-lib/query-to-hydrus-search";
import { getSortLabel } from "./-lib/query-builder-fields";
import { PageHeading } from "@/components/page-shell/page-heading";
import { SearchTagList } from "@/components/tag/tag-badge";
import { Button } from "@/components/ui-primitives/button";
import {
  SCRATCH_SEARCH_KEY,
  generateSearchId,
  useSavedSearchKeys,
  useSearchQueriesActions,
  useSearchQueryEntry,
} from "@/stores/search-queries-store";

export const Route = createFileRoute("/_auth/(search)/search/")({
  component: SearchIndex,
});

function SearchIndex() {
  const savedKeys = useSavedSearchKeys();
  const navigate = useNavigate();

  const handleAddNew = () => {
    const newId = generateSearchId();
    navigate({ to: "/search/$searchId", params: { searchId: newId } });
  };

  return (
    <>
      <PageHeading title="Search" />
      <div className="flex flex-col gap-4">
        <SearchEntryCard
          searchId={SCRATCH_SEARCH_KEY}
          label="Scratch"
          actionType="save"
        />
        {savedKeys.map((key) => (
          <SearchEntryCard key={key} searchId={key} actionType="delete" />
        ))}
        <Button
          variant="outline"
          size="default"
          onClick={handleAddNew}
          type="button"
          className="self-start"
        >
          <IconPlus data-icon="inline-start" className="size-5" />
          Add new search
        </Button>
      </div>
    </>
  );
}

function SearchEntryCard({
  searchId,
  label,
  actionType,
}: {
  searchId: string;
  label?: string;
  actionType: "save" | "delete";
}) {
  const entry = useSearchQueryEntry(searchId);
  const committed = entry.committed;
  const { saveAs, remove } = useSearchQueriesActions();
  const queryClient = useQueryClient();

  const searchTags = useMemo(
    () => (committed ? queryToHydrusSearch(committed.query) : []),
    [committed],
  );

  const sortLabel = committed
    ? getSortLabel(committed.sort.sortType, committed.sort.sortAsc)
    : undefined;

  const displayName = label ?? `Search ${searchId}`;

  const handleSave = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const newId = generateSearchId();
      saveAs(searchId, newId);
      for (const query of queryClient.getQueriesData({
        queryKey: committedSearchQueryKey(searchId),
      })) {
        const [key, data] = query;
        const baseKeyLength = committedSearchQueryKey(searchId).length;
        const newKey = [
          ...committedSearchQueryKey(newId),
          ...key.slice(baseKeyLength),
        ];
        queryClient.setQueryData(newKey, data);
      }
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

  return (
    <Link
      to="/search/$searchId"
      params={{ searchId }}
      className="border-border hover:bg-muted/50 flex items-center gap-4 rounded-xl border p-5 transition-colors"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="text-base font-medium">{displayName}</span>
        {searchTags.length > 0 ? (
          <SearchTagList tags={searchTags} sortLabel={sortLabel} />
        ) : (
          <span className="text-muted-foreground text-sm">No active query</span>
        )}
      </div>
      {actionType === "save" ? (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSave}
          type="button"
          title="Save as new"
          className="size-10 shrink-0"
        >
          <IconDeviceFloppy className="size-5" />
        </Button>
      ) : (
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
      )}
    </Link>
  );
}
