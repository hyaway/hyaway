// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  IconCheck,
  IconCopy,
  IconFilterMinus,
  IconFilterPlus,
  IconFilterX,
  IconSearch,
  IconTagStarred,
} from "@tabler/icons-react";
import type { CSSProperties, ComponentType, ReactNode, SVGProps } from "react";
import {
  DropdownMenu,
  DropdownMenuAnchoredContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui-primitives/dropdown-menu";
import {
  useSearchDisplayName,
  useSearchQueriesActions,
  useSearchQueryEntry,
} from "@/stores/search-queries-store";
import { createSearchRule } from "@/stores/search-defaults";
import { cn } from "@/lib/utils";
import {
  useIsFavouriteTag,
  useSetFavouriteTagsMutation,
} from "@/integrations/hydrus-api/queries/tags";
import { useHasPermission } from "@/integrations/hydrus-api/queries/access";
import { Permission } from "@/integrations/hydrus-api/models";
import { useSidebarStoreActions } from "@/stores/sidebar-store";
import { CrossedOutIcon } from "@/components/ratings/crossed-out-icon";
import { parseTag } from "@/lib/tag-utils";
import { useNamespaceColor } from "@/integrations/hydrus-api/queries/options";

function IconTagUnstarred(props: SVGProps<SVGSVGElement>) {
  return (
    <CrossedOutIcon
      {...props}
      className={cn("inline-grid size-6 place-items-center", props.className)}
      strokeBackgroundColor="text-popover"
    >
      <IconTagStarred className="size-6" />
    </CrossedOutIcon>
  );
}

/** Returns true if the tag belongs to the system namespace (e.g. system:inbox). */
export function isSystemTag(tag: string): boolean {
  return tag.startsWith("system:") || tag.startsWith("-system:");
}

export interface TagAction {
  id: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  onClick: () => void;
  closeOnClick?: boolean;
}

export interface TagActionSection {
  id: string;
  label?: string;
  actions: Array<TagAction>;
}

function useNewSearchTagAction(tag: string): TagAction {
  const navigate = useNavigate();
  const { createFromTag } = useSearchQueriesActions();
  const { setDesktopOpen, setMobileOpen } = useSidebarStoreActions();

  const handleSearch = useCallback(() => {
    const id = createFromTag(tag);
    setDesktopOpen("right", false);
    setMobileOpen("right", false);
    navigate({ to: "/search/$searchId", params: { searchId: id } });
  }, [tag, navigate, createFromTag, setDesktopOpen, setMobileOpen]);

  return useMemo(
    () => ({
      id: "search",
      label: "New search",
      icon: IconSearch,
      onClick: handleSearch,
      closeOnClick: true,
    }),
    [handleSearch],
  );
}

export function useSearchTagActions(
  tag: string,
  searchId: string | undefined,
): Array<TagAction> {
  const { setStagedQuery } = useSearchQueriesActions();
  const entry = useSearchQueryEntry(searchId ?? "");

  const handleInclude = useCallback(() => {
    if (!searchId) return;
    const currentQuery = entry.staged.query;
    const excludedTag = `-${tag}`;
    const hasExcludedTag = currentQuery.rules.some(
      (r) => "field" in r && r.field === "tag" && r.value === excludedTag,
    );
    setStagedQuery(searchId, {
      ...currentQuery,
      rules: hasExcludedTag
        ? currentQuery.rules.map((r) =>
            "field" in r && r.field === "tag" && r.value === excludedTag
              ? { ...r, value: tag }
              : r,
          )
        : [
            ...currentQuery.rules,
            createSearchRule({ field: "tag", operator: "=", value: tag }),
          ],
    });
  }, [tag, searchId, entry.staged.query, setStagedQuery]);

  const handleExclude = useCallback(() => {
    if (!searchId) return;
    const currentQuery = entry.staged.query;
    const excludedTag = `-${tag}`;
    const hasIncludedTag = currentQuery.rules.some(
      (r) => "field" in r && r.field === "tag" && r.value === tag,
    );
    setStagedQuery(searchId, {
      ...currentQuery,
      rules: hasIncludedTag
        ? currentQuery.rules.map((r) =>
            "field" in r && r.field === "tag" && r.value === tag
              ? { ...r, value: excludedTag }
              : r,
          )
        : [
            ...currentQuery.rules,
            createSearchRule({
              field: "tag",
              operator: "=",
              value: excludedTag,
            }),
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
    const actions: Array<TagAction> = [];
    if (!searchId) return actions;

    if (isIncluded) {
      actions.push({
        id: "remove-include",
        label: `Remove ${tag}`,
        icon: IconFilterX,
        onClick: () => handleRemove(tag),
      });
    } else {
      actions.push({
        id: "include",
        label: `+${tag}`,
        icon: IconFilterPlus,
        onClick: handleInclude,
      });
    }
    if (isExcluded) {
      actions.push({
        id: "remove-exclude",
        label: `Remove -${tag}`,
        icon: IconFilterX,
        onClick: () => handleRemove(`-${tag}`),
      });
    } else {
      actions.push({
        id: "exclude",
        label: `-${tag}`,
        icon: IconFilterMinus,
        onClick: handleExclude,
      });
    }
    return actions;
  }, [
    searchId,
    isIncluded,
    isExcluded,
    tag,
    handleInclude,
    handleExclude,
    handleRemove,
  ]);
}

export function useCurrentSearchTagActions(
  tag: string,
): TagActionSection | null {
  const params = useParams({ strict: false });
  const searchId =
    "searchId" in params && typeof params.searchId === "string"
      ? params.searchId
      : undefined;
  const displayName = useSearchDisplayName(searchId ?? "");
  const actions = useSearchTagActions(tag, searchId);

  return useMemo(() => {
    if (!searchId || actions.length === 0) return null;
    return {
      id: "current-search",
      label: `${displayName} (current search)`,
      actions,
    };
  }, [searchId, displayName, actions]);
}

export function useTagActionSections(tag: string): Array<TagActionSection> {
  const newSearchAction = useNewSearchTagAction(tag);
  const currentSearchSection = useCurrentSearchTagActions(tag);

  return useMemo(
    () => [
      { id: "new-search", actions: [newSearchAction] },
      ...(currentSearchSection ? [currentSearchSection] : []),
    ],
    [newSearchAction, currentSearchSection],
  );
}

/**
 * Returns a favourite toggle action for a tag, or `null` if the user
 * doesn't have Add Tags permission.
 */
export function useFavouriteTagAction(tag: string): TagAction | null {
  const canTags = useHasPermission(Permission.EDIT_FILE_TAGS);
  const { mutate } = useSetFavouriteTagsMutation();
  const bareTag = tag.startsWith("-") ? tag.slice(1) : tag;
  const isFavourite = useIsFavouriteTag(bareTag);

  const handleToggle = useCallback(() => {
    if (isFavourite) {
      mutate({ remove: [bareTag] });
    } else {
      mutate({ add: [bareTag] });
    }
  }, [bareTag, isFavourite, mutate]);

  if (!canTags) return null;

  return {
    id: "favourite",
    label: isFavourite ? "Remove from favourites" : "Add to favourites",
    icon: isFavourite ? IconTagUnstarred : IconTagStarred,
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

function CopyTagMenuItem({ tag }: { tag: string }) {
  const [copied, setCopied] = useState(false);
  const { namespace, tag: tagText, negated } = parseTag(tag);
  const color = useNamespaceColor(namespace);
  const favouriteTag = namespace ? `${namespace}:${tagText}` : tagText;
  const isFavourite = useIsFavouriteTag(favouriteTag);
  const tagStyle = { "--badge-overlay": color } as CSSProperties;

  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(tag);
    setCopied(true);
  }, [tag]);

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 1200);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  return (
    <DropdownMenuItem
      onClick={handleCopy}
      closeOnClick={false}
      style={tagStyle}
      className="cursor-pointer focus:bg-[color-mix(in_srgb,var(--badge-overlay)_12%,transparent)]"
    >
      <span className="relative flex items-center justify-center">
        <IconCopy
          className={cn("transition-all", copied ? "scale-0" : "scale-100")}
        />
        <IconCheck
          className={cn(
            "absolute transition-all",
            copied ? "scale-100" : "scale-0",
          )}
        />
      </span>
      <span className="min-w-0 flex-1 wrap-anywhere text-(--badge-overlay)">
        {negated ? "-" : ""}
        {namespace ? `${namespace}: ` : ""}
        {tagText}
      </span>
      {isFavourite && (
        <IconTagStarred className="size-6 shrink-0 text-(--badge-overlay)" />
      )}
    </DropdownMenuItem>
  );
}

/** Menu item content rendered inside the shared popup. */
function TagActionMenuItems({
  tag,
  sections,
  favouriteAction,
}: {
  tag: string;
  sections: Array<TagActionSection>;
  favouriteAction?: TagAction | null;
}) {
  return (
    <>
      <DropdownMenuGroup>
        <CopyTagMenuItem tag={tag} />
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      {sections.map((section, sectionIndex) => (
        <DropdownMenuGroup key={section.id}>
          {sectionIndex > 0 && <DropdownMenuSeparator />}
          {section.label && (
            <DropdownMenuLabel>{section.label}</DropdownMenuLabel>
          )}
          {section.actions.map((action) => (
            <DropdownMenuItem
              key={action.id}
              onClick={action.onClick}
              closeOnClick={action.closeOnClick ?? false}
              className={"cursor-pointer"}
            >
              <action.icon />
              {action.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      ))}
      {favouriteAction && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={favouriteAction.onClick}
            closeOnClick={favouriteAction.closeOnClick ?? false}
            className={"cursor-pointer"}
          >
            <favouriteAction.icon />
            {favouriteAction.label}
          </DropdownMenuItem>
        </>
      )}
    </>
  );
}

interface TagActionMenuPopupHandle {
  open: (tag: string, anchor: HTMLElement) => void;
}

/** Inner component that holds menu state — re-renders here don't affect children. */
const TagActionMenuPopup = memo(function TagActionMenuPopup({
  side,
  handleRef,
}: {
  side: "top" | "right" | "bottom" | "left";
  handleRef: React.RefObject<TagActionMenuPopupHandle | null>;
}) {
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLElement | null>(null);
  const lastCloseRef = useRef<{ anchor: HTMLElement; time: number } | null>(
    null,
  );

  const sections = useTagActionSections(activeTag ?? "");
  const favouriteAction = useFavouriteTagAction(activeTag ?? "");

  useImperativeHandle(handleRef, () => ({
    open(tag: string, anchor: HTMLElement) {
      const last = lastCloseRef.current;
      if (last && last.anchor === anchor && Date.now() - last.time < 300) {
        lastCloseRef.current = null;
        return;
      }
      anchorRef.current = anchor;
      setActiveTag(tag);
      setOpen(true);
    },
  }));

  const handleOpenChange = useCallback(
    (nextOpen: boolean, details: { reason: string }) => {
      if (!nextOpen) {
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
      }
    },
    [],
  );

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange} modal={false}>
      <DropdownMenuAnchoredContent anchor={anchorRef.current} side={side}>
        {activeTag && (
          <TagActionMenuItems
            tag={activeTag}
            sections={sections}
            favouriteAction={favouriteAction}
          />
        )}
      </DropdownMenuAnchoredContent>
    </DropdownMenu>
  );
});

/**
 * Provides a single shared dropdown menu for a list of tag triggers.
 * Wrap a group of `TagActionTrigger` elements inside this provider.
 * Only one menu instance is created regardless of how many tags exist.
 */
export const TagActionMenu = memo(function TagActionMenu({
  children,
  side = "bottom",
}: {
  children: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
}) {
  const popupRef = useRef<TagActionMenuPopupHandle>(null);

  const openMenu = useCallback((tag: string, anchor: HTMLElement) => {
    popupRef.current?.open(tag, anchor);
  }, []);

  const ctx = useMemo(() => ({ openMenu }), [openMenu]);

  return (
    <TagActionMenuContext.Provider value={ctx}>
      {children}
      <TagActionMenuPopup handleRef={popupRef} side={side} />
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
