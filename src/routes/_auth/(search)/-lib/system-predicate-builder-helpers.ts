// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { ruleToSearchTag } from "./query-to-hydrus-search";
import { fieldGroups, systemTagToRule } from "./query-builder-fields";
import type {
  RuleGroupProps,
  RuleGroupType,
  RuleGroupTypeAny,
  RuleType,
  UseRuleGroup,
} from "react-querybuilder";
import type { HydrusTagSearch } from "@/integrations/hydrus-api/models";

export type HydrusSearchEntry = HydrusTagSearch[number];

export type StagedSearchEntry = {
  key: string;
  entry: HydrusSearchEntry;
  searchEntry: HydrusSearchEntry | null;
  isEmpty: boolean;
};

export type PickedSearchSection =
  | { kind: "root"; key: string }
  | { kind: "sort" }
  | null;

export type QueryBuilderRootContext = {
  rootBuilderOpen: boolean;
  selectedRootSectionKey: string | null;
};

export type AddRuleContext = Parameters<typeof handleAddRule>[3];

/** Force sub-groups to always use OR combinator (only creates new objects when needed). */
export function enforceCombinators(query: RuleGroupType): RuleGroupType {
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

/** Prevent nested groups beyond 1 level deep. */
export const handleAddGroup = (
  _group: RuleGroupType,
  parentPath: Array<number>,
) => {
  return parentPath.length === 0;
};

/** Set the default field based on the context passed from the action button. */
export const handleAddRule = (
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

export function getQueryBuilderRootContext(
  context: unknown,
): QueryBuilderRootContext | null {
  if (!context || typeof context !== "object") return null;
  return context as QueryBuilderRootContext;
}

export function getRootSectionKey(
  path: Array<number>,
  ruleOrGroup: RuleType | RuleGroupTypeAny,
): string {
  const id = "id" in ruleOrGroup ? ruleOrGroup.id : undefined;
  if (id != null && String(id).length > 0) return `id:${String(id)}`;
  return `path:${path[0] ?? 0}`;
}

function rootRuleOrGroupToStagedEntry(
  ruleOrGroup: RuleType | RuleGroupTypeAny,
): Pick<StagedSearchEntry, "entry" | "searchEntry" | "isEmpty"> {
  if ("rules" in ruleOrGroup) {
    const displayTags: Array<string> = [];
    const searchTags: Array<string> = [];
    let hasEmptyRule = false;

    for (const nestedRuleOrGroup of ruleOrGroup.rules) {
      if (typeof nestedRuleOrGroup === "string") continue;
      if ("rules" in nestedRuleOrGroup) continue;

      const tag = ruleToSearchTag(nestedRuleOrGroup);
      if (tag) {
        displayTags.push(tag);
        searchTags.push(tag);
      } else {
        displayTags.push(
          ruleToSearchTag(nestedRuleOrGroup, { allowIncomplete: true }) ??
            "Empty rule",
        );
        hasEmptyRule = true;
      }
    }

    if (displayTags.length === 0) {
      return {
        entry: "(empty OR group)",
        searchEntry: null,
        isEmpty: true,
      };
    }

    return {
      entry: displayTags.length === 1 ? displayTags[0] : displayTags,
      searchEntry:
        searchTags.length === 0
          ? null
          : searchTags.length === 1
            ? searchTags[0]
            : searchTags,
      isEmpty: hasEmptyRule,
    };
  }

  const tag = ruleToSearchTag(ruleOrGroup);

  return {
    entry:
      tag ??
      ruleToSearchTag(ruleOrGroup, { allowIncomplete: true }) ??
      "(empty)",
    searchEntry: tag,
    isEmpty: !tag,
  };
}

export function getRootSearchEntries(
  query: RuleGroupType,
): Array<StagedSearchEntry> {
  return query.rules.flatMap((ruleOrGroup, index) => {
    if (typeof ruleOrGroup === "string") return [];
    const entry = rootRuleOrGroupToStagedEntry(ruleOrGroup);

    return [
      {
        key: getRootSectionKey([index], ruleOrGroup),
        ...entry,
      },
    ];
  });
}

export function getFocusedRootBodyProps(
  props: RuleGroupProps & UseRuleGroup,
  rootContext: QueryBuilderRootContext | null,
): RuleGroupProps & UseRuleGroup {
  if (
    props.path.length !== 0 ||
    rootContext?.rootBuilderOpen !== false ||
    !rootContext.selectedRootSectionKey
  ) {
    return props;
  }

  const selectedIndex = props.ruleGroup.rules.findIndex(
    (ruleOrGroup, index) => {
      if (typeof ruleOrGroup === "string") return false;
      return (
        getRootSectionKey(
          props.pathsMemo[index]?.path ?? [index],
          ruleOrGroup,
        ) === rootContext.selectedRootSectionKey
      );
    },
  );

  if (selectedIndex < 0) {
    return {
      ...props,
      ruleGroup: { ...props.ruleGroup, rules: [] } as RuleGroupTypeAny,
      pathsMemo: [],
    };
  }

  const selectedRuleOrGroup = props.ruleGroup.rules[selectedIndex];
  const selectedPathMemo = props.pathsMemo[selectedIndex];
  if (typeof selectedRuleOrGroup === "string") {
    return props;
  }

  return {
    ...props,
    ruleGroup: {
      ...props.ruleGroup,
      rules: [selectedRuleOrGroup],
    } as RuleGroupTypeAny,
    pathsMemo: [selectedPathMemo],
  };
}
