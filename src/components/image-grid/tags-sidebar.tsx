import { useVirtualizer } from "@tanstack/react-virtual";
import React, { useMemo } from "react";
import { Badge } from "../ui/badge";
import type { FileMetadata } from "@/integrations/hydrus-api/models";
import { TagStatus } from "@/integrations/hydrus-api/models";
import { useAllKnownTagsServiceQuery } from "@/integrations/hydrus-api/queries/services";
import { cn } from "@/lib/utils";

export function TagsSidebar({
  items,
  className,
}: {
  items: Array<FileMetadata>;
  className?: string;
}) {
  const allTagsServiceId = useAllKnownTagsServiceQuery().data;

  const tags = useMemo(
    () =>
      allTagsServiceId && items.length
        ? items.flatMap(
            (d) =>
              d.tags?.[allTagsServiceId].display_tags[
                TagStatus.CURRENT
              ]?.filter((x) => !!x) ?? [],
          )
        : [],
    [items, allTagsServiceId],
  );

  const parentRef = React.useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: tags.length,
    estimateSize: () => 20,
    overscan: 3,
    gap: 8,
    getScrollElement: () => parentRef.current,
  });

  return (
    <div ref={parentRef} className={cn("h-full w-24 overflow-auto", className)}>
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
        }}
        className="relative w-full"
      >
        {
          !rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const tag = tags[virtualRow.index];

            return (
              <div
                key={virtualRow.index}
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                className="absolute top-0 left-0 z-0 w-full overflow-visible transition-[left,transform,width,height] duration-350 ease-out will-change-[left,transform,width,height] hover:z-999"
              >
                <Badge intent="secondary" isCircle={true}>
                  {tag}
                </Badge>
              </div>
            );
          })
        }
      </div>
    </div>
  );
}
