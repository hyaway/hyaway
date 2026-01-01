import { AudioBadge, MimeBadge } from "./file-badges";
import { FileStateBadge } from "./file-state-badge";

import type { FileMetadata } from "@/integrations/hydrus-api/models";
import { Skeleton } from "@/components/ui-primitives/skeleton";

export function FileStatusBadgesSkeleton() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Skeleton className="h-6 w-16 rounded-4xl" />
      <Skeleton className="h-6 w-24 rounded-4xl" />
    </div>
  );
}

export function FileStatusBadges({ data }: { data: FileMetadata }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <FileStateBadge data={data} />
      <MimeBadge data={data} />
      <AudioBadge data={data} />
    </div>
  );
}
