import { memo, useMemo, useState } from "react";
import {
  IconBan,
  IconExternalLink,
  IconMailFilled,
  IconMovie,
  IconTrashFilled,
  IconVolume,
} from "@tabler/icons-react";
import { Link, linkOptions } from "@tanstack/react-router";
import type { LinkOptions } from "@tanstack/react-router";

import type { FileMetadata } from "@/integrations/hydrus-api/models";

import { BlurhashCanvas } from "@/components/blurhash-canvas";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui-primitives/context-menu";
import { useFileActions } from "@/hooks/use-file-actions";
import { useThumbnailUrl } from "@/hooks/use-url-with-api-key";
import { formatBytes } from "@/lib/format-utils";
import { cn } from "@/lib/utils";
import { checkerboardBg } from "@/lib/style-constants";
import { DEFAULT_GALLERY_REFLOW_DURATION } from "@/stores/gallery-settings-store";
import { useImageBackground } from "@/stores/file-viewer-settings-store";

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
  /** Duration of the reflow animation in milliseconds (0 = disabled) */
  reflowDuration?: number;
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
  reflowDuration = DEFAULT_GALLERY_REFLOW_DURATION,
  ...props
}: ThumbnailGalleryItemProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const fileLink = getFileLink(item.file_id);

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
        transitionDuration:
          reflowDuration > 0 ? `${reflowDuration}ms` : undefined,
      }}
      className={cn(
        "group absolute top-0 left-0 z-0 flex h-full w-full justify-center overflow-visible [content-visibility:auto]",
        "hover:z-30 hover:[content-visibility:visible]",
        "active:z-30 active:[content-visibility:visible]",
        "has-focus-visible:z-20 has-focus-visible:[content-visibility:visible]",
        width < height ? "flex-col" : "flex-row",
        reflowDuration > 0
          ? "transition-transform ease-out in-data-[scrolling=true]:transition-none"
          : "transition-none",
        menuOpen && "z-30 [content-visibility:visible]",
        className,
      )}
      {...props}
    >
      <ContextMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <ContextMenuTrigger>
          <Link
            ref={(el) => setLinkRef?.(el, virtualRow.index)}
            to={fileLink.to}
            params={fileLink.params}
            className="absolute inset-0 z-10 outline-hidden"
            tabIndex={tabIndex}
            aria-label={`File ${item.file_id}, ${item.mime.split("/")[0]}`}
            onFocus={() => onItemFocus?.(virtualRow.index)}
          />
        </ContextMenuTrigger>
        <ThumbnailGalleryItemContextMenu item={item} />
      </ContextMenu>
      <div
        className={cn(
          "pointer-events-none h-full w-full transition-[scale] duration-100 ease-in-out",
          "group-hover:scale-(--thumbnail-hover-scale) group-hover:shadow",
          "group-active:scale-(--thumbnail-hover-scale) group-active:shadow",
          "group-has-focus-visible:ring-3 group-has-focus-visible:ring-black group-has-focus-visible:ring-offset-3 group-has-focus-visible:ring-offset-white dark:group-has-focus-visible:ring-white dark:group-has-focus-visible:ring-offset-black",
          menuOpen &&
            "ring-primary-foreground ring-offset-primary scale-(--thumbnail-hover-scale) ring-0 ring-offset-3",
          originClass,
        )}
      >
        <ThumbnailGalleryItemContent item={item} />
      </div>
    </li>
  );
});

// --- Item Content (badges + thumbnail) ---

interface ThumbnailGalleryItemContentProps {
  item: FileMetadata;
}

