import { AudioBadge, MimeBadge } from "./file-badges";
import { FileStateBadge } from "./file-state-badge";

import type { FileMetadata } from "@/integrations/hydrus-api/models";

export function FileStatusBadges({ data }: { data: FileMetadata }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <FileStateBadge data={data} />
      <MimeBadge data={data} />
      <AudioBadge data={data} />
    </div>
  );
}
