// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useEffect, useMemo, useState } from "react";
import { IconChevronDown, IconChevronUp, IconPlus } from "@tabler/icons-react";
import {
  QueryBuilder,
  RuleGroupBodyComponents,
  RuleGroupHeaderComponents,
} from "react-querybuilder";
import {
  FILE_SERVICE_TYPES,
  buildRatingFieldGroups,
  fieldGroups,
  getDefaultSortAsc,
  getSortColorHex,
  getSortLabel,
} from "../-lib/query-builder-fields";
import {
  enforceCombinators,
  getFocusedRootBodyProps,
  getQueryBuilderRootContext,
  getRootSearchEntries,
  handleAddGroup,
  handleAddRule,
} from "../-lib/system-predicate-builder-helpers";
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
import { SearchSortTag } from "./search-sort-tag";
import { SortSection } from "./sort-select";
import type { ReactNode } from "react";
import type {
  AddRuleContext,
  PickedSearchSection,
  QueryBuilderRootContext,
  StagedSearchEntry,
} from "../-lib/system-predicate-builder-helpers";
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
import { Badge } from "@/components/ui-primitives/badge";
import { Button } from "@/components/ui-primitives/button";
import { OrTagBadge, TagBadgeFromString } from "@/components/tag/tag-badge";
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

const FOCUSED_ROOT_QUERY_BUILDER_CLASSNAME = cn(
  "*:data-[level='0']:border-0",
  "*:data-[level='0']:bg-transparent",
  "*:data-[level='0']:p-0",
);

const PICKED_STAGED_TAG_CLASSNAME = cn(
  "ring-[3px]",
  "ring-primary/80",
  "ring-offset-2",
  "ring-offset-background",
);

const STAGED_OR_GROUP_BUTTON_CLASSNAME = cn(
  "group/staged-or inline-flex flex-wrap gap-1.5 rounded-4xl",
  "border-0 bg-transparent text-inherit outline-none",
  "focus-visible:ring-[3px] focus-visible:ring-primary/80",
  "focus-visible:ring-offset-2 focus-visible:ring-offset-background",
);

const STAGED_OR_GROUP_BADGE_CLASSNAME = cn(
  "group-hover/staged-or:before:bg-[color-mix(in_srgb,var(--badge-overlay)_25%,transparent)]",
);

// ---------------------------------------------------------------------------
// Inline tag input rendered at the bottom of each rule group body
// ---------------------------------------------------------------------------

function QBRuleGroupBody(props: RuleGroupProps & UseRuleGroup) {
  const rootContext = getQueryBuilderRootContext(props.context);
  const isRootGroup = props.path.length === 0;
  const showInlineInput =
    !isRootGroup || rootContext?.rootBuilderOpen !== false;
  const bodyProps = useMemo(
    () => getFocusedRootBodyProps(props, rootContext),
    [props, rootContext],
  );

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
      <RuleGroupBodyComponents {...bodyProps} />
      {showInlineInput && hasRules && (
        <div className="pt-2 pb-3 @md:pt-1 @md:pb-2">
          <CombinatorSeparator text={combinator} />
        </div>
      )}
      {showInlineInput && (
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
      )}
    </>
  );
}

