// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { Heading } from "@/components/ui-primitives/heading";
import { Separator } from "@/components/ui-primitives/separator";

interface PageHeadingProps {
  title: string;
  eyebrow?: string;
}

export function PageHeading({ title, eyebrow }: PageHeadingProps) {
  return (
    <>
      <div className="pt-2">
        {eyebrow ? (
          <p className="text-muted-foreground -mb-2 text-sm/5">{eyebrow}</p>
        ) : null}
        <Heading level={1}>{title}</Heading>
      </div>
      <Separator className="mb-2" />
    </>
  );
}
