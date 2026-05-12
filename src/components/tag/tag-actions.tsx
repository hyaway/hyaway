// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { memo, useCallback, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  IconCopy,
  IconMinus,
  IconPlus,
  IconSearch,
  IconStar,
  IconStarOff,
  IconTrash,
} from "@tabler/icons-react";
import type { ComponentType, ReactNode, SVGProps } from "react";
import type { RuleGroupType } from "react-querybuilder";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui-primitives/context-menu";
import {
  nextUniqueName,
  useSearchQueriesActions,
  useSearchQueryEntry,
} from "@/stores/search-queries-store";
import { generateSearchId } from "@/lib/search-entry-utils";
import { cn } from "@/lib/utils";
import {
  useFavouriteTagsLookup,
  useSetFavouriteTagsMutation,
} from "@/integrations/hydrus-api/queries/tags";
import { useHasPermission } from "@/integrations/hydrus-api/queries/access";
import { Permission } from "@/integrations/hydrus-api/models";
import { TagBadgeFromString } from "@/components/tag/tag-badge";

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

  const handleRemove = useCallback(
    (value: string) => {
      if (!searchId) return;
      const currentQuery = entry.staged.query;
      setStagedQuery(searchId, {
        ...currentQuery,
        rules: currentQuery.rules.filter(
          (r) => !("field" in r && r.field === "tag" && r.value === value),
        ),
      });
    },
    [searchId, entry.staged.query, setStagedQuery],
  );

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(tag);
  }, [tag]);

  // Check if the tag or its negation already exist in the root-level rules
  const isIncluded = searchId
    ? entry.staged.query.rules.some(
        (r) => "field" in r && r.field === "tag" && r.value === tag,
      )
    : false;
  const isExcluded = searchId
    ? entry.staged.query.rules.some(
        (r) => "field" in r && r.field === "tag" && r.value === `-${tag}`,
      )
    : false;

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
      if (isIncluded) {
        actions.push({
          id: "remove-include",
          label: "Remove from search",
          icon: IconTrash,
          onClick: () => handleRemove(tag),
        });
      } else {
        actions.push({
          id: "include",
          label: "Include in search",
          icon: IconPlus,
          onClick: handleInclude,
        });
      }
      if (isExcluded) {
        actions.push({
          id: "remove-exclude",
          label: "Remove exclusion",
          icon: IconTrash,
          onClick: () => handleRemove(`-${tag}`),
        });
      } else {
        actions.push({
          id: "exclude",
          label: "Exclude from search",
          icon: IconMinus,
          onClick: handleExclude,
        });
      }
    }
    return actions;
  }, [
    searchId,
    isIncluded,
    isExcluded,
    tag,
    handleCopy,
    handleSearch,
    handleInclude,
    handleExclude,
    handleRemove,
  ]);
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

/** Renders tag action items for a ContextMenu. */
function TagActionContextItems({
  tag,
  actions,
  favouriteAction,
}: {
  tag: string;
  actions: Array<TagAction>;
  favouriteAction?: TagAction | null;
}) {
  return (
    <>
      <ContextMenuGroup>
        <ContextMenuLabel className="p-1">
          <TagBadgeFromString
            displayTag={tag}
            className="h-auto w-full justify-center px-2 py-1.5 break-normal wrap-anywhere whitespace-normal"
          />
        </ContextMenuLabel>
      </ContextMenuGroup>
      <ContextMenuSeparator />
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

/**
 * Wraps a list of tag elements in a single shared context menu.
 *
 * Tag elements must have a `data-tag` attribute with the full tag string.
 * Right-clicking (or long-pressing) any `[data-tag]` element opens the
 * context menu with actions for that tag.
 *
 * When `clickOpens` is true, left-clicking a `[data-tag]` element also
 * opens the context menu by dispatching a synthetic `contextmenu` event.
 */
export const TagListContextMenu = memo(function TagListContextMenu({
  searchId,
  children,
  className,
  render,
  side,
  clickOpens,
}: {
  searchId?: string;
  children: ReactNode;
  className?: string;
  render?: React.JSX.Element;
  side?: "top" | "right" | "bottom" | "left";
  clickOpens?: boolean;
}) {
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const actions = useTagActions(activeTag ?? "", searchId);
  const favouriteAction = useFavouriteTagAction(activeTag ?? "");

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    const row = (e.target as HTMLElement).closest<HTMLElement>("[data-tag]");
    if (row) setActiveTag(row.dataset.tag!);
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!clickOpens) return;
      const row = (e.target as HTMLElement).closest<HTMLElement>("[data-tag]");
      if (!row) return;
      e.preventDefault();
      row.dispatchEvent(
        new MouseEvent("contextmenu", {
          bubbles: true,
          clientX: e.clientX,
          clientY: e.clientY,
        }),
      );
    },
    [clickOpens],
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger
        className={cn(
          "min-w-0 **:select-none",
          clickOpens && "cursor-context-menu",
          className,
        )}
        onContextMenu={handleContextMenu}
        onClick={handleClick}
        render={render}
      >
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent side={side}>
        {activeTag && (
          <TagActionContextItems
            tag={activeTag}
            actions={actions}
            favouriteAction={favouriteAction}
          />
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
});