function QBRuleGroupHeader(props: RuleGroupProps & UseRuleGroup) {
  const rootContext = getQueryBuilderRootContext(props.context);

  if (props.path.length === 0 && rootContext?.rootBuilderOpen === false) {
    return null;
  }

  return <RuleGroupHeaderComponents {...props} />;
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
  const [pickedSection, setPickedSection] = useState<PickedSearchSection>(null);
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

  const rootSearchEntries = useMemo(() => getRootSearchEntries(query), [query]);
  const hydrusSearch = useMemo(
    () => rootSearchEntries.map(({ entry: searchEntry }) => searchEntry),
    [rootSearchEntries],
  );
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
  const selectedRootSectionKey =
    pickedSection?.kind === "root" ? pickedSection.key : null;
  const sortSectionPicked = pickedSection?.kind === "sort";
  const builderContentOpen = isOpen || pickedSection !== null;
  const showQueryBuilderContent = isOpen || selectedRootSectionKey !== null;

  const handleToggleRootBuilder = useCallback(() => {
    if (isOpen) {
      setIsOpen(false);
      setPickedSection(null);
      return;
    }

    setIsOpen(true);
  }, [isOpen]);

  const handleOpenRootBuilder = useCallback(() => {
    setPickedSection(null);
    setIsOpen(true);
  }, []);

  const handleRootEntrySelect = useCallback((key: string) => {
    setPickedSection((current) =>
      current?.kind === "root" && current.key === key
        ? null
        : { kind: "root", key },
    );
  }, []);

  const handleSortSelect = useCallback(() => {
    setPickedSection((current) =>
      current?.kind === "sort" ? null : { kind: "sort" },
    );
  }, []);

  const queryBuilderContext = useMemo<QueryBuilderRootContext>(
    () => ({
      rootBuilderOpen: isOpen,
      selectedRootSectionKey,
    }),
    [isOpen, selectedRootSectionKey],
  );

  const queryBuilderControlElements = useMemo(
    () => ({
      fieldSelector: QBFieldSelect,
      operatorSelector: QBOperatorSelect,
      valueEditor: QBValueEditor,
      addRuleAction: QBActionElement,
      removeRuleAction: QBActionElement,
      addGroupAction: QBActionElement,
      removeGroupAction: QBActionElement,
      combinatorSelector: QBCombinatorSelect,
      ruleGroupBodyElements: QBRuleGroupBody,
      ruleGroupHeaderElements: QBRuleGroupHeader,
    }),
    [],
  );
  const queryBuilderClassnames = useMemo(
    () => ({
      ...controlClassnames,
      queryBuilder: cn(
        controlClassnames.queryBuilder,
        !isOpen &&
          selectedRootSectionKey &&
          FOCUSED_ROOT_QUERY_BUILDER_CLASSNAME,
      ),
    }),
    [isOpen, selectedRootSectionKey],
  );

  const handleQueryChange = useCallback(
    (q: RuleGroupType) => {
      setStagedQuery(entryKey, enforceCombinators(q));
    },
    [entryKey, setStagedQuery],
  );

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
    setPickedSection(null);
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

  useEffect(() => {
    if (pickedSection?.kind !== "root") return;
    if (rootSearchEntries.some(({ key }) => key === pickedSection.key)) return;

    setPickedSection(null);
  }, [pickedSection, rootSearchEntries]);

  return (
    <Collapsible
      open={builderContentOpen}
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
            "focus-visible:ring-ring/50 outline-none focus-visible:ring-3",
          )}
          onClick={handleToggleRootBuilder}
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
        <CollapsedSearchQueryControls
          entryKey={entryKey}
          onInlineSelect={handleRootInlineSelect}
          onSystemSelect={(fieldName) => addRootRule({ inlineTag: fieldName })}
          onAddGroup={handleAddRootGroup}
        />
      )}
      <CollapsibleContent className="flex flex-col gap-2.5">
        {showQueryBuilderContent && (
          <QueryBuilder
            fields={allFieldGroups}
            query={query}
            onQueryChange={handleQueryChange}
            controlClassnames={queryBuilderClassnames}
            suppressStandardClassnames
            showCombinatorsBetweenRules
            parseNumbers
            context={queryBuilderContext}
            onAddRule={handleAddRule}
            onAddGroup={handleAddGroup}
            controlElements={queryBuilderControlElements}
          />
        )}
        {(isOpen || sortSectionPicked) && (
          <SortSection
            sortType={sortType}
            sortAsc={sortAsc}
            onSortTypeChange={handleSortTypeChange}
            onSortAscToggle={handleSortAscToggle}
          />
        )}
        {!instantSearch && isOpen && (
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
      {!isOpen && (
        <StagedSearchTagList
          entries={rootSearchEntries}
          sortLabel={stagedSortLabel}
          sortColor={stagedSortColor}
          selectedRootKey={selectedRootSectionKey}
          sortPicked={sortSectionPicked}
          onRootEntrySelect={handleRootEntrySelect}
          onSortSelect={handleSortSelect}
          onOpenBuilder={handleOpenRootBuilder}
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
    </Collapsible>
  );
}

function CollapsedSearchQueryControls({
  entryKey,
  onInlineSelect,
  onSystemSelect,
  onAddGroup,
}: {
  entryKey: string;
  onInlineSelect: (tag: string) => void;
  onSystemSelect: (fieldName: string) => void;
  onAddGroup: () => void;
}) {
  return (
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
  );
}

function StagedSearchTagList({
  entries,
  sortLabel,
  sortColor,
  selectedRootKey,
  sortPicked,
  onRootEntrySelect,
  onSortSelect,
  onOpenBuilder,
}: {
  entries: Array<StagedSearchEntry>;
  sortLabel: string;
  sortColor?: string;
  selectedRootKey: string | null;
  sortPicked: boolean;
  onRootEntrySelect: (key: string) => void;
  onSortSelect: () => void;
  onOpenBuilder: () => void;
}) {
  const hasTags = entries.length > 0;

  if (!hasTags) {
    return (
      <Badge variant="outline" size="default-wrap" className="select-none">
        No query yet
      </Badge>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5 select-none **:select-none">
      {entries.map(({ key, entry }) => {
        const isPicked = selectedRootKey === key;
        const isOrGroup = Array.isArray(entry);

        return (
          <StagedSearchTagButton
            key={key}
            isPicked={isPicked}
            className={
              isOrGroup
                ? cn(
                    STAGED_OR_GROUP_BUTTON_CLASSNAME,
                    isPicked && PICKED_STAGED_TAG_CLASSNAME,
                  )
                : undefined
            }
            onClick={() => onRootEntrySelect(key)}
            onDoubleClick={onOpenBuilder}
          >
            {isOrGroup ? (
              <OrTagBadge
                tags={entry}
                interactive={false}
                size="default-wrap"
                className={STAGED_OR_GROUP_BADGE_CLASSNAME}
              />
            ) : (
              <TagBadgeFromString
                displayTag={entry}
                size="default-wrap"
                className={isPicked ? PICKED_STAGED_TAG_CLASSNAME : undefined}
              />
            )}
          </StagedSearchTagButton>
        );
      })}
      <StagedSearchTagButton
        isPicked={sortPicked}
        onClick={onSortSelect}
        onDoubleClick={onOpenBuilder}
      >
        <SearchSortTag
          label={sortLabel}
          color={sortColor}
          className={sortPicked ? PICKED_STAGED_TAG_CLASSNAME : undefined}
        />
      </StagedSearchTagButton>
    </div>
  );
}

function StagedSearchTagButton({
  children,
  className,
  isPicked = false,
  onClick,
  onDoubleClick,
}: {
  children: ReactNode;
  className?: string;
  isPicked?: boolean;
  onClick: () => void;
  onDoubleClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={isPicked}
      className={cn(className ?? "contents", "**:cursor-pointer")}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      {children}
    </button>
  );
}
