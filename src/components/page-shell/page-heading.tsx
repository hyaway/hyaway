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
        {eyebrow ? <div className="text-sm/5">{eyebrow}</div> : null}
        <Heading
          level={1}
          className={eyebrow ? "pb-2 text-2xl/10!" : undefined}
        >
          {title}
        </Heading>
      </div>
      <Separator className="mb-2" />
    </>
  );
}
