import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Link, linkOptions } from "@tanstack/react-router";

import { ThumbnailGalleryItemContent } from "./thumbnail-gallery-item-content";
import { ThumbnailGalleryItemContextMenu } from "./thumbnail-gallery-item-context-menu";
import type { LinkOptions } from "@tanstack/react-router";
import type { FileMetadata } from "@/integrations/hydrus-api/models";
import {
  ContextMenu,
  ContextMenuTrigger,
} from "@/components/ui-primitives/context-menu";
import { cn } from "@/lib/utils";
import {
  useGalleryEnableContextMenu,
  useGalleryEnableHoverZoom,
} from "@/stores/gallery-settings-store";

export {
  ThumbnailImage,
  type ThumbnailImageProps,
} from "./thumbnail-gallery-item-image";

/** Height of the polaroid-style footer strip in pixels (h-6 = 24px) */
export const ITEM_FOOTER_HEIGHT = 24;

/**
 * Function to build a link for a file in the current context.
 * Returns type-safe link options for TanStack Router Link.
 */
export type FileLinkBuilder = (fileId: number) => LinkOptions;

/** Default link builder - goes to /file/$fileId */
export const defaultFileLinkBuilder: FileLinkBuilder = (fileId) =>
  linkOptions({
    to: "/file/$fileId",
    params: { fileId: String(fileId) },
  });

// --- Main Item Component ---

export interface ThumbnailGalleryItemProps extends React.HTMLAttributes<HTMLLIElement> {
  virtualRow: { lane: number; index: number; start: number };
  lanes: number;
  totalItemsCount: number;
  item: FileMetadata;
  width: number;
  height: number;
  scrollMargin: number;
  tabIndex?: number;
  /** Stable callback to register link refs - receives (element, index) */
  setLinkRef?: (el: HTMLAnchorElement | null, index: number) => void;
  /** Stable callback for focus events - receives index */
  onItemFocus?: (index: number) => void;
  /** Custom link builder for contextual navigation */
  getFileLink?: FileLinkBuilder;
  /** Accessible label for the item link */
  "aria-label"?: string;
}

