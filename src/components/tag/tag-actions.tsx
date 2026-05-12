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
import { Menu as MenuPrimitive } from "@base-ui/react/menu";
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
      <MenuPrimitive.Group>
        <MenuPrimitive.GroupLabel className="text-muted-foreground p-1">
          <TagBadgeFromString
            displayTag={tag}
            className="h-auto w-full justify-center px-2 py-1.5 break-normal wrap-anywhere whitespace-normal"
          />
        </MenuPrimitive.GroupLabel>
      </MenuPrimitive.Group>
      <MenuPrimitive.Separator className="bg-border/50 -mx-1 my-1 h-px" />
      {actions.map((action) => (
        <MenuPrimitive.Item
          key={action.id}
          className="focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground group/dropdown-menu-item relative flex cursor-default items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-6"
          onClick={action.onClick}
        >
          <action.icon />
          {action.label}
        </MenuPrimitive.Item>
      ))}
      {favouriteAction && (
        <>
          <MenuPrimitive.Separator className="bg-border/50 -mx-1 my-1 h-px" />
          <MenuPrimitive.Item
            className="focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground group/dropdown-menu-item relative flex cursor-default items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-6"
            onClick={favouriteAction.onClick}
          >
            <favouriteAction.icon />
            {favouriteAction.label}
          </MenuPrimitive.Item>
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

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    if (!nextOpen) {
      setOpen(false);
    }
  }, []);

  const ctx = useMemo(() => ({ openMenu }), [openMenu]);

  return (
    <TagActionMenuContext.Provider value={ctx}>
      {children}
      <MenuPrimitive.Root open={open} onOpenChange={handleOpenChange}>
        <MenuPrimitive.Portal>
          <MenuPrimitive.Backdrop className="fixed inset-0 z-50" />
          <MenuPrimitive.Positioner
            className="isolate z-50 outline-none"
            side={side}
            sideOffset={4}
            align="start"
            anchor={anchorRef.current}
            collisionAvoidance={{ side: "flip", align: "shift" }}
            collisionPadding={8}
          >
            <MenuPrimitive.Popup
              className="data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 ring-foreground/5 bg-popover text-popover-foreground z-50 max-h-(--available-height) max-w-(--available-width) min-w-48 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-2xl p-1 shadow-2xl ring-1 duration-100 outline-none data-closed:overflow-hidden"
            >
              {activeTag && (
                <TagActionMenuItems
                  tag={activeTag}
                  actions={actions}
                  favouriteAction={favouriteAction}
                />
              )}
            </MenuPrimitive.Popup>
          </MenuPrimitive.Positioner>
        </MenuPrimitive.Portal>
      </MenuPrimitive.Root>
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
