// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import {
  IconArchive,
  IconArrowUp,
  IconCheck,
  IconEqual,
  IconTrash,
} from "@tabler/icons-react";
import { useNavigate } from "@tanstack/react-router";
import type { ReviewStats } from "@/stores/review-queue-store";
import { useReviewQueueActions } from "@/stores/review-queue-store";
import { Button } from "@/components/ui-primitives/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui-primitives/card";

interface ReviewCompletionProps {
  stats: ReviewStats;
}

export function ReviewCompletion({ stats }: ReviewCompletionProps) {
  const { clearQueue } = useReviewQueueActions();
  const navigate = useNavigate();
  const total =
    stats.archived + stats.trashed + stats.skipped + stats.unchanged;

  const handleClearAndBrowse = () => {
    clearQueue();
    navigate({ to: "/pages", search: { q: undefined } });
  };

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6 px-4">
      {/* Success icon */}
      <div className="bg-primary/10 text-primary flex size-20 items-center justify-center rounded-full">
        <IconCheck className="size-10" strokeWidth={2.5} />
      </div>

      {/* Title */}
      <div className="text-center">
        <h2 className="text-2xl font-semibold">Review complete!</h2>
        <p className="text-muted-foreground mt-1">
          You reviewed {total} {total === 1 ? "file" : "files"}
        </p>
      </div>

      {/* Stats card */}
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="flex flex-col items-center gap-1">
              <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-full">
                <IconArchive className="size-5" />
              </div>
              <span className="text-2xl font-semibold tabular-nums">
                {stats.archived}
              </span>
              <span className="text-muted-foreground text-xs">Archived</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="bg-destructive/10 text-destructive flex size-10 items-center justify-center rounded-full">
                <IconTrash className="size-5" />
              </div>
              <span className="text-2xl font-semibold tabular-nums">
                {stats.trashed}
              </span>
              <span className="text-muted-foreground text-xs">Trashed</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="bg-muted text-muted-foreground flex size-10 items-center justify-center rounded-full">
                <IconArrowUp className="size-5" />
              </div>
              <span className="text-2xl font-semibold tabular-nums">
                {stats.skipped}
              </span>
              <span className="text-muted-foreground text-xs">Skipped</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="bg-muted text-muted-foreground flex size-10 items-center justify-center rounded-full">
                <IconEqual className="size-5" />
              </div>
              <span className="text-2xl font-semibold tabular-nums">
                {stats.unchanged}
              </span>
              <span className="text-muted-foreground text-xs">Unchanged</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex w-full flex-col gap-2">
        <Button
          variant="outline"
          onClick={handleClearAndBrowse}
          className="w-full"
        >
          Browse pages
        </Button>
      </div>
    </div>
  );
}
