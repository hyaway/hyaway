// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { memo, useCallback, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { IconDots, IconMinus, IconPlus, IconSearch } from "@tabler/icons-react";
import type { ComponentType, ReactNode, SVGProps } from "react";
import type { RuleGroupType } from "react-querybuilder";
import { Button } from "@/components/ui-primitives/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui-primitives/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui-primitives/dropdown-menu";
import {
  nextUniqueName,
  useSearchQueriesActions,
  useSearchQueryEntry,
} from "@/stores/search-queries-store";
import { generateSearchId } from "@/lib/search-entry-utils";

export interface TagAction {
  id: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  onClick: () => void;
}

export function useTagActions(
  tag: string,
  searchId: string | undefined,
): Array<TagAction> {
  const navigate = useNavigate();
  const { setStagedQuery } = useSearchQueriesActions();
  const entry = useSearchQueryEntry(searchId ?? "");

  const handleSearch = useCallback(() => {
    const query: RuleGroupType = {
      combinator: "and",
      rules: [
        { field: "tag", operator: "=", value: tag },
        { field: "limit", operator: "=", value: 256 },
      ],
    };
    const displayName = nextUniqueName(tag);
    const id = generateSearchId(displayName);
    setStagedQuery(id, query, displayName);
    navigate({ to: "/search/$searchId", params: { searchId: id } });
  }, [tag, navigate, setStagedQuery]);

  const handleInclude = useCallback(() => {
    if (!searchId) return;
    const currentQuery = entry.staged.query;
    setStagedQuery(searchId, {
      ...currentQuery,
      rules: [
        ...currentQuery.rules,
        { field: "tag", operator: "=", value: tag },
      ],
    });
  }, [tag, searchId, entry.staged.query, setStagedQuery]);

  const handleExclude = useCallback(() => {
    if (!searchId) return;
    const currentQuery = entry.staged.query;
    setStagedQuery(searchId, {
      ...currentQuery,
      rules: [
        ...currentQuery.rules,
        { field: "tag", operator: "=", value: `-${tag}` },
      ],
    });
  }, [tag, searchId, entry.staged.query, setStagedQuery]);

  return useMemo(() => {
    const actions: Array<TagAction> = [
      {
        id: "search",
        label: "Search for this tag",
        icon: IconSearch,
        onClick: handleSearch,
      },
    ];
    if (searchId) {
      actions.push(
        {
          id: "include",
          label: "Add to search",
          icon: IconPlus,
          onClick: handleInclude,
        },
        {
          id: "exclude",
          label: "Exclude from search",
          icon: IconMinus,
          onClick: handleExclude,
        },
      );
    }
    return actions;
  }, [searchId, handleSearch, handleInclude, handleExclude]);
}

function TagActionMenuItems({ actions }: { actions: Array<TagAction> }) {
  return actions.map((action) => (
    <DropdownMenuItem key={action.id} onClick={action.onClick}>
      <action.icon />
      {action.label}
    </DropdownMenuItem>
  ));
}

function TagActionContextItems({ actions }: { actions: Array<TagAction> }) {
  return actions.map((action) => (
    <ContextMenuItem key={action.id} onClick={action.onClick}>
      <action.icon />
      {action.label}
    </ContextMenuItem>
  ));
}

/** Wraps children in a context menu with tag actions. */
export const TagContextMenu = memo(function TagContextMenu({
  actions,
  children,
}: {
  actions: Array<TagAction>;
  children: ReactNode;
}) {
  return (
    <ContextMenu>
      <ContextMenuTrigger className="min-w-0">{children}</ContextMenuTrigger>
      <ContextMenuContent>
        <TagActionContextItems actions={actions} />
      </ContextMenuContent>
    </ContextMenu>
  );
});

/** Dropdown button that opens tag actions menu. */
export const TagActionsDropdown = memo(function TagActionsDropdown({
  actions,
}: {
  actions: Array<TagAction>;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground shrink-0 rounded-xs"
          >
            <IconDots className="size-4" />
          </Button>
        }
      />
      <DropdownMenuContent side="right" align="start">
        <TagActionMenuItems actions={actions} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
