// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useEffect, useMemo } from "react";
import { QueryBuilder, RuleGroupBodyComponents } from "react-querybuilder";
import { queryToHydrusSearch } from "../-lib/query-to-hydrus-search";
import {
  FILE_SERVICE_TYPES,
  SYSTEM_TAGS,
  buildRatingFieldGroups,
  fieldGroups,
  getSortLabel,
  systemTagToRule,
} from "../-lib/query-builder-fields";
import {
  CombinatorSeparator,
  QBActionElement,
  QBCombinatorSelect,
  QBFieldSelect,
  QBOperatorSelect,
  QBValueEditor,
  controlClassnames,
} from "./query-builder-controls";
import { SearchActions } from "./search-builder-actions";
import { SortSection } from "./sort-select";
import type {
  RuleGroupProps,
  RuleGroupType,
  RuleType,
  UseRuleGroup,
} from "react-querybuilder";
import type { HydrusFileSortType } from "@/integrations/hydrus-api/models";
import { Permission } from "@/integrations/hydrus-api/models";
import { useHasPermission } from "@/integrations/hydrus-api/queries/access";
import { useGetServicesQuery } from "@/integrations/hydrus-api/queries/services";
import { useRatingServices } from "@/integrations/hydrus-api/queries/use-rating-services";
import { SearchTagList } from "@/components/tag/tag-badge";
import { TagAutocompleteInput } from "@/components/tag/tag-autocomplete-input";
import { cn } from "@/lib/utils";
import {
  useSearchDirty,
  useSearchQueriesActions,
  useSearchQueryEntry,
} from "@/stores/search-queries-store";

export type { SortConfig } from "./sort-select";

// ---------------------------------------------------------------------------
// Query mutation helpers
// ---------------------------------------------------------------------------

/** Force sub-groups to always use OR combinator (only creates new objects when needed) */
function enforceCombinators(query: RuleGroupType): RuleGroupType {
  const needsCombinatorFix =
    query.combinator !== "and" ||
    query.rules.some((rule) => "rules" in rule && rule.combinator !== "or");

  if (!needsCombinatorFix) {
    return query;
  }

  return {
    ...query,
    combinator: "and",
    rules: query.rules.map((rule) => {
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
  context?: {
    addSystem?: boolean;
    inlineTag?: string;
    systemField?: string;
  },
): RuleType => {
  if (context?.inlineTag) {
    const systemRule = systemTagToRule(context.inlineTag);
    if (systemRule) return { ...rule, ...systemRule };
    return { ...rule, field: "tag", operator: "=", value: context.inlineTag };
  }
  if (context?.addSystem && context.systemField) {
    for (const group of fieldGroups) {
      const field = group.options.find((f) => f.name === context.systemField);
      if (field) {
        return {
          ...rule,
          field: context.systemField,
          operator:
            (field as { defaultOperator?: string }).defaultOperator ?? "=",
          value: field.defaultValue ?? "",
        };
      }
    }
    return { ...rule, field: context.systemField, operator: "=", value: "" };
  }
  return { ...rule, field: "tag", operator: "=", value: "" };
};

// ---------------------------------------------------------------------------
// Inline tag input rendered at the bottom of each rule group body
// ---------------------------------------------------------------------------

function QBRuleGroupBody(props: RuleGroupProps & UseRuleGroup) {
  const handleInlineSelect = useCallback(
    (tag: string) => {
      props.addRule(undefined, { inlineTag: tag });
    },
    [props.addRule],
  );

  const combinator = props.ruleGroup.combinator ?? "and";
  const hasRules =
    "rules" in props.ruleGroup && props.ruleGroup.rules.length > 0;

  return (
    <>
      <RuleGroupBodyComponents {...props} />
      {hasRules && (
        <div className="pt-2 pb-3 md:pt-1 md:pb-2">
          <CombinatorSeparator text={combinator} />
        </div>
      )}
      <TagAutocompleteInput
        className="relative w-full"
        inputClassName="h-9"
        placeholder="Add tag or system:…"
        name={`hyaway-qb-inline-${props.path.join("-")}`}
        staticSuggestions={SYSTEM_TAGS}
        onSelect={handleInlineSelect}
        onSubmit={handleInlineSelect}
        onBlur={handleInlineSelect}
        clearOnSelect
      />
    </>
  );
}

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
  const instantSearch = entry.instantSearch;

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

  const isDirty = useSearchDirty(entryKey);
  const showDirtyRing = isDirty && !instantSearch;

  useEffect(() => {
    if (!instantSearch || !isDirty) return;

    commit(entryKey);
    onCommit?.();
  }, [entryKey, instantSearch, isDirty, commit, onCommit]);

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border p-3",
        showDirtyRing && "ring-ring ring-1",
      )}
    >
      <QueryBuilder
        fields={allFieldGroups}
        query={query}
        onQueryChange={handleQueryChange}
        controlClassnames={controlClassnames}
        suppressStandardClassnames
        showCombinatorsBetweenRules
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
          ruleGroupBodyElements: QBRuleGroupBody,
        }}
      />
      <SortSection
        sortType={sortType}
        sortAsc={sortAsc}
        onSortTypeChange={handleSortTypeChange}
        onSortAscToggle={handleSortAscToggle}
      />
      {!instantSearch && hydrusSearch.length > 0 && (
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
            instantSearch={instantSearch}
          />
        </div>
      )}
    </div>
  );
}
