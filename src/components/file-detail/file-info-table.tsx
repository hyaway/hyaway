import { MetadataList } from "./metadata-list";
import type { FileMetadata } from "@/integrations/hydrus-api/models";

export function FileInfoTable({ data }: { data: FileMetadata }) {
  const rows: Array<{ label: string; value: React.ReactNode }> = [
    { label: "File ID", value: data.file_id },
    {
      label: "Hash",
      value: <code className="font-mono break-all">{data.hash}</code>,
    },
    { label: "MIME Type", value: data.mime },
    { label: "File Type", value: data.filetype_human },
    { label: "Extension", value: data.ext },
  ];

  return <MetadataList rows={rows} />;
}
