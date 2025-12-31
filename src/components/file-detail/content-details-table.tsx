import { MetadataList } from "./metadata-list";

import type { FileMetadata } from "@/integrations/hydrus-api/models";
import { formatBytes, formatDuration } from "@/lib/format-utils";

export function ContentDetailsTable({ data }: { data: FileMetadata }) {
  const rows: Array<{ label: string; value: React.ReactNode }> = [
    { label: "Dimensions", value: `${data.width} × ${data.height}` },
    { label: "Size", value: formatBytes(data.size) },
  ];

  if (data.duration !== null) {
    rows.push({ label: "Duration", value: formatDuration(data.duration) });
  }

  if (data.num_frames !== null) {
    rows.push({
      label: "Frames",
      value: new Intl.NumberFormat().format(data.num_frames),
    });

    if (data.duration !== null && data.duration > 0) {
      const fps = data.num_frames / (data.duration / 1000);
      rows.push({
        label: "Framerate",
        value: `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(fps)} fps`,
      });
    }
  }

  if (data.num_words !== null) {
    rows.push({ label: "Words", value: data.num_words });
  }

  rows.push({ label: "Has Audio", value: data.has_audio ? "Yes" : "No" });

  return <MetadataList rows={rows} />;
}
