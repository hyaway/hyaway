// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import {
  createContext,
  memo,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "@tanstack/react-router";
import {
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
  DropdownMenu,
  DropdownMenuAnchoredContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui-primitives/dropdown-menu";
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
import { useSidebarStoreActions } from "@/stores/sidebar-store";

/** Returns true if the tag belongs to the system namespace (e.g. system:inbox). */
export function isSystemTag(tag: string): boolean {
  return tag.startsWith("system:") || tag.startsWith("-system:");
}

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
  const { setDesktopOpen, setMobileOpen } = useSidebarStoreActions();
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
    setDesktopOpen("right", false);
    setMobileOpen("right", false);
    navigate({ to: "/search/$searchId", params: { searchId: id } });
  }, [tag, navigate, setStagedQuery, setDesktopOpen, setMobileOpen]);

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
        id: "search",
        label: "New search",
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

// --- Tag Action Menu (shared single-instance dropdown) ---

interface TagActionMenuContextValue {
  openMenu: (tag: string, anchor: HTMLElement) => void;
}

const TagActionMenuContext = createContext<TagActionMenuContextValue | null>(
  null,
);

export function useTagActionMenu() {
  return useContext(TagActionMenuContext);
}

/** Menu item content rendered inside the shared popup. */
function TagActionMenuItems({
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
      <DropdownMenuGroup>
        <DropdownMenuLabel>
          <TagBadgeFromString
            displayTag={tag}
            className="h-auto w-full justify-center px-2 py-1.5 break-normal wrap-anywhere whitespace-normal"
          />
        </DropdownMenuLabel>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
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

/**
 * Provides a single shared dropdown menu for a list of tag triggers.
 * Wrap a group of `TagActionTrigger` elements inside this provider.
 * Only one menu instance is created regardless of how many tags exist.
 */
export const TagActionMenu = memo(function TagActionMenu({
  searchId,
  children,
  side = "bottom",
}: {
  searchId?: string;
  children: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
}) {
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLElement | null>(null);

  const actions = useTagActions(activeTag ?? "", searchId);
  const favouriteAction = useFavouriteTagAction(activeTag ?? "");

  const openMenu = useCallback((tag: string, anchor: HTMLElement) => {
    anchorRef.current = anchor;
    setActiveTag(tag);
    setOpen(true);
  }, []);

  const handleOpenChange = useCallback(
    (nextOpen: boolean, details: { reason: string }) => {
      if (!nextOpen) {
        // Only close on intentional dismissal, not focus-out from pointer leaving
        if (details.reason !== "focus-out") {
          setOpen(false);
        }
      }
    },
    [],
  );

  const ctx = useMemo(() => ({ openMenu }), [openMenu]);

  return (
    <TagActionMenuContext.Provider value={ctx}>
      {children}
      <DropdownMenu open={open} onOpenChange={handleOpenChange}>
        <DropdownMenuAnchoredContent
          anchor={anchorRef.current}
          side={side}
        >
          {activeTag && (
            <TagActionMenuItems
              tag={activeTag}
              actions={actions}
              favouriteAction={favouriteAction}
            />
          )}
        </DropdownMenuAnchoredContent>
      </DropdownMenu>
    </TagActionMenuContext.Provider>
  );
});

/**
 * A button that opens the shared TagActionMenu for a specific tag.
 * Must be rendered inside a `TagActionMenu` provider.
 * System namespace tags are rendered as plain spans (no menu).
 */
export function TagActionTrigger({
  tag,
  children,
  className,
}: {
  tag: string;
  children: ReactNode;
  className?: string;
}) {
  const ctx = useContext(TagActionMenuContext);
  const ref = useRef<HTMLButtonElement>(null);

  const handleClick = useCallback(() => {
    if (ctx && ref.current) {
      ctx.openMenu(tag, ref.current);
    }
  }, [ctx, tag]);

  // System namespace tags don't get action menus
  if (tag.startsWith("system:") || tag.startsWith("-system:")) {
    return <span className={className}>{children}</span>;
  }

  return (
    <button
      ref={ref}
      type="button"
      onClick={handleClick}
      className={cn("cursor-pointer select-none **:select-none", className)}
    >
      {children}
    </button>
  );
}
