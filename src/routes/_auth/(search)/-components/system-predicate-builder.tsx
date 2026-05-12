// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useMemo } from "react";
import { QueryBuilder } from "react-querybuilder";
import { queryToHydrusSearch } from "../-lib/query-to-hydrus-search";
import {
  FILE_SERVICE_TYPES,
  buildRatingFieldGroups,
  fieldGroups,
  getSortLabel,
} from "../-lib/query-builder-fields";
import {
  QBActionElement,
  QBCombinatorSelect,
  QBFieldSelect,
  QBOperatorSelect,
  QBValueEditor,
  controlClassnames,
} from "./query-builder-controls";
import { SearchActions } from "./search-builder-actions";
import { SortSection } from "./sort-select";
import type { RuleGroupType, RuleType } from "react-querybuilder";
import type { HydrusFileSortType } from "@/integrations/hydrus-api/models";
import { Permission } from "@/integrations/hydrus-api/models";
import { useHasPermission } from "@/integrations/hydrus-api/queries/access";
import { useGetServicesQuery } from "@/integrations/hydrus-api/queries/services";
import { useRatingServices } from "@/integrations/hydrus-api/queries/use-rating-services";
import { SearchTagList } from "@/components/tag/tag-badge";
import {} from "@/stores/search-settings-store";
import {
  useSearchQueriesActions,
  useSearchQueryEntry,
} from "@/stores/search-queries-store";

export type { SortConfig } from "./sort-select";

// ---------------------------------------------------------------------------
// Query mutation helpers
// ---------------------------------------------------------------------------

/** Force sub-groups to always use OR combinator (only creates new objects when needed) */
function enforceCombinators(query: RuleGroupType): RuleGroupType {
  const filtered = query.rules.filter(
    (rule) => !("rules" in rule) || rule.rules.length > 0,
  );

  const needsFilter = filtered.length !== query.rules.length;
  const needsCombinatorFix =
    query.combinator !== "and" ||
    filtered.some((rule) => "rules" in rule && rule.combinator !== "or");

  if (!needsFilter && !needsCombinatorFix) {
    return query;
  }

  return {
    ...query,
    combinator: "and",
    rules: filtered.map((rule) => {
      if ("rules" in rule && rule.combinator !== "or") {
        return { ...rule, combinator: "or" as const };
      }
      return rule;
    }),
  };
}

/** Prevent nested groups beyond 1 level deep */
const handleAddGroup = (_group: RuleGroupType, parentPath: Array<number>) => {
  return parentPath.length === 0;
};

/** Set the default field based on the context passed from the action button. */
const handleAddRule = (
  rule: RuleType,
  _parentPath: Array<number>,
  _query: RuleGroupType,
  context?: { addSystem?: boolean; addLimit?: boolean },
): RuleType => {
  if (context?.addLimit) {
    return { ...rule, field: "limit", operator: "=", value: 256 };
  }
  if (context?.addSystem) {
    return { ...rule, field: "inbox", operator: "is", value: "" };
  }
  return { ...rule, field: "tag", operator: "=", value: "" };
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface SearchQueryBuilderProps {
  entryKey: string;
  onCommit?: () => void;
}

export function SearchQueryBuilder({
  entryKey,
  onCommit,
}: SearchQueryBuilderProps) {
  const entry = useSearchQueryEntry(entryKey);
  const { setStagedQuery, setStagedSort, commit, reset, clear } =
    useSearchQueriesActions();

  const query = entry.staged.query;
  const sortType = entry.staged.sort.sortType;
  const sortAsc = entry.staged.sort.sortAsc;
  const canEditRatings = useHasPermission(Permission.EDIT_FILE_RATINGS);
  const { ratingServices } = useRatingServices();
  const { data: servicesData } = useGetServicesQuery();

  const fileServiceValues = useMemo(() => {
    if (!servicesData) return [];
    return Object.values(servicesData.services)
      .filter((s) => FILE_SERVICE_TYPES.has(s.type))
      .map((s) => ({ name: s.name, label: s.name }));
  }, [servicesData]);

  const allFieldGroups = useMemo(() => {
    let groups = fieldGroups;

    if (fileServiceValues.length > 0) {
      groups = groups.map((group) => ({
        ...group,
        options: group.options.map((field) =>
          field.name === "file_service"
            ? { ...field, values: fileServiceValues }
            : field,
        ),
      }));
    }

    if (canEditRatings && ratingServices.length > 0) {
      return [...groups, ...buildRatingFieldGroups(ratingServices)];
    }

    return groups;
  }, [canEditRatings, ratingServices, fileServiceValues]);

  const handleQueryChange = useCallback(
    (q: RuleGroupType) => {
      setStagedQuery(entryKey, enforceCombinators(q));
    },
    [entryKey, setStagedQuery],
  );

  const handleSortTypeChange = useCallback(
    (value: HydrusFileSortType) => {
      setStagedSort(entryKey, { sortType: value, sortAsc });
    },
    [entryKey, setStagedSort, sortAsc],
  );

  const handleSortAscToggle = useCallback(() => {
    setStagedSort(entryKey, { sortType, sortAsc: !sortAsc });
  }, [entryKey, setStagedSort, sortType, sortAsc]);

  const hydrusSearch = useMemo(() => queryToHydrusSearch(query), [query]);
  const hasRules = query.rules.length > 0;

  const searchDisabled = hydrusSearch.length === 0;

  const handleSearch = useCallback(() => {
    commit(entryKey);
    onCommit?.();
  }, [entryKey, commit, onCommit]);

  const handleReset = useCallback(() => {
    reset(entryKey);
  }, [entryKey, reset]);

  const handleClear = useCallback(() => {
    clear(entryKey);
  }, [entryKey, clear]);

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-3">
      <QueryBuilder
        fields={allFieldGroups}
        query={query}
        onQueryChange={handleQueryChange}
        controlClassnames={controlClassnames}
        suppressStandardClassnames
        showCombinatorsBetweenRules
        addRuleToNewGroups
        parseNumbers
        onAddRule={handleAddRule}
        onAddGroup={handleAddGroup}
        controlElements={{
          fieldSelector: QBFieldSelect,
          operatorSelector: QBOperatorSelect,
          valueEditor: QBValueEditor,
          addRuleAction: QBActionElement,
          removeRuleAction: QBActionElement,
          addGroupAction: QBActionElement,
          removeGroupAction: QBActionElement,
          combinatorSelector: QBCombinatorSelect,
        }}
      />

      <SortSection
        sortType={sortType}
        sortAsc={sortAsc}
        onSortTypeChange={handleSortTypeChange}
        onSortAscToggle={handleSortAscToggle}
      />

      {hydrusSearch.length > 0 && (
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground text-sm font-medium">
            Next search will be
          </span>
          <SearchTagList
            tags={hydrusSearch}
            sortLabel={getSortLabel(sortType, sortAsc)}
          />
        </div>
      )}

      {hasRules && (
        <div className="flex flex-col gap-2">
          <SearchActions
            onSearch={handleSearch}
            onReset={handleReset}
            onClear={handleClear}
            searchDisabled={searchDisabled}
            hasCommitted={
              !!entry.committed && entry.committed.query.rules.length > 0
            }
          />
        </div>
      )}
    </div>
  );
}
