// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import React, { memo, useCallback, useMemo, useRef, useState } from "react";
import { IconEraser } from "@tabler/icons-react";
import type { RuleType } from "react-querybuilder";
import {
  isSystemTag,
  useFavouriteTagAction,
} from "@/components/tag/tag-actions";
import { TagBadgeFromString } from "@/components/tag/tag-badge";
import {
  DropdownMenu,
  DropdownMenuAnchoredContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui-primitives/dropdown-menu";
import { Button } from "@/components/ui-primitives/button";
import {
  useDefaultQuery,
  useSearchSettingsActions,
} from "@/stores/search-settings-store";
import { defaultStaged } from "@/stores/search-defaults";

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

// ---------------------------------------------------------------------------
// Shared menu popup
// ---------------------------------------------------------------------------

interface PopupHandle {
  open: (tag: string, ruleIndex: number, anchor: HTMLElement) => void;
}

const DefaultQueryMenuPopup = memo(function DefaultQueryMenuPopup({
  handleRef,
  onRemoveRule,
}: {
  handleRef: React.RefObject<PopupHandle | null>;
  onRemoveRule: (index: number) => void;
}) {
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLElement | null>(null);
  const lastCloseRef = useRef<{ anchor: HTMLElement; time: number } | null>(
    null,
  );

  const handleRemove = useCallback(() => {
    onRemoveRule(activeIndex);
  }, [activeIndex, onRemoveRule]);

  const handleOpenChange = useCallback(
    (_next: boolean, details: { reason: string }) => {
      if (
        details.reason !== "focus-out" &&
        details.reason !== "trigger-hover"
      ) {
        lastCloseRef.current = {
          anchor: anchorRef.current!,
          time: Date.now(),
        };
        setOpen(false);
      }
    },
    [],
  );

  React.useImperativeHandle(handleRef, () => ({
    open(tag: string, ruleIndex: number, anchor: HTMLElement) {
      const last = lastCloseRef.current;
      if (last && last.anchor === anchor && Date.now() - last.time < 300) {
        lastCloseRef.current = null;
        return;
      }
      anchorRef.current = anchor;
      setActiveTag(tag);
      setActiveIndex(ruleIndex);
      setOpen(true);
    },
  }));

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange} modal={false}>
      <DropdownMenuAnchoredContent anchor={anchorRef.current} side="bottom">
        {activeTag && (
          <DefaultQueryMenuItems tag={activeTag} onRemove={handleRemove} />
        )}
      </DropdownMenuAnchoredContent>
    </DropdownMenu>
  );
});

// ---------------------------------------------------------------------------
// Trigger button
// ---------------------------------------------------------------------------

function DefaultQueryTagTrigger({
  displayTag,
  ruleIndex,
  onOpen,
}: {
  displayTag: string;
  ruleIndex: number;
  onOpen: (tag: string, index: number, anchor: HTMLElement) => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  const handleClick = useCallback(() => {
    if (ref.current) onOpen(displayTag, ruleIndex, ref.current);
  }, [displayTag, ruleIndex, onOpen]);

  return (
    <button
      ref={ref}
      type="button"
      onClick={handleClick}
      className="cursor-pointer select-none **:select-none"
    >
      <TagBadgeFromString displayTag={displayTag} size="default-wrap" />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function DefaultQuerySettings() {
  const defaultQuery = useDefaultQuery();
  const { setDefaultQuery, resetDefaultQuery } = useSearchSettingsActions();
  const popupRef = useRef<PopupHandle>(null);

  const isModified = useMemo(() => {
    const base = defaultStaged();
    return JSON.stringify(defaultQuery.query) !== JSON.stringify(base.query);
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

  const handleOpen = useCallback(
    (tag: string, index: number, anchor: HTMLElement) => {
      popupRef.current?.open(tag, index, anchor);
    },
    [],
  );

  return (
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
              onOpen={handleOpen}
            />
          ))
        ) : (
          <span className="text-muted-foreground text-sm">Empty query</span>
        )}
      </div>
      <DefaultQueryMenuPopup
        handleRef={popupRef}
        onRemoveRule={handleRemoveRule}
      />
    </div>
  );
}
