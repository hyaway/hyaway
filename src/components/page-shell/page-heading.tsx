// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { Heading } from "@/components/ui-primitives/heading";
import { Separator } from "@/components/ui-primitives/separator";

interface PageHeadingProps {
  title: string;
}

export function PageHeading({ title }: PageHeadingProps) {
  return (
    <>
      <Heading level={1} className="pt-2">
        {title}
      </Heading>
      <Separator className="mb-2" />
    </>
  );
}
