// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useEffect, useMemo, useState } from "react";
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import { generateID } from "@react-querybuilder/core";
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
import { useSearchPageState } from "../-hooks/use-search-page-state";
import {
  enforceCombinators,
  getFocusedRootBodyProps,
  getQueryBuilderRootContext,
  getRootSearchEntries,
  getRootSectionId,
  handleAddGroup,
  handleAddRule,
} from "../-lib/system-predicate-builder-helpers";
import {
  AddOrGroupButton,
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
import type { ComponentProps, ReactNode } from "react";
import type {
  AddRuleContext,
  PickedSearchSection,
  QueryBuilderRootContext,
  RootSearchSectionId,
  StagedSearchEntry,
} from "../-lib/system-predicate-builder-helpers";
import type {
  RuleGroupProps,
  RuleGroupType,
  RuleType,
  UseRuleGroup,
} from "react-querybuilder";
import type { HydrusFileSortType } from "@/integrations/hydrus-api/models";
import type { RovingTagButtonProps } from "@/components/tag/tag-list-focus";
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "@/components/ui-primitives/select";
import {
  SELECTED_TAG_BADGE_CLASSNAME,
  SELECTED_TAG_BADGE_TRIGGER_CLASSNAME,
  useSelectedTagBadgeStyle,
} from "@/components/tag/tag-badge-selection";
import { OrTagBadge, TagBadgeFromString } from "@/components/tag/tag-badge";
import { TagAutocompleteInput } from "@/components/tag/tag-autocomplete-input";
import { useRovingTagActionTriggers } from "@/components/tag/tag-list-focus";
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

const STAGED_OR_GROUP_BUTTON_CLASSNAME = cn(
  "group/staged-or inline-flex flex-wrap gap-1.5 rounded-4xl",
  "border-0 bg-transparent text-inherit outline-none",
  "focus-visible:ring-[3px] focus-visible:ring-(--selected-tag-focus)",
  "focus-visible:ring-offset-background focus-visible:ring-offset-2",
);

const STAGED_TAG_BUTTON_CLASSNAME =
  "inline-flex rounded-4xl border-0 bg-transparent p-0 text-inherit outline-none";

const STAGED_OR_GROUP_BADGE_CLASSNAME = cn(
  "group-hover/staged-or:before:bg-[color-mix(in_srgb,var(--badge-overlay)_25%,transparent)]",
);

const PICKED_STAGED_OR_GROUP_BADGE_CLASSNAME = cn(
  STAGED_OR_GROUP_BADGE_CLASSNAME,
  "border-(--badge-overlay)",
);

// ---------------------------------------------------------------------------
// Inline tag input rendered at the bottom of each rule group body
// ---------------------------------------------------------------------------

function SearchPredicateInput({
  className,
  inputClassName,
  name,
  onAdd,
}: {
  className?: string;
  inputClassName?: string;
  name: string;
  onAdd: (tag: string) => void;
}) {
  return (
    <TagAutocompleteInput
      className={cn("relative", className)}
      inputClassName={cn("h-9 min-w-0", inputClassName)}
      placeholder="Add tag or system predicate"
      name={name}
      onSelect={onAdd}
      onSubmit={onAdd}
      onBlur={onAdd}
      clearOnSelect
    />
  );
}

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
        <SearchPredicateInput
          className="w-full max-w-2xl"
          inputClassName="max-w-2xl @md:min-w-48"
          name={`hyaway-qb-inline-${props.path.join("-")}`}
          onAdd={handleInlineSelect}
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
  onCommit?: () => void;
}

