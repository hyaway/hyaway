import { SpeakerWaveIcon } from "@heroicons/react/16/solid";

import { MimeIcon } from "./mime-icon";

import type { FileMetadata } from "@/integrations/hydrus-api/models";

import { Badge } from "@/components/ui-primitives/badge";

type MimeBadgeData = Pick<FileMetadata, "mime">;

export function MimeBadge({ data }: { data: MimeBadgeData }) {
  return (
    <Badge variant="outline">
      <MimeIcon mime={data.mime} className="mr-1 size-3" />
      {data.mime}
    </Badge>
  );
}

type AudioBadgeData = Pick<FileMetadata, "has_audio">;

export function AudioBadge({ data }: { data: AudioBadgeData }) {
  if (!data.has_audio) return null;

  return (
    <Badge variant="outline">
      <SpeakerWaveIcon className="mr-1 size-3" />
      Has audio
    </Badge>
  );
}