export const ThumbnailGalleryItem = memo(function ThumbnailGalleryItem({
  virtualRow,
  lanes,
  totalItemsCount,
  className,
  item,
  width,
  height,
  scrollMargin,
  tabIndex = 0,
  setLinkRef,
  onItemFocus,
  getFileLink = defaultFileLinkBuilder,
  ...props
}: ThumbnailGalleryItemProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const enableContextMenu = useGalleryEnableContextMenu();
  const enableHoverZoom = useGalleryEnableHoverZoom();
  const fileLink = getFileLink(item.file_id);

  // Track lane changes to scale animation duration by distance
  const prevLaneRef = useRef(virtualRow.lane);
  const [laneDistance, setLaneDistance] = useState(0);

  useEffect(() => {
    if (prevLaneRef.current !== virtualRow.lane) {
      setLaneDistance(Math.abs(virtualRow.lane - prevLaneRef.current));
      prevLaneRef.current = virtualRow.lane;
    } else {
      prevLaneRef.current = virtualRow.lane;
    }
  }, [virtualRow.lane]);

  // Scale multiplier: sqrt for diminishing returns - 4 lanes = 2x duration, not 4x
  const durationMultiplier = laneDistance > 0 ? Math.sqrt(laneDistance) : 1;

  const isTopRow = virtualRow.index < lanes;
  const lastRowStart = totalItemsCount - 2 * lanes;
  const isBottomRow = virtualRow.index >= lastRowStart;

  const { scale, horizontalOrigin } = useMemo(() => {
    // Base scale from thumbnail size (clamped between 1.05 and 3)
    const baseScale = Math.min(
      Math.max(
        Math.min(lanes * width, (item.thumbnail_width ?? width) * 1.1) / width,
        1.05,
      ),
      2.5,
    );

    // Calculate max scale for each horizontal origin type
    const spaceLeft = virtualRow.lane;
    const spaceRight = lanes - 1 - virtualRow.lane;

    const maxScaleLeft = spaceRight + 1; // origin-left: expands right
    const maxScaleRight = spaceLeft + 1; // origin-right: expands left
    const maxScaleCenter = 1 + 2 * Math.min(spaceLeft, spaceRight); // origin-center: both ways

    // Pick the origin that allows the largest scale (up to baseScale)
    const options = [
      { origin: "left" as const, maxScale: maxScaleLeft },
      { origin: "right" as const, maxScale: maxScaleRight },
      { origin: "center" as const, maxScale: maxScaleCenter },
    ];

    // Sort by maxScale descending, prefer center if tied
    options.sort((a, b) => {
      if (b.maxScale !== a.maxScale) return b.maxScale - a.maxScale;
      if (a.origin === "center") return -1;
      if (b.origin === "center") return 1;
      return 0;
    });

    const best = options[0];
    return {
      scale: Math.min(baseScale, best.maxScale),
      horizontalOrigin: best.origin,
    };
  }, [lanes, width, item.thumbnail_width, virtualRow.lane]);

  const originClass = useMemo(() => {
    if (isTopRow) {
      if (horizontalOrigin === "left") return "origin-top-left";
      if (horizontalOrigin === "right") return "origin-top-right";
      return "origin-top";
    }
    if (isBottomRow) {
      if (horizontalOrigin === "left") return "origin-bottom-left";
      if (horizontalOrigin === "right") return "origin-bottom-right";
      return "origin-bottom";
    }
    if (horizontalOrigin === "left") return "origin-left";
    if (horizontalOrigin === "right") return "origin-right";
    return "origin-center";
  }, [isTopRow, isBottomRow, horizontalOrigin]);

  return (
    <li
      style={{
        width: `${width}px`,
        height: `${height}px`,
        transform: `translate(${(virtualRow.lane * 100) / lanes}cqw, ${virtualRow.start - scrollMargin}px)`,
        containIntrinsicSize: `${width}px ${height}px`,
        [`--thumbnail-hover-scale`]: `${scale}`,
        [`--thumbnail-hover-reverse-scale`]: `${1 / scale}`,
        [`--badge-offset-scaled`]: `calc(0.25rem / ${scale})`,
        [`--reflow-duration-multiplier`]: durationMultiplier,
      }}
      className={cn(
        "group absolute top-0 left-0 z-0 flex h-full w-full justify-center overflow-visible [content-visibility:auto]",
        "hover:z-30 hover:[content-visibility:visible]",
        "active:z-30 active:[content-visibility:visible]",
        "has-focus-visible:z-20 has-focus-visible:[content-visibility:visible]",
        width < height ? "flex-col" : "flex-row",
        "transition-transform duration-[calc(var(--gallery-reflow-duration)*var(--reflow-duration-multiplier))] ease-[cubic-bezier(0.5,0,0.265,1.2)] in-data-[scrolling=true]:transition-none",
        enableContextMenu && menuOpen && "z-30 [content-visibility:visible]",
        className,
      )}
      {...props}
    >
      <ItemLink
        fileLink={fileLink}
        item={item}
        virtualRowIndex={virtualRow.index}
        tabIndex={tabIndex}
        setLinkRef={setLinkRef}
        onItemFocus={onItemFocus}
        enableContextMenu={enableContextMenu}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
      />
      <div
        className={cn(
          "pointer-events-none h-full w-full origin-center",
          "transition-[scale] duration-(--gallery-hover-zoom-duration) ease-in-out",
          enableHoverZoom &&
            "group-hover:scale-(--thumbnail-hover-scale) group-hover:shadow",
          enableHoverZoom &&
            "group-active:scale-(--thumbnail-hover-scale) group-active:shadow",
          "group-has-focus-visible:ring-3 group-has-focus-visible:ring-black group-has-focus-visible:ring-offset-3 group-has-focus-visible:ring-offset-white dark:group-has-focus-visible:ring-white dark:group-has-focus-visible:ring-offset-black",
          enableContextMenu &&
            menuOpen &&
            enableHoverZoom &&
            "scale-(--thumbnail-hover-scale)",
          enableContextMenu &&
            menuOpen &&
            "ring-primary-foreground ring-offset-primary ring-0 ring-offset-3",
          enableHoverZoom && originClass,
        )}
      >
        <ThumbnailGalleryItemContent item={item} />
      </div>
    </li>
  );
});

// --- Item Link (with optional context menu) ---

interface ItemLinkProps {
  fileLink: LinkOptions;
  item: FileMetadata;
  virtualRowIndex: number;
  tabIndex: number;
  setLinkRef?: (el: HTMLAnchorElement | null, index: number) => void;
  onItemFocus?: (index: number) => void;
  enableContextMenu: boolean;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
}

function ItemLink({
  fileLink,
  item,
  virtualRowIndex,
  tabIndex,
  setLinkRef,
  onItemFocus,
  enableContextMenu,
  menuOpen,
  setMenuOpen,
}: ItemLinkProps) {
  const linkElement = (
    <Link
      ref={(el) => setLinkRef?.(el, virtualRowIndex)}
      to={fileLink.to}
      params={fileLink.params}
      className="absolute inset-0 z-10 outline-hidden"
      tabIndex={tabIndex}
      aria-label={`File ${item.file_id}, ${item.mime.split("/")[0]}`}
      onFocus={() => onItemFocus?.(virtualRowIndex)}
    />
  );

  if (!enableContextMenu) {
    return linkElement;
  }

  return (
    <ContextMenu open={menuOpen} onOpenChange={setMenuOpen}>
      <ContextMenuTrigger>{linkElement}</ContextMenuTrigger>
      <ThumbnailGalleryItemContextMenu item={item} />
    </ContextMenu>
  );
}
