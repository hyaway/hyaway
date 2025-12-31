import { MetadataList } from "./metadata-list";
import type { useGetSingleFileMetadata } from "@/integrations/hydrus-api/queries/manage-files";

export function FileInfoTable({
  data,
}: {
  data: NonNullable<ReturnType<typeof useGetSingleFileMetadata>["data"]>;
}) {
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
