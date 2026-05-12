// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { memo, useCallback, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  IconCopy,
  IconDots,
  IconMinus,
  IconPlus,
  IconSearch,
  IconStar,
  IconStarOff,
} from "@tabler/icons-react";
import type { ComponentType, ReactNode, SVGProps } from "react";
import type { RuleGroupType } from "react-querybuilder";
import { Button } from "@/components/ui-primitives/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui-primitives/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui-primitives/dropdown-menu";
import {
  nextUniqueName,
  useSearchQueriesActions,
  useSearchQueryEntry,
} from "@/stores/search-queries-store";
import { generateSearchId } from "@/lib/search-entry-utils";
import {
  useFavouriteTagsLookup,
  useSetFavouriteTagsMutation,
} from "@/integrations/hydrus-api/queries/tags";
import { useHasPermission } from "@/integrations/hydrus-api/queries/access";
import { Permission } from "@/integrations/hydrus-api/models";

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

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(tag);
  }, [tag]);

  return useMemo(() => {
    const actions: Array<TagAction> = [
      {
        id: "copy",
        label: "Copy tag",
        icon: IconCopy,
        onClick: handleCopy,
      },
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
  }, [searchId, handleCopy, handleSearch, handleInclude, handleExclude]);
}

/**
 * Returns a favourite toggle action for a tag, or `null` if the user
 * doesn't have Add Tags permission.
 */
export function useFavouriteTagAction(tag: string): TagAction | null {
  const canTags = useHasPermission(Permission.EDIT_FILE_TAGS);
  const favourites = useFavouriteTagsLookup();
  const { mutate } = useSetFavouriteTagsMutation();
  const isFavourite = favourites.has(tag);

  const handleToggle = useCallback(() => {
    if (isFavourite) {
      mutate({ remove: [tag] });
    } else {
      mutate({ add: [tag] });
    }
  }, [tag, isFavourite, mutate]);

  if (!canTags) return null;

  return {
    id: "favourite",
    label: isFavourite ? "Remove from favourites" : "Add to favourites",
    icon: isFavourite ? IconStarOff : IconStar,
    onClick: handleToggle,
  };
}

function TagActionMenuItems({
  actions,
  favouriteAction,
}: {
  actions: Array<TagAction>;
  favouriteAction?: TagAction | null;
}) {
  return (
    <>
      {actions.map((action) => (
        <DropdownMenuItem key={action.id} onClick={action.onClick}>
          <action.icon />
          {action.label}
        </DropdownMenuItem>
      ))}
      {favouriteAction && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={favouriteAction.onClick}>
            <favouriteAction.icon />
            {favouriteAction.label}
          </DropdownMenuItem>
        </>
      )}
    </>
  );
}

function TagActionContextItems({
  actions,
  favouriteAction,
}: {
  actions: Array<TagAction>;
  favouriteAction?: TagAction | null;
}) {
  return (
    <>
      {actions.map((action) => (
        <ContextMenuItem key={action.id} onClick={action.onClick}>
          <action.icon />
          {action.label}
        </ContextMenuItem>
      ))}
      {favouriteAction && (
        <>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={favouriteAction.onClick}>
            <favouriteAction.icon />
            {favouriteAction.label}
          </ContextMenuItem>
        </>
      )}
    </>
  );
}

/** Wraps children in a context menu with tag actions. */
export const TagContextMenu = memo(function TagContextMenu({
  actions,
  favouriteAction,
  children,
}: {
  actions: Array<TagAction>;
  favouriteAction?: TagAction | null;
  children: ReactNode;
}) {
  return (
    <ContextMenu>
      <ContextMenuTrigger className="min-w-0 [&_*]:select-none">
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent>
        <TagActionContextItems
          actions={actions}
          favouriteAction={favouriteAction}
        />
      </ContextMenuContent>
    </ContextMenu>
  );
});

/** Dropdown button that opens tag actions menu. */
export const TagActionsDropdown = memo(function TagActionsDropdown({
  actions,
  favouriteAction,
}: {
  actions: Array<TagAction>;
  favouriteAction?: TagAction | null;
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
        <TagActionMenuItems
          actions={actions}
          favouriteAction={favouriteAction}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
