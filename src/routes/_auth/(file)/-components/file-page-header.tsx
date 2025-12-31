import { Heading } from "@/components/ui-primitives/heading";

export function FilePageHeader({ fileId }: { fileId: number }) {
  return (
    <Heading level={1} className="hidden">
      File: {fileId}
    </Heading>
  );
}
