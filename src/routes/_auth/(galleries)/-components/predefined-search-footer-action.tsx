// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useMemo } from "react";
import { IconSearch } from "@tabler/icons-react";
import { useNavigate } from "@tanstack/react-router";
import type { RuleGroupType } from "react-querybuilder";
import type { FloatingFooterAction } from "@/components/page-shell/page-floating-footer";
import type { SearchRuleInput, SortConfig } from "@/stores/search-defaults";
import {
  HydrusFileSortType,
  ServiceType,
} from "@/integrations/hydrus-api/models";
import { useGetServicesQuery } from "@/integrations/hydrus-api/queries/services";
import { generateSearchId } from "@/lib/search-entry-utils";
import { createSearchRule } from "@/stores/search-defaults";
import {
  useLongestViewedLimit,
  useMostViewedLimit,
  useRandomInboxLimit,
  useRecentFilesDays,
  useRecentFilesLimit,
  useRemoteHistoryLimit,
} from "@/stores/search-limits-store";
import {
  nextUniqueName,
  useSearchQueriesActions,
} from "@/stores/search-queries-store";

type UsePredefinedSearchFooterActionOptions = {
  displayName: string;
  query: RuleGroupType;
  sort: SortConfig;
  fileServiceKey?: string | null;
  disabled?: boolean;
};

export function usePredefinedSearchFooterAction({
  displayName,
  query,
  sort,
  fileServiceKey = null,
  disabled = false,
}: UsePredefinedSearchFooterActionOptions): FloatingFooterAction {
  const navigate = useNavigate();
  const {
    commitSearchEntry,
    setSearchStagedFileServiceKey,
    setSearchStagedQuery,
    setSearchStagedSort,
  } = useSearchQueriesActions();

  const handleOpenAsNewSearch = useCallback(() => {
    const uniqueDisplayName = nextUniqueName(displayName);
    const searchId = generateSearchId(uniqueDisplayName);
    setSearchStagedQuery(searchId, query, uniqueDisplayName);
    setSearchStagedSort(searchId, sort);
    setSearchStagedFileServiceKey(searchId, fileServiceKey);
    commitSearchEntry(searchId);
    navigate({ to: "/search/$searchId", params: { searchId } });
  }, [
    commitSearchEntry,
    displayName,
    fileServiceKey,
    navigate,
    query,
    setSearchStagedFileServiceKey,
    setSearchStagedQuery,
    setSearchStagedSort,
    sort,
  ]);

  return {
    id: "open-as-new-search",
    label: "Open as new search",
    icon: IconSearch,
    onClick: handleOpenAsNewSearch,
    overflowOnly: true,
    disabled,
  };
}

function queryFromRules(rules: Array<SearchRuleInput>): RuleGroupType {
  return {
    combinator: "and",
    rules: rules.map(createSearchRule),
  };
}

function createSortConfig(
  sortType: HydrusFileSortType,
  sortAsc = false,
): SortConfig {
  return { sortType, sortAsc };
}

export function useRecentlyArchivedSearchFooterAction(): FloatingFooterAction {
  const limit = useRecentFilesLimit();
  const days = useRecentFilesDays();
  const query = useMemo(
    () =>
      queryFromRules([
        { field: "limit", operator: "=", value: limit },
        { field: "archive", operator: "is", value: true },
        {
          field: "archived_time",
          operator: "<",
          value: `${days} days ago`,
        },
      ]),
    [days, limit],
  );

  return usePredefinedSearchFooterAction({
    displayName: "Recently archived",
    query,
    sort: createSortConfig(HydrusFileSortType.ArchiveTimestamp),
  });
}

export function useRecentlyInboxedSearchFooterAction(): FloatingFooterAction {
  const limit = useRecentFilesLimit();
  const days = useRecentFilesDays();
  const query = useMemo(
    () =>
      queryFromRules([
        { field: "limit", operator: "=", value: limit },
        { field: "inbox", operator: "is", value: true },
        { field: "import_time", operator: "<", value: `${days} days ago` },
      ]),
    [days, limit],
  );

  return usePredefinedSearchFooterAction({
    displayName: "Recently inboxed",
    query,
    sort: createSortConfig(HydrusFileSortType.ImportTime),
  });
}

export function useRecentlyTrashedSearchFooterAction(): FloatingFooterAction {
  const { data: servicesData } = useGetServicesQuery();
  const limit = useRecentFilesLimit();
  const days = useRecentFilesDays();
  const trashServiceKey = useMemo(() => {
    if (!servicesData) return undefined;
    return Object.entries(servicesData.services).find(
      ([_key, service]) => service.type === ServiceType.TRASH,
    )?.[0];
  }, [servicesData]);
  const query = useMemo(
    () =>
      queryFromRules([
        { field: "limit", operator: "=", value: limit },
        { field: "import_time", operator: "<", value: `${days} days ago` },
      ]),
    [days, limit],
  );

  return usePredefinedSearchFooterAction({
    displayName: "Recently trashed",
    query,
    sort: createSortConfig(HydrusFileSortType.ImportTime),
    fileServiceKey: trashServiceKey,
    disabled: !trashServiceKey,
  });
}

export function useRandomInboxSearchFooterAction(): FloatingFooterAction {
  const limit = useRandomInboxLimit();
  const query = useMemo(
    () =>
      queryFromRules([
        { field: "limit", operator: "=", value: limit },
        { field: "inbox", operator: "is", value: true },
      ]),
    [limit],
  );

  return usePredefinedSearchFooterAction({
    displayName: "Random inbox",
    query,
    sort: createSortConfig(HydrusFileSortType.Random),
  });
}

export function useRemoteHistorySearchFooterAction(): FloatingFooterAction {
  const limit = useRemoteHistoryLimit();
  const query = useMemo(
    () => queryFromRules([{ field: "limit", operator: "=", value: limit }]),
    [limit],
  );

  return usePredefinedSearchFooterAction({
    displayName: "Remote history",
    query,
    sort: createSortConfig(HydrusFileSortType.LastViewedTime),
  });
}

export function useMostViewedSearchFooterAction(): FloatingFooterAction {
  const limit = useMostViewedLimit();
  const query = useMemo(
    () => queryFromRules([{ field: "limit", operator: "=", value: limit }]),
    [limit],
  );

  return usePredefinedSearchFooterAction({
    displayName: "Most viewed",
    query,
    sort: createSortConfig(HydrusFileSortType.NumberOfMediaViews),
  });
}

export function useLongestViewedSearchFooterAction(): FloatingFooterAction {
  const limit = useLongestViewedLimit();
  const query = useMemo(
    () => queryFromRules([{ field: "limit", operator: "=", value: limit }]),
    [limit],
  );

  return usePredefinedSearchFooterAction({
    displayName: "Longest viewed",
    query,
    sort: createSortConfig(HydrusFileSortType.TotalMediaViewtime),
  });
}
