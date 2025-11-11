import { useVirtualizer } from "@tanstack/react-virtual";
import React, { useMemo } from "react";
import { Text } from "../ui/text";
import { Badge } from "../ui/badge";
import { Container } from "../ui/container";
import type { FileMetadata } from "@/integrations/hydrus-api/models";
import { TagStatus } from "@/integrations/hydrus-api/models";
import { useAllKnownTagsServiceQuery } from "@/integrations/hydrus-api/queries/services";
import { cn } from "@/lib/utils";

export function TagsSidebar({
  items,
  className,
  style,
}: {
  items: Array<FileMetadata>;
  className?: string;
  style?: React.CSSProperties;
}) {
  const allTagsServiceId = useAllKnownTagsServiceQuery().data;

  const tags = useMemo((): Array<{
    tag: string;
    count: number;
    namespace: string;
  }> => {
    if (!allTagsServiceId || items.length === 0) return [];

    const counts = new Map<string, number>();

    for (const item of items) {
      const displayTags =
        item.tags?.[allTagsServiceId]?.display_tags[TagStatus.CURRENT];

      if (!displayTags) continue;

      for (const displayTag of displayTags) {
        if (!displayTag) continue;
        counts.set(displayTag, (counts.get(displayTag) ?? 0) + 1);
      }
    }

    const resultWithNs = Array.from(counts.entries()).map(
      ([displayTag, count]) => {
        const idx = displayTag.indexOf(":");
        if (idx === -1) {
          return { tag: displayTag, count, namespace: "" };
        }
        const namespace = displayTag.slice(0, idx);
        const tag = displayTag.slice(idx + 1);
        return { tag, count, namespace };
      },
    );

    resultWithNs.sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      const nsCompare =
        a.namespace === "" && b.namespace !== ""
          ? 1
          : a.namespace !== "" && b.namespace === ""
            ? -1
            : a.namespace.localeCompare(b.namespace);
      if (nsCompare !== 0) return nsCompare;
      return a.tag.localeCompare(b.tag);
    });

    return resultWithNs;
  }, [items, allTagsServiceId]);

  const parentRef = React.useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: tags.length,
    estimateSize: () => 40,
    overscan: 1,
    gap: 8,
    getScrollElement: () => parentRef.current,
  });

  const rows = rowVirtualizer.getVirtualItems();

  const [visibleHeight, setVisibleHeight] = React.useState<number | undefined>(
    undefined,
  );

  React.useLayoutEffect(() => {
    const update = () => {
      const parentEl = parentRef.current?.parentElement;
      if (!parentEl) {
        setVisibleHeight(undefined);
        return;
      }
      const rect = parentEl.getBoundingClientRect();
      const top = Math.max(rect.top, 0);
      const bottom = Math.min(rect.bottom, window.innerHeight);
      const height = Math.max(0, bottom - top);
      setVisibleHeight(height || undefined);
    };

    update();

    const ro = new ResizeObserver(update);
    if (parentRef.current?.parentElement) {
      ro.observe(parentRef.current.parentElement);
    }
    window.addEventListener("resize", update, { passive: true });
    window.addEventListener("scroll", update, { passive: true });

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update);
    };
  }, []);

  const combinedStyle: React.CSSProperties = {
    ...style,
    position: "sticky",
    top: 0,
    height: visibleHeight ? `${visibleHeight}px` : undefined,
    overflow: "auto",
  };
  if (tags.length === 0) {
    return null;
  }
  return (
    <Container
      ref={parentRef}
      className={cn("hidden w-72 ps-4 lg:block", className)}
      style={combinedStyle}
    >
      <ol
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
        }}
        className="relative flex"
      >
        {rows.map((virtualRow) => {
          const tagItem = tags[virtualRow.index];

          return (
            <li
              key={virtualRow.index}
              data-index={virtualRow.index}
              style={{
                transform: `translateY(${virtualRow.start}px)`,
              }}
              ref={rowVirtualizer.measureElement}
              className="absolute top-0 left-0 flex w-full flex-row items-center gap-1 font-mono uppercase"
            >
              <Text>{virtualRow.index + 1}.</Text>
              <Badge
                intent="info"
                isCircle={false}
                className="break-normal wrap-anywhere whitespace-normal"
              >
                {tagItem.namespace ? `${tagItem.namespace}: ` : ""}
                {tagItem.tag}
              </Badge>

              <Badge intent="secondary" isCircle={false}>
                {tagItem.count}
              </Badge>
            </li>
          );
        })}
      </ol>
    </Container>
  );
}
