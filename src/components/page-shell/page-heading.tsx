// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import type { ReactNode } from "react";
import { Heading } from "@/components/ui-primitives/heading";
import { Separator } from "@/components/ui-primitives/separator";

interface PageHeadingProps {
  title: string;
  eyebrow?: ReactNode;
  actions?: ReactNode;
}

export function PageHeading({ title, eyebrow, actions }: PageHeadingProps) {
  return (
    <>
      <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {eyebrow ? <div className="text-sm/5">{eyebrow}</div> : null}
          <Heading level={1} className="pb-2">
            {title}
          </Heading>
        </div>
        {actions ? (
          <div className="shrink-0 pt-1 sm:pt-2">{actions}</div>
        ) : null}
      </div>
      <Separator className="mb-2" />
    </>
  );
}
