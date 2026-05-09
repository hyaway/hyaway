// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import type { ReactNode } from "react";
import { Heading } from "@/components/ui-primitives/heading";
import { Separator } from "@/components/ui-primitives/separator";

interface PageHeadingProps {
  title: string;
  eyebrow?: ReactNode;
}

export function PageHeading({ title, eyebrow }: PageHeadingProps) {
  return (
    <>
      <div className="pt-2">
        {eyebrow ? (
          <div className="text-muted-foreground -mb-2 text-sm/5">{eyebrow}</div>
        ) : null}
        <Heading level={1}>{title}</Heading>
      </div>
      <Separator className="mb-2" />
    </>
  );
}
