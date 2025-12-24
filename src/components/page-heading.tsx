import { Heading } from "@/components/ui-primitives/heading";
import { Separator } from "@/components/ui-primitives/separator";

interface PageHeadingProps {
  title: string;
}

export function PageHeading({ title }: PageHeadingProps) {
  return (
    <>
      <Heading level={1}>{title}</Heading>
      <Separator className="my-2" />
    </>
  );
}