function ThumbnailGalleryItemContent({
  item,
}: ThumbnailGalleryItemContentProps) {
  const fileSize = formatBytes(item.size);
  const isPermanentlyDeleted = item.is_deleted && !item.is_trashed;

  return (
    <div
      className={cn(
        "bg-muted text-muted-foreground @container relative flex h-full w-full flex-col overflow-hidden rounded-sm shadow-sm",
        "pointer-events-none",
      )}
    >
      <div className="relative min-h-0 flex-1 overflow-hidden">
        {isPermanentlyDeleted && item.blurhash ? (
          <BlurhashCanvas
            blurhash={item.blurhash}
            width={32}
            height={32}
            className="h-full w-full"
            aria-label={`Blurhash for file ${item.file_id}`}
          />
        ) : (
          <ThumbnailImage
            fileId={item.file_id}
            width={item.thumbnail_width}
            height={item.thumbnail_height}
          />
        )}
      </div>
      <div className="bg-muted text-muted-foreground flex h-6 shrink-0 items-center gap-0.5 px-0.5 text-[8px] @[150px]:gap-1 @[150px]:px-1 @[150px]:text-xs">
        {item.mime.startsWith("video/") && (
          <IconMovie
            className="size-2 @[60px]:size-3 @[150px]:size-4"
            aria-label="Video"
          />
        )}
        {item.has_audio && (
          <IconVolume
            className="size-2 @[60px]:size-3 @[150px]:size-4"
            aria-label="Has audio"
          />
        )}
        {fileSize && (
          <span
            className="hidden @[100px]:inline"
            aria-label={`File size: ${fileSize}`}
          >
            {fileSize}
          </span>
        )}
        <span className="flex-1" />
        {item.is_inbox && (
          <IconMailFilled
            className="text-foreground size-2 @[60px]:size-3 @[150px]:size-4"
            aria-label="In inbox"
          />
        )}
        {item.is_trashed && (
          <IconTrashFilled
            className="text-destructive size-2 @[60px]:size-3 @[150px]:size-4"
            aria-label="Trashed"
          />
        )}
        {item.is_deleted && !item.is_trashed && (
          <IconBan
            className="text-destructive size-3 @[150px]:size-4"
            aria-label="Permanently deleted"
          />
        )}
      </div>
    </div>
  );
}

// --- Context Menu Actions ---

interface ThumbnailGalleryItemContextMenuProps {
  item: Pick<
    FileMetadata,
    | "file_id"
    | "is_inbox"
    | "is_trashed"
    | "is_deleted"
    | "ext"
    | "filetype_human"
    | "mime"
  >;
}

function ThumbnailGalleryItemContextMenu({
  item,
}: ThumbnailGalleryItemContextMenuProps) {
  const actionGroups = useFileActions(item, {
    includeOpen: true,
    includeExternal: true,
  });

  return (
    <ContextMenuContent
      className={
        "bg-popover/95 supports-backdrop-filter:bg-popover/75 backdrop-blur-sm"
      }
    >
      {actionGroups.map((group, groupIndex) => (
        <div key={group.id}>
          {groupIndex > 0 && <ContextMenuSeparator />}
          {group.actions.map((action) => (
            <ContextMenuItem
              key={action.id}
              onClick={action.onClick}
              variant={action.variant}
            >
              <action.icon />
              {action.label}
              {action.external && (
                <IconExternalLink className="ml-auto opacity-50" />
              )}
            </ContextMenuItem>
          ))}
        </div>
      ))}
    </ContextMenuContent>
  );
}

// --- Thumbnail Image ---

export interface ThumbnailProps extends React.HTMLAttributes<HTMLDivElement> {
  fileId: number;
  innerClassName?: string;
  width?: number;
  height?: number;
}

export function ThumbnailImage({
  fileId,
  className,
  width,
  height,
}: ThumbnailProps) {
  const [loaded, setLoaded] = useState(false);
  const { url, onLoad, onError } = useThumbnailUrl(fileId);
  const imageBackground = useImageBackground();

  const handleLoad = (_e: React.SyntheticEvent<HTMLImageElement>) => {
    setLoaded(true);
    onLoad();
  };

  return (
    <img
      src={url}
      alt={`Thumbnail for file ID ${fileId}`}
      className={cn(
        "h-full w-full object-cover",
        loaded && imageBackground === "checkerboard"
          ? checkerboardBg
          : "bg-muted",
        className,
      )}
      loading="lazy"
      onLoad={handleLoad}
      onError={onError}
      width={width}
      height={height}
    />
  );
}
