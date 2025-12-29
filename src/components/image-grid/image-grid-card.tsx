import { memo, useMemo, useState } from "react";
import {
  ArrowTopRightOnSquareIcon,
  FilmIcon,
  InboxIcon,
  NoSymbolIcon,
  SpeakerWaveIcon,
  TrashIcon,
} from "@heroicons/react/16/solid";
import { Link } from "@tanstack/react-router";

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
import { checkerboardBg, cn } from "@/lib/utils";
import { useImageBackground } from "@/lib/ux-settings-store";

/** Height of the polaroid-style footer strip in pixels (h-6 = 24px) */
export const CARD_FOOTER_HEIGHT = 24;

// --- Main Card Component ---

export interface ImageCardProps extends React.HTMLAttributes<HTMLLIElement> {
  virtualRow: { lane: number; index: number; start: number };
  lanes: number;
  totalItemsCount: number;
  item: FileMetadata;
  width: number;
  height: number;
  scrollMargin: number;
  isScrolling?: boolean;
}

export const ImageGridCard = memo(function ImageGridCard({
  virtualRow,
  lanes,
  totalItemsCount,
  className,
  item,
  width,
  height,
  scrollMargin,
  isScrolling,
  ...props
}: ImageCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

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
      }}
      className={cn(
        "group absolute top-0 left-0 z-0 flex h-full w-full justify-center overflow-visible [content-visibility:auto]",
        "hover:z-30 hover:[content-visibility:visible]",
        "active:z-30 active:[content-visibility:visible]",
        width < height ? "flex-col" : "flex-row",
        !isScrolling && "transition-transform duration-350 ease-out",
        menuOpen && "z-30 [content-visibility:visible]",
        className,
      )}
      {...props}
    >
      <ContextMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <ContextMenuTrigger>
          <Link
            to="/file/$fileId"
            params={{ fileId: String(item.file_id) }}
            className="absolute inset-0 z-10"
          />
        </ContextMenuTrigger>
        <ImageCardContextMenu item={item} />
      </ContextMenu>
      <div
        className={cn(
          "pointer-events-none h-full w-full transition-[scale] duration-100 ease-in-out",
          "group-hover:scale-(--thumbnail-hover-scale)",
          "group-active:scale-(--thumbnail-hover-scale)",
          menuOpen
            ? "ring-primary scale-(--thumbnail-hover-scale) ring-3"
            : "shadow",
          originClass,
        )}
      >
        <ImageCardContent item={item} />
      </div>
    </li>
  );
});

// --- Card Content (badges + thumbnail) ---

interface ImageCardContentProps {
  item: FileMetadata;
}

const ImageCardContent = memo(function ImageCardContent({
  item,
}: ImageCardContentProps) {
  const fileSize = formatBytes(item.size);
  const isPermanentlyDeleted = item.is_deleted && !item.is_trashed;

  return (
    <div
      className={cn(
        "bg-muted text-muted-foreground relative flex h-full w-full flex-col overflow-hidden rounded-sm shadow-sm",
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
          />
        ) : (
          <ThumbnailImage
            fileId={item.file_id}
            width={item.thumbnail_width}
            height={item.thumbnail_height}
          />
        )}
      </div>
      <div className="bg-muted text-muted-foreground flex h-6 shrink-0 items-center gap-1.5 px-1.5 text-xs">
        {item.mime.startsWith("video/") && <FilmIcon className="size-4" />}
        {item.has_audio && <SpeakerWaveIcon className="size-4" />}
        {fileSize && <span>{fileSize}</span>}
        <span className="flex-1" />
        {item.is_inbox && <InboxIcon className="size-4" />}
        {item.is_trashed && <TrashIcon className="size-4" />}
        {item.is_deleted && !item.is_trashed && (
          <NoSymbolIcon className="text-destructive size-4" />
        )}
      </div>
    </div>
  );
});

// --- Context Menu Actions ---

interface ImageCardContextMenuProps {
  item: Pick<
    FileMetadata,
    "file_id" | "is_inbox" | "is_trashed" | "ext" | "filetype_human" | "mime"
  >;
}

const ImageCardContextMenu = memo(function ImageCardContextMenu({
  item,
}: ImageCardContextMenuProps) {
  const actionGroups = useFileActions(item, {
    includeOpen: true,
    includeExternal: true,
  });

  return (
    <ContextMenuContent>
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
                <ArrowTopRightOnSquareIcon className="ml-auto opacity-50" />
              )}
            </ContextMenuItem>
          ))}
        </div>
      ))}
    </ContextMenuContent>
  );
});

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
