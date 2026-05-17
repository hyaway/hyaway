// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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
import type {
  CSSProperties,
  ComponentType,
  FocusEventHandler,
  KeyboardEventHandler,
  ReactNode,
  Ref,
  SVGProps,
} from "react";
import type { DropdownMenuHandle } from "@/components/ui-primitives/dropdown-menu";
import {
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShared,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui-primitives/dropdown-menu";
import {
  useOtherSearchKeys,
  usePinnedSearchKeys,
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
import {
  INTERACTIVE_TAG_BADGE_TRIGGER_CLASSNAME,
  useSelectedTagBadgeStyle,
} from "@/components/tag/tag-badge-selection";

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
  const { createSearchFromTag } = useSearchQueriesActions();
  const { setDesktopOpen, setMobileOpen } = useSidebarStoreActions();

  const handleSearch = useCallback(() => {
    const id = createSearchFromTag(tag);
    setDesktopOpen("right", false);
    setMobileOpen("right", false);
    navigate({ to: "/search/$searchId", params: { searchId: id } });
  }, [tag, navigate, createSearchFromTag, setDesktopOpen, setMobileOpen]);

  return useMemo(
    () => ({
      id: "search",
      label: "Open as new search",
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
  const { setSearchStagedQuery } = useSearchQueriesActions();
  const entry = useSearchQueryEntry(searchId ?? "");

  const handleInclude = useCallback(() => {
    if (!searchId) return;
    const currentQuery = entry.staged.query;
    const excludedTag = `-${tag}`;
    const hasExcludedTag = currentQuery.rules.some(
      (r) => "field" in r && r.field === "tag" && r.value === excludedTag,
    );
    setSearchStagedQuery(searchId, {
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
  }, [tag, searchId, entry.staged.query, setSearchStagedQuery]);

  const handleExclude = useCallback(() => {
    if (!searchId) return;
    const currentQuery = entry.staged.query;
    const excludedTag = `-${tag}`;
    const hasIncludedTag = currentQuery.rules.some(
      (r) => "field" in r && r.field === "tag" && r.value === tag,
    );
    setSearchStagedQuery(searchId, {
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
  }, [tag, searchId, entry.staged.query, setSearchStagedQuery]);

  const handleRemove = useCallback(
    (value: string) => {
      if (!searchId) return;
      const currentQuery = entry.staged.query;
      setSearchStagedQuery(searchId, {
        ...currentQuery,
        rules: currentQuery.rules.filter(
          (r) => !("field" in r && r.field === "tag" && r.value === value),
        ),
      });
    },
    [searchId, entry.staged.query, setSearchStagedQuery],
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

export function useTagActionSections(tag: string): Array<TagActionSection> {
  const newSearchAction = useNewSearchTagAction(tag);

  return useMemo(
    () => [{ id: "new-search", actions: [newSearchAction] }],
    [newSearchAction],
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
  menuHandle: DropdownMenuHandle<TagActionMenuPayload>;
}

interface TagActionMenuPayload {
  tag: string;
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
        {namespace ? (
          <>
            <span className="whitespace-nowrap">{namespace}:</span>{" "}
          </>
        ) : null}
        {tagText}
      </span>
      {isFavourite && (
        <IconTagStarred className="size-6 shrink-0 text-(--badge-overlay)" />
      )}
    </DropdownMenuItem>
  );
}

function TagActionMenuActionItem({
  action,
  closeOnClick = action.closeOnClick ?? false,
}: {
  action: TagAction;
  closeOnClick?: boolean;
}) {
  return (
    <DropdownMenuItem
      onClick={action.onClick}
      closeOnClick={closeOnClick}
      className="cursor-pointer"
    >
      <action.icon />
      {action.label}
    </DropdownMenuItem>
  );
}

function SearchTagActionSubmenu({
  tag,
  searchId,
  secondaryLabel,
}: {
  tag: string;
  searchId: string;
  secondaryLabel?: string;
}) {
  const displayName = useSearchDisplayName(searchId);
  const actions = useSearchTagActions(tag, searchId);

  if (actions.length === 0) return null;

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className="min-w-56">
        <span className="flex min-w-0 flex-col items-start gap-0.5">
          <span className="max-w-64 truncate">{displayName}</span>
          {secondaryLabel && (
            <span className="text-muted-foreground max-w-64 truncate text-xs/5">
              {secondaryLabel}
            </span>
          )}
        </span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuGroup>
          <DropdownMenuLabel>{displayName}</DropdownMenuLabel>
          {actions.map((action) => (
            <TagActionMenuActionItem
              key={action.id}
              action={action}
              closeOnClick={false}
            />
          ))}
        </DropdownMenuGroup>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

function CurrentSearchTagActionSubmenu({ tag }: { tag: string }) {
  const params = useParams({ strict: false });
  const searchId =
    "searchId" in params && typeof params.searchId === "string"
      ? params.searchId
      : undefined;

  if (!searchId) return null;

  return (
    <SearchTagActionSubmenu
      tag={tag}
      searchId={searchId}
      secondaryLabel="current search"
    />
  );
}

function SearchTagActionGroupSubmenu({
  label,
  searchIds,
  tag,
}: {
  label: string;
  searchIds: Array<string>;
  tag: string;
}) {
  if (searchIds.length === 0) return null;

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>{label}</DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="max-h-[60dvh] min-w-56">
        {searchIds.map((searchId) => (
          <SearchTagActionSubmenu
            key={searchId}
            tag={tag}
            searchId={searchId}
          />
        ))}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

function SearchTagActionsSubmenu({ tag }: { tag: string }) {
  const params = useParams({ strict: false });
  const currentSearchId =
    "searchId" in params && typeof params.searchId === "string"
      ? params.searchId
      : undefined;
  const pinnedSearchIds = usePinnedSearchKeys();
  const otherSearchIds = useOtherSearchKeys();
  const visiblePinnedSearchIds = useMemo(
    () => pinnedSearchIds.filter((searchId) => searchId !== currentSearchId),
    [currentSearchId, pinnedSearchIds],
  );
  const visibleOtherSearchIds = useMemo(
    () => otherSearchIds.filter((searchId) => searchId !== currentSearchId),
    [currentSearchId, otherSearchIds],
  );

  if (
    !currentSearchId &&
    visiblePinnedSearchIds.length === 0 &&
    visibleOtherSearchIds.length === 0
  ) {
    return null;
  }

  return (
    <>
      <DropdownMenuSeparator />
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <IconSearch />
          Searches
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="min-w-64">
          <CurrentSearchTagActionSubmenu tag={tag} />
          <SearchTagActionGroupSubmenu
            label="Pinned"
            searchIds={visiblePinnedSearchIds}
            tag={tag}
          />
          <SearchTagActionGroupSubmenu
            label="Others"
            searchIds={visibleOtherSearchIds}
            tag={tag}
          />
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    </>
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
            <TagActionMenuActionItem key={action.id} action={action} />
          ))}
        </DropdownMenuGroup>
      ))}
      {favouriteAction && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={favouriteAction.onClick}
            closeOnClick={favouriteAction.closeOnClick ?? false}
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

function TagActionMenuContent({ tag }: { tag: string }) {
  const sections = useTagActionSections(tag);
  const favouriteAction = useFavouriteTagAction(tag);

  return (
    <>
      <TagActionMenuItems
        tag={tag}
        sections={sections}
        favouriteAction={favouriteAction}
      />
      <SearchTagActionsSubmenu tag={tag} />
    </>
  );
}

function TagActionMenuProvider({
  children,
  menuHandle,
}: {
  children: ReactNode;
  menuHandle: DropdownMenuHandle<TagActionMenuPayload>;
}) {
  const ctx = useMemo(() => ({ menuHandle }), [menuHandle]);

  return (
    <TagActionMenuContext.Provider value={ctx}>
      {children}
    </TagActionMenuContext.Provider>
  );
}

/**
 * Provides a single shared dropdown menu for a list of tag triggers.
 * Wrap a group of `TagActionTrigger` elements inside this provider.
 * Only one menu instance is created regardless of how many tags exist.
 */
export const TagActionMenu = memo(function TagActionMenuMemo({
  children,
  side = "bottom",
}: {
  children: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
}) {
  return (
    <DropdownMenuShared<TagActionMenuPayload>
      modal={false}
      content={(payload) => (
        <DropdownMenuContent
          side={side}
          showBackdrop={false}
          className="w-auto"
        >
          {payload?.tag && (
            <TagActionMenuContent key={payload.tag} tag={payload.tag} />
          )}
        </DropdownMenuContent>
      )}
    >
      {(menuHandle) => (
        <TagActionMenuProvider menuHandle={menuHandle}>
          {children}
        </TagActionMenuProvider>
      )}
    </DropdownMenuShared>
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
  onFocus,
  onKeyDown,
  onKeyDownCapture,
  tabIndex,
  triggerRef,
}: {
  tag: string;
  children: ReactNode;
  className?: string;
  onFocus?: FocusEventHandler<HTMLButtonElement>;
  onKeyDown?: KeyboardEventHandler<HTMLButtonElement>;
  onKeyDownCapture?: KeyboardEventHandler<HTMLButtonElement>;
  tabIndex?: number;
  triggerRef?: Ref<HTMLButtonElement>;
}) {
  const ctx = useContext(TagActionMenuContext);
  const selectedTagStyle = useSelectedTagBadgeStyle("--selected-tag-overlay");

  // System namespace tags don't get action menus
  if (tag.startsWith("system:") || tag.startsWith("-system:")) {
    return <span className={className}>{children}</span>;
  }

  if (!ctx) {
    return <span className={className}>{children}</span>;
  }

  return (
    <DropdownMenuTrigger
      type="button"
      handle={ctx.menuHandle}
      payload={{ tag }}
      ref={triggerRef}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
      onKeyDownCapture={onKeyDownCapture}
      style={selectedTagStyle}
      tabIndex={tabIndex}
      className={cn(INTERACTIVE_TAG_BADGE_TRIGGER_CLASSNAME, className)}
    >
      {children}
    </DropdownMenuTrigger>
  );
}