export function SearchQueryBuilder({ onCommit }: SearchQueryBuilderProps) {
  const {
    searchId: entryKey,
    builderOpen: isOpen,
    instantSearch,
    setBuilderOpen,
  } = useSearchPageState();
  const entry = useSearchQueryEntry(entryKey);
  const {
    setStagedQuery,
    setStagedSort,
    setStagedFileServiceKey,
    commit,
    reset,
    clear,
  } = useSearchQueriesActions();
  const [pickedSection, setPickedSection] = useState<PickedSearchSection>(null);
  const theme = useActiveTheme();

  const query = entry.staged.query;
  const sortType = entry.staged.sort.sortType;
  const sortAsc = entry.staged.sort.sortAsc;
  const fileServiceKey = entry.staged.fileServiceKey;
  const canEditRatings = useHasPermission(Permission.EDIT_FILE_RATINGS);
  const { ratingServices } = useRatingServices();
  const { data: servicesData } = useGetServicesQuery();

  const fileServiceValues = useMemo(() => {
    if (!servicesData) return [];
    return Object.entries(servicesData.services)
      .filter(([, service]) => FILE_SERVICE_TYPES.has(service.type))
      .map(([serviceKey, service]) => ({
        serviceKey,
        name: service.name,
        label: service.name,
      }));
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

  const handleFileServiceChange = useCallback(
    (value: string | null) => {
      setStagedFileServiceKey(entryKey, value);
    },
    [entryKey, setStagedFileServiceKey],
  );

  const rootSearchEntries = useMemo(() => getRootSearchEntries(query), [query]);
  const hydrusSearch = useMemo(
    () =>
      rootSearchEntries.flatMap(({ searchEntry }) =>
        searchEntry ? [searchEntry] : [],
      ),
    [rootSearchEntries],
  );
  const stagedSortLabel = useMemo(
    () => getSortLabel(sortType, sortAsc),
    [sortType, sortAsc],
  );
  const selectedFileService = useMemo(
    () =>
      fileServiceValues.find(
        (service) => service.serviceKey === fileServiceKey,
      ),
    [fileServiceKey, fileServiceValues],
  );
  const stagedFileServiceLabel = selectedFileService
    ? `File domain: ${selectedFileService.name}`
    : undefined;
  const stagedSortColor = useMemo(
    () =>
      getThemeAdjustedColorFromHex(getSortColorHex(sortType, sortAsc), theme),
    [sortType, sortAsc, theme],
  );
  const pickedStagedTagStyle = useSelectedTagBadgeStyle();

  const searchDisabled = hydrusSearch.length === 0;
  const selectedRootSectionId =
    pickedSection?.kind === "root" ? pickedSection.id : null;
  const sortSectionPicked = pickedSection?.kind === "sort";
  const fileServiceSectionPicked = pickedSection?.kind === "fileService";
  const builderContentOpen = isOpen || pickedSection !== null;
  const showQueryBuilderContent = isOpen || selectedRootSectionId !== null;

  const handleToggleRootBuilder = useCallback(() => {
    if (isOpen) {
      setBuilderOpen(false);
      setPickedSection(null);
      return;
    }

    setBuilderOpen(true);
  }, [isOpen, setBuilderOpen]);

  const handleRootEntrySelect = useCallback((id: RootSearchSectionId) => {
    setPickedSection((current) =>
      current?.kind === "root" && current.id === id
        ? null
        : { kind: "root", id },
    );
  }, []);

  const handleSortSelect = useCallback(() => {
    setPickedSection((current) =>
      current?.kind === "sort" ? null : { kind: "sort" },
    );
  }, []);

  const handleFileServiceSelect = useCallback(() => {
    setPickedSection((current) =>
      current?.kind === "fileService" ? null : { kind: "fileService" },
    );
  }, []);

  const queryBuilderContext = useMemo<QueryBuilderRootContext>(
    () => ({
      rootBuilderOpen: isOpen,
      selectedRootSectionId,
    }),
    [isOpen, selectedRootSectionId],
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
          selectedRootSectionId &&
          FOCUSED_ROOT_QUERY_BUILDER_CLASSNAME,
      ),
    }),
    [isOpen, selectedRootSectionId],
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
        {
          id: generateID(),
          field: "tag",
          operator: "=",
          value: "",
        } as RuleType,
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
    const nextGroup = {
      id: generateID(),
      combinator: "or" as const,
      rules: [],
    };
    const nextGroupId = getRootSectionId(nextGroup);

    setStagedQuery(
      entryKey,
      enforceCombinators({
        ...query,
        rules: [...query.rules, nextGroup],
      }),
    );
    setPickedSection({ kind: "root", id: nextGroupId });
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
    if (
      rootSearchEntries.some(({ sectionId }) => sectionId === pickedSection.id)
    ) {
      return;
    }

    setPickedSection(null);
  }, [pickedSection, rootSearchEntries]);

  const builderContent = (
    <CollapsibleContent
      className={cn(
        "flex flex-col gap-2.5",
        !isOpen && pickedSection !== null && "pt-1",
        !isOpen && (sortSectionPicked || fileServiceSectionPicked) && "pb-1",
      )}
    >
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
      {(isOpen || fileServiceSectionPicked) && (
        <FileDomainSection
          value={fileServiceKey}
          services={fileServiceValues}
          onChange={handleFileServiceChange}
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
  );

  return (
    <Collapsible
      open={builderContentOpen}
      className="flex flex-col gap-2 rounded-lg border-b pb-2"
    >
      <div className="flex min-h-9 flex-wrap items-center justify-between gap-2">
        <InstantSearchSwitch
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
      {isOpen && builderContent}
      {!isOpen && (
        <StagedSearchTagList
          entries={rootSearchEntries}
          sortLabel={stagedSortLabel}
          sortColor={stagedSortColor}
          fileServiceLabel={stagedFileServiceLabel}
          selectedRootSectionId={selectedRootSectionId}
          sortPicked={sortSectionPicked}
          fileServicePicked={fileServiceSectionPicked}
          pickedStagedTagStyle={pickedStagedTagStyle}
          onRootEntrySelect={handleRootEntrySelect}
          onSortSelect={handleSortSelect}
          onFileServiceSelect={handleFileServiceSelect}
        />
      )}
      {!isOpen && builderContent}
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
      <SearchPredicateInput
        className="w-full basis-full sm:flex-1 sm:basis-0"
        name={`hyaway-qb-collapsed-${entryKey}`}
        onAdd={onInlineSelect}
      />
      <SystemFieldCombobox onSelect={onSystemSelect} />
      <AddOrGroupButton onClick={onAddGroup} />
    </div>
  );
}

function StagedSearchTagList({
  entries,
  sortLabel,
  sortColor,
  fileServiceLabel,
  selectedRootSectionId,
  sortPicked,
  fileServicePicked,
  pickedStagedTagStyle,
  onRootEntrySelect,
  onSortSelect,
  onFileServiceSelect,
}: {
  entries: Array<StagedSearchEntry>;
  sortLabel: string;
  sortColor?: string;
  fileServiceLabel?: string;
  selectedRootSectionId: RootSearchSectionId | null;
  sortPicked: boolean;
  fileServicePicked: boolean;
  pickedStagedTagStyle: ComponentProps<typeof TagBadgeFromString>["style"];
  onRootEntrySelect: (id: RootSearchSectionId) => void;
  onSortSelect: () => void;
  onFileServiceSelect: () => void;
}) {
  const hasTags = entries.length > 0;
  const rovingTriggers = useRovingTagActionTriggers({
    itemCount: entries.length + 1 + (fileServiceLabel ? 1 : 0),
  });

  if (!hasTags && !fileServiceLabel) {
    return (
      <Badge
        variant="outline"
        size="compact-mobile-wrap"
        className="select-none"
      >
        No query yet
      </Badge>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5 select-none **:select-none max-sm:gap-1">
      {entries.map(({ key, sectionId, entry }, index) => {
        const isPicked = selectedRootSectionId === sectionId;
        const isOrGroup = Array.isArray(entry);
        const stagedTagClassName = cn(isPicked && SELECTED_TAG_BADGE_CLASSNAME);

        return (
          <StagedSearchTagButton
            key={key}
            isPicked={isPicked}
            className={isOrGroup ? STAGED_OR_GROUP_BUTTON_CLASSNAME : undefined}
            onClick={() => onRootEntrySelect(sectionId)}
            rovingProps={rovingTriggers.getButtonProps(index)}
          >
            {isOrGroup ? (
              <OrTagBadge
                tags={entry}
                interactive={false}
                size="compact-mobile-wrap"
                className={
                  isPicked
                    ? PICKED_STAGED_OR_GROUP_BADGE_CLASSNAME
                    : STAGED_OR_GROUP_BADGE_CLASSNAME
                }
                style={isPicked ? pickedStagedTagStyle : undefined}
              />
            ) : (
              <TagBadgeFromString
                displayTag={entry}
                size="compact-mobile-wrap"
                className={stagedTagClassName}
                style={isPicked ? pickedStagedTagStyle : undefined}
              />
            )}
          </StagedSearchTagButton>
        );
      })}
      <StagedSearchTagButton
        isPicked={sortPicked}
        onClick={onSortSelect}
        rovingProps={rovingTriggers.getButtonProps(entries.length)}
      >
        <SearchSortTag
          label={sortLabel}
          color={sortColor}
          size="compact-mobile-wrap"
          selected={sortPicked}
        />
      </StagedSearchTagButton>
      {fileServiceLabel && (
        <StagedSearchTagButton
          isPicked={fileServicePicked}
          onClick={onFileServiceSelect}
          rovingProps={rovingTriggers.getButtonProps(entries.length + 1)}
        >
          <TagBadgeFromString
            displayTag={fileServiceLabel}
            size="compact-mobile-wrap"
            className={cn(fileServicePicked && SELECTED_TAG_BADGE_CLASSNAME)}
            style={fileServicePicked ? pickedStagedTagStyle : undefined}
          />
        </StagedSearchTagButton>
      )}
    </div>
  );
}

type FileServiceOption = {
  serviceKey: string;
  name: string;
  label: string;
};

function FileDomainSection({
  value,
  services,
  onChange,
}: {
  value: string | null;
  services: Array<FileServiceOption>;
  onChange: (value: string | null) => void;
}) {
  const selectValue = value ?? "__all__";
  const selectedLabel =
    services.find((service) => service.serviceKey === value)?.label ??
    "(default)";

  return (
    <div className="@container flex max-w-2xl flex-wrap items-center gap-2">
      <span className="text-muted-foreground shrink-0 text-sm font-medium">
        File domain
      </span>
      <div className="flex min-w-full flex-1 flex-wrap items-center gap-2 @sm:min-w-0">
        <Select
          value={selectValue}
          onValueChange={(nextValue) =>
            onChange(nextValue === "__all__" ? null : nextValue)
          }
        >
          <SelectTrigger
            aria-label="File domain"
            className="min-w-40 flex-1 basis-40 rounded-lg"
          >
            <span className="truncate">{selectedLabel}</span>
          </SelectTrigger>
          <SelectContent align="start" className="max-h-[60dvh]">
            <SelectGroup>
              <SelectItem value="__all__">(default)</SelectItem>
              {services.map((service) => (
                <SelectItem key={service.serviceKey} value={service.serviceKey}>
                  {service.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function StagedSearchTagButton({
  children,
  className,
  isPicked = false,
  onClick,
  rovingProps,
}: {
  children: ReactNode;
  className?: string;
  isPicked?: boolean;
  onClick: () => void;
  rovingProps?: RovingTagButtonProps;
}) {
  const focusStyle = useSelectedTagBadgeStyle("--selected-tag-overlay");
  const hasFocusContainer = className !== undefined;

  return (
    <button
      type="button"
      aria-pressed={isPicked}
      style={focusStyle}
      className={cn(
        className ?? STAGED_TAG_BUTTON_CLASSNAME,
        !hasFocusContainer && SELECTED_TAG_BADGE_TRIGGER_CLASSNAME,
        "**:cursor-pointer",
      )}
      onClick={onClick}
      {...rovingProps}
    >
      {children}
    </button>
  );
}
