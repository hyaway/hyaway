// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useEffect, useMemo, useState } from "react";
import { IconChevronDown, IconChevronUp, IconPlus } from "@tabler/icons-react";
import { QueryBuilder, RuleGroupBodyComponents } from "react-querybuilder";
import { queryToHydrusSearch } from "../-lib/query-to-hydrus-search";
import {
  FILE_SERVICE_TYPES,
  buildRatingFieldGroups,
  fieldGroups,
  getDefaultSortAsc,
  getSortColorHex,
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
  SystemFieldCombobox,
  controlClassnames,
} from "./query-builder-controls";
import { InstantSearchSwitch } from "./instant-search-switch";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui-primitives/collapsible";
import { Button } from "@/components/ui-primitives/button";
import { SearchTagList } from "@/components/tag/tag-badge";
import { TagAutocompleteInput } from "@/components/tag/tag-autocomplete-input";
import { getThemeAdjustedColorFromHex } from "@/lib/color-utils";
import { cn } from "@/lib/utils";
import {
  useSearchDirty,
  useSearchQueriesActions,
  useSearchQueryEntry,
} from "@/stores/search-queries-store";
import { useActiveTheme } from "@/stores/theme-store";

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

type AddRuleContext = Parameters<typeof handleAddRule>[3];

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
        <div className="pt-2 pb-3 @md:pt-1 @md:pb-2">
          <CombinatorSeparator text={combinator} />
        </div>
      )}
      <TagAutocompleteInput
        className={cn("relative", "w-full max-w-2xl")}
        inputClassName={cn("h-9", "max-w-2xl min-w-0 @md:min-w-48")}
        placeholder="Add tag or system predicate"
        name={`hyaway-qb-inline-${props.path.join("-")}`}
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
  const [isOpen, setIsOpen] = useState(false);
  const theme = useActiveTheme();

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
      setStagedSort(entryKey, {
        sortType: value,
        sortAsc: getDefaultSortAsc(value),
      });
    },
    [entryKey, setStagedSort],
  );

  const handleSortAscToggle = useCallback(() => {
    setStagedSort(entryKey, { sortType, sortAsc: !sortAsc });
  }, [entryKey, setStagedSort, sortType, sortAsc]);

  const hydrusSearch = useMemo(() => queryToHydrusSearch(query), [query]);
  const stagedSortLabel = useMemo(
    () => getSortLabel(sortType, sortAsc),
    [sortType, sortAsc],
  );
  const stagedSortColor = useMemo(
    () =>
      getThemeAdjustedColorFromHex(getSortColorHex(sortType, sortAsc), theme),
    [sortType, sortAsc, theme],
  );

  const searchDisabled = hydrusSearch.length === 0;

  const addRootRule = useCallback(
    (context?: AddRuleContext) => {
      const nextRule = handleAddRule(
        { field: "tag", operator: "=", value: "" } as RuleType,
        [],
        query,
        context,
      );
      setStagedQuery(
        entryKey,
        enforceCombinators({ ...query, rules: [...query.rules, nextRule] }),
      );
    },
    [entryKey, query, setStagedQuery],
  );

  const handleRootInlineSelect = useCallback(
    (tag: string) => {
      addRootRule({ inlineTag: tag });
    },
    [addRootRule],
  );

  const handleAddRootGroup = useCallback(() => {
    setStagedQuery(
      entryKey,
      enforceCombinators({
        ...query,
        rules: [...query.rules, { combinator: "or", rules: [] }],
      }),
    );
    setIsOpen(true);
  }, [entryKey, query, setStagedQuery]);

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

  useEffect(() => {
    if (!instantSearch || !isDirty) return;

    commit(entryKey);
    onCommit?.();
  }, [entryKey, instantSearch, isDirty, commit, onCommit]);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="flex flex-col gap-2 rounded-lg border-b pb-2"
    >
      <div className="flex min-h-9 flex-wrap items-center justify-between gap-2">
        <InstantSearchSwitch
          searchId={entryKey}
          className="text-muted-foreground shrink-0 pt-1 pb-2"
          size="default"
        />
        <CollapsibleTrigger
          className={cn(
            "text-muted-foreground hover:bg-muted ms-auto inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 pt-1 pb-2 text-sm transition-colors",
          )}
        >
          {isOpen ? (
            <IconChevronUp className="size-4" />
          ) : (
            <IconChevronDown className="size-4" />
          )}
          {isOpen ? "Hide builder" : "Show builder"}
        </CollapsibleTrigger>
      </div>
      {!isOpen && (
        <CollapsedSearchQueryBuilder
          entryKey={entryKey}
          tags={hydrusSearch}
          sortLabel={stagedSortLabel}
          sortColor={stagedSortColor}
          onInlineSelect={handleRootInlineSelect}
          onSystemSelect={(fieldName) => addRootRule({ inlineTag: fieldName })}
          onAddGroup={handleAddRootGroup}
          onOpenBuilder={() => setIsOpen(true)}
        />
      )}
      {!instantSearch && !isOpen && (
        <div className="flex flex-col gap-2 pt-0.5">
          <SearchActions
            onSearch={handleSearch}
            onReset={handleReset}
            onClear={handleClear}
            searchDisabled={searchDisabled}
            showReset={isDirty}
          />
        </div>
      )}
      <CollapsibleContent className="flex flex-col gap-2.5">
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
        {!instantSearch && (
          <div className="flex flex-col gap-2 pt-0.5">
            <SearchActions
              onSearch={handleSearch}
              onReset={handleReset}
              onClear={handleClear}
              searchDisabled={searchDisabled}
              showReset={isDirty}
            />
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

function CollapsedSearchQueryBuilder({
  entryKey,
  tags,
  sortLabel,
  sortColor,
  onInlineSelect,
  onSystemSelect,
  onAddGroup,
  onOpenBuilder,
}: {
  entryKey: string;
  tags: ReturnType<typeof queryToHydrusSearch>;
  sortLabel: string;
  sortColor?: string;
  onInlineSelect: (tag: string) => void;
  onSystemSelect: (fieldName: string) => void;
  onAddGroup: () => void;
  onOpenBuilder: () => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="@container flex flex-wrap items-center gap-2">
        <TagAutocompleteInput
          className={cn("relative", "min-w-56 flex-1")}
          inputClassName={cn("h-9", "min-w-0")}
          placeholder="Add tag or system predicate"
          name={`hyaway-qb-collapsed-${entryKey}`}
          onSelect={onInlineSelect}
          onSubmit={onInlineSelect}
          onBlur={onInlineSelect}
          clearOnSelect
        />
        <SystemFieldCombobox
          className="**:data-[label=add]:hidden!"
          onSelect={onSystemSelect}
        />
        <Button
          variant="outline"
          size="sm"
          className="w-auto shrink-0 px-2.5 **:data-[label=add]:hidden! **:data-[label=group]:hidden!"
          onClick={onAddGroup}
          type="button"
        >
          <IconPlus data-icon="inline-start" className="size-5" />
          <span data-label="add" className="hidden @sm:inline">
            Add
          </span>
          <span>OR</span>
          <span data-label="group" className="hidden @xs:inline">
            group
          </span>
        </Button>
      </div>
      <StagedSearchTagList
        tags={tags}
        sortLabel={sortLabel}
        sortColor={sortColor}
        onOpenBuilder={onOpenBuilder}
      />
    </div>
  );
}

function StagedSearchTagList({
  tags,
  sortLabel,
  sortColor,
  onOpenBuilder,
}: {
  tags: ReturnType<typeof queryToHydrusSearch>;
  sortLabel: string;
  sortColor?: string;
  onOpenBuilder?: () => void;
}) {
  const hasTags = tags.length > 0;
  const content = (
    <SearchTagList
      tags={hasTags ? tags : ["(empty)"]}
      sortLabel={hasTags ? sortLabel : undefined}
      sortColor={hasTags ? sortColor : undefined}
      interactive={false}
      className="select-none **:select-none"
    />
  );

  if (!onOpenBuilder) return content;

  return (
    <div
      role="button"
      tabIndex={0}
      className="cursor-pointer rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      onClick={onOpenBuilder}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        onOpenBuilder();
      }}
    >
      {content}
    </div>
  );
}
