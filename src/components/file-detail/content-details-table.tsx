import { MetadataList } from "./metadata-list";

import type { useGetSingleFileMetadata } from "@/integrations/hydrus-api/queries/get-files";

export function ContentDetailsTable({
  data,
}: {
  data: NonNullable<ReturnType<typeof useGetSingleFileMetadata>["data"]>;
}) {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatDuration = (ms: number | null) => {
    if (ms === null) return null;
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const parts: Array<string> = [];
    if (hours > 0) {
      parts.push(
        new Intl.NumberFormat(undefined, {
          style: "unit",
          unit: "hour",
        }).format(hours),
      );
    }
    if (minutes > 0) {
      parts.push(
        new Intl.NumberFormat(undefined, {
          style: "unit",
          unit: "minute",
        }).format(minutes),
      );
    }
    if (seconds > 0 || parts.length === 0) {
      parts.push(
        new Intl.NumberFormat(undefined, {
          style: "unit",
          unit: "second",
        }).format(seconds),
      );
    }
    return parts.join(" ");
  };

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
