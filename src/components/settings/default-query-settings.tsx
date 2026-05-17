// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useMemo } from "react";
import { IconEraser } from "@tabler/icons-react";
import type { RuleType } from "react-querybuilder";
import type { DropdownMenuHandle } from "@/components/ui-primitives/dropdown-menu";
import {
  isSystemTag,
  useFavouriteTagAction,
} from "@/components/tag/tag-actions";
import { TagBadgeFromString } from "@/components/tag/tag-badge";
import {
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShared,
  DropdownMenuTrigger,
} from "@/components/ui-primitives/dropdown-menu";
import { Button } from "@/components/ui-primitives/button";
import {
  useDefaultQuery,
  useSearchSettingsActions,
} from "@/stores/search-settings-store";
import {
  defaultStaged,
  serializeSearchQueryForComparison,
} from "@/stores/search-defaults";

export const DEFAULT_QUERY_SETTINGS_TITLE = "Default query";

/** Convert a query-builder rule to a display string for tag badges. */
function ruleToDisplayString(rule: RuleType): string | null {
  const { field, operator, value } = rule;

  if (field === "tag") {
    const v = typeof value === "string" ? value.trim() : "";
    return v || null;
  }

  // Status fields
  if (field === "inbox") return "system:inbox";
  if (field === "archive") return "system:archive";
  if (field === "everything") return "system:everything";

  // System fields with values
  if (!value && value !== 0) return null;
  if (field === "limit") return `system:limit = ${value}`;

  return `system:${field} ${operator} ${value}`;
}

type DisplayRule = { index: number; displayTag: string };

// ---------------------------------------------------------------------------
// Menu items
// ---------------------------------------------------------------------------

function DefaultQueryMenuItems({
  tag,
  onRemove,
}: {
  tag: string;
  onRemove: () => void;
}) {
  const favouriteAction = useFavouriteTagAction(tag);
  const showFavourite = favouriteAction && !isSystemTag(tag);

  return (
    <>
      <DropdownMenuGroup>
        <DropdownMenuLabel className="p-0">
          <TagBadgeFromString
            displayTag={tag}
            className="h-auto w-full justify-center px-2 py-3 break-normal wrap-anywhere whitespace-normal"
          />
        </DropdownMenuLabel>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={onRemove} className="cursor-pointer">
        <IconEraser />
        Remove from default
      </DropdownMenuItem>
      {showFavourite && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={favouriteAction.onClick}
            className="cursor-pointer"
          >
            <favouriteAction.icon />
            {favouriteAction.label}
          </DropdownMenuItem>
        </>
      )}
    </>
  );
}

interface DefaultQueryMenuPayload {
  tag: string;
  ruleIndex: number;
}

// ---------------------------------------------------------------------------
// Trigger button
// ---------------------------------------------------------------------------

function DefaultQueryTagTrigger({
  displayTag,
  ruleIndex,
  menuHandle,
}: {
  displayTag: string;
  ruleIndex: number;
  menuHandle: DropdownMenuHandle<DefaultQueryMenuPayload>;
}) {
  return (
    <DropdownMenuTrigger
      type="button"
      handle={menuHandle}
      payload={{ tag: displayTag, ruleIndex }}
      className="cursor-pointer select-none **:select-none"
    >
      <TagBadgeFromString displayTag={displayTag} size="default-wrap" />
    </DropdownMenuTrigger>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function DefaultQuerySettings() {
  const defaultQuery = useDefaultQuery();
  const { setDefaultQuery, resetDefaultQuery } = useSearchSettingsActions();

  const isModified = useMemo(() => {
    const base = defaultStaged();
    return (
      serializeSearchQueryForComparison(defaultQuery.query) !==
      serializeSearchQueryForComparison(base.query)
    );
  }, [defaultQuery.query]);

  const displayRules = useMemo(() => {
    const rules: Array<DisplayRule> = [];
    defaultQuery.query.rules.forEach((rule, index) => {
      if ("field" in rule) {
        const tag = ruleToDisplayString(rule);
        if (tag) rules.push({ index, displayTag: tag });
      }
    });
    return rules;
  }, [defaultQuery.query.rules]);

  const handleRemoveRule = useCallback(
    (ruleIndex: number) => {
      const newRules = defaultQuery.query.rules.filter(
        (_, i) => i !== ruleIndex,
      );
      setDefaultQuery({
        ...defaultQuery,
        query: { ...defaultQuery.query, rules: newRules },
      });
    },
    [defaultQuery, setDefaultQuery],
  );

  return (
    <DropdownMenuShared<DefaultQueryMenuPayload>
      modal={false}
      content={(payload) => (
        <DropdownMenuContent
          side="bottom"
          showBackdrop={false}
          className="w-auto"
        >
          {payload && (
            <DefaultQueryMenuItems
              key={`${payload.ruleIndex}:${payload.tag}`}
              tag={payload.tag}
              onRemove={() => handleRemoveRule(payload.ruleIndex)}
            />
          )}
        </DropdownMenuContent>
      )}
    >
      {(menuHandle) => (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium">Default query</span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={resetDefaultQuery}
              disabled={!isModified}
              aria-label="Clear default query"
              title="Clear default query"
            >
              <IconEraser className="size-5" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {displayRules.length > 0 ? (
              displayRules.map((rule) => (
                <DefaultQueryTagTrigger
                  key={rule.index}
                  displayTag={rule.displayTag}
                  ruleIndex={rule.index}
                  menuHandle={menuHandle}
                />
              ))
            ) : (
              <span className="text-muted-foreground text-sm">Empty query</span>
            )}
          </div>
        </div>
      )}
    </DropdownMenuShared>
  );
}
