import { memo, useMemo, useState } from "react";
import {
  ExclamationCircleIcon,
  FilmIcon,
  InboxIcon,
  SpeakerWaveIcon,
  TrashIcon,
} from "@heroicons/react/24/solid";
import { Link } from "@tanstack/react-router";

import type { FileMetadata } from "@/integrations/hydrus-api/models";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui-primitives/context-menu";
import { useFileActions } from "@/hooks/use-file-actions";
import { useThumbnailUrl } from "@/hooks/use-url-with-api-key";
import { cn } from "@/lib/utils";

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

  const scale = Math.max(
    Math.min(lanes * width, (item.thumbnail_width ?? width) * 1.1) / width,
    1.05,
  );

  const originClass = useMemo(() => {
    const isFirstLane = virtualRow.lane === 0;
    const isLastLane = virtualRow.lane === lanes - 1;
    const isTopRow = virtualRow.index < lanes;
    const lastRowStart = totalItemsCount - 2 * lanes;
    const isBottomRow = virtualRow.index >= lastRowStart;

    if (isTopRow && isFirstLane) return "origin-top-left";
    else if (isTopRow && isLastLane) return "origin-top-right";
    else if (isBottomRow && isFirstLane) return "origin-bottom-left";
    else if (isBottomRow && isLastLane) return "origin-bottom-right";
    else if (isTopRow) return "origin-top";
    else if (isBottomRow) return "origin-bottom";
    else if (isFirstLane) return "origin-left";
    else if (isLastLane) return "origin-right";
    else return "origin-center";
  }, [virtualRow.lane, virtualRow.index, lanes, totalItemsCount]);

  return (
    <li
      style={{
        width: `${width}px`,
        height: `${height}px`,
        transform: `translate(${(virtualRow.lane * 100) / lanes}cqw, ${virtualRow.start - scrollMargin}px)`,
        containIntrinsicSize: `${width}px ${height}px`,
        [`--thumbnail-hover-scale`]: `${scale}`,
        [`--thumbnail-hover-reverse-scale`]: `${1 / scale}`,
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
          <Link to="/file/$fileId" params={{ fileId: String(item.file_id) }}>
            <ImageCardContent
              item={item}
              originClass={originClass}
              menuOpen={menuOpen}
            />
          </Link>
        </ContextMenuTrigger>
        <ImageCardContextMenu item={item} />
      </ContextMenu>
    </li>
  );
});

// --- Card Content (badges + thumbnail) ---

interface ImageCardContentProps {
  item: FileMetadata;
  originClass: string;
  menuOpen: boolean;
}

const ImageCardContent = memo(function ImageCardContent({
  item,
  originClass,
  menuOpen,
}: ImageCardContentProps) {
  return (
    <div
      className={cn(
        "h-full w-full overflow-hidden rounded border object-cover",
        "pointer-events-none transition-[scale] duration-100 ease-out",
        "group-hover:scale-(--thumbnail-hover-scale)",
        "group-active:scale-(--thumbnail-hover-scale)",
        originClass,
        menuOpen && "scale-(--thumbnail-hover-scale)",
      )}
    >
      <ThumbnailImage
        fileId={item.file_id}
        width={item.thumbnail_width}
        height={item.thumbnail_height}
      />
      {(item.is_inbox || item.is_trashed || item.is_deleted) && (
        <div
          className={cn(
            "bg-secondary text-secondary-foreground absolute top-1 right-1 flex flex-col gap-1 rounded p-1 opacity-60",
            "pointer-events-none transition-opacity duration-350 ease-out",
            "group-hover:top-0.5 group-hover:right-0.5 group-hover:scale-(--thumbnail-hover-reverse-scale) group-hover:opacity-30",
            "group-active:top-0.5 group-active:right-0.5 group-active:scale-(--thumbnail-hover-reverse-scale) group-active:opacity-30",
            menuOpen &&
              "top-0.5 right-0.5 scale-(--thumbnail-hover-reverse-scale) opacity-30",
          )}
        >
          {item.is_inbox && <InboxIcon className="h-4 w-4" />}
          {item.is_trashed && <TrashIcon className="h-4 w-4" />}
          {item.is_deleted && !item.is_trashed && (
            <ExclamationCircleIcon className="h-4 w-4" />
          )}
        </div>
      )}
      {(item.mime.startsWith("video/") || item.has_audio) && (
        <div
          className={cn(
            "bg-secondary text-secondary-foreground absolute top-1 left-1 flex flex-col gap-1 rounded p-1 opacity-60",
            "pointer-events-none transition-opacity duration-350 ease-out",
            "group-hover:top-0.5 group-hover:left-0.5 group-hover:scale-(--thumbnail-hover-reverse-scale) group-hover:opacity-30",
            "group-active:top-0.5 group-active:left-0.5 group-active:scale-(--thumbnail-hover-reverse-scale) group-active:opacity-30",
            menuOpen &&
              "top-0.5 left-0.5 scale-(--thumbnail-hover-reverse-scale) opacity-30",
          )}
        >
          {item.mime.startsWith("video/") && <FilmIcon className="h-4 w-4" />}
          {item.has_audio && <SpeakerWaveIcon className="h-4 w-4" />}
        </div>
      )}
    </div>
  );
});

// --- Context Menu Actions ---

interface ImageCardContextMenuProps {
  item: Pick<
    FileMetadata,
    "file_id" | "is_inbox" | "is_trashed" | "ext" | "filetype_human"
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
  const { url, onLoad, onError } = useThumbnailUrl(fileId);
  return (
    <img
      src={url}
      alt={`Thumbnail for file ID ${fileId}`}
      className={cn("bg-secondary h-full w-full object-cover", className)}
      loading="lazy"
      onLoad={onLoad}
      onError={onError}
      width={width}
      height={height}
    />
  );
}
