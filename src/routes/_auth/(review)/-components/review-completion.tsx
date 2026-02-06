// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { IconCheck } from "@tabler/icons-react";
import { useNavigate } from "@tanstack/react-router";
import { ReviewStatsBreakdown } from "./review-stats-breakdown";
import type { ReviewDirectionStats } from "@/stores/review-queue-store";
import type { SwipeBindings } from "@/stores/review-settings-store";
import { useReviewQueueActions } from "@/stores/review-queue-store";
import { Button } from "@/components/ui-primitives/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui-primitives/card";

interface ReviewCompletionProps {
  stats: ReviewDirectionStats;
  bindings: SwipeBindings;
}

export function ReviewCompletion({ stats, bindings }: ReviewCompletionProps) {
  const { clearQueue } = useReviewQueueActions();
  const navigate = useNavigate();
  const total = stats.left + stats.right + stats.up + stats.down;

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
          <ReviewStatsBreakdown
            stats={stats}
            bindings={bindings}
            variant="grid"
            hideZero={false}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex w-full flex-col gap-2">
        <Button variant="outline" onClick={clearQueue} className="w-full">
          Configure actions
        </Button>
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
