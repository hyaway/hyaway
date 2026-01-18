// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { Skeleton } from "@/components/ui-primitives/skeleton";

export function MetadataListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="contents">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-full" />
        </div>
      ))}
    </dl>
  );
}

export function MetadataList({
  rows,
}: {
  rows: Array<{ label: string; value: React.ReactNode }>;
}) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
      {rows.map((row) => (
        <div key={row.label} className="contents">
          <dt className="text-muted-foreground font-medium select-all">
            {row.label}
          </dt>
          <dd className="select-all">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
