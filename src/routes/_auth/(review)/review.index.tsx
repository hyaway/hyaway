// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { IconPlayerStopFilled } from "@tabler/icons-react";
import { createFileRoute } from "@tanstack/react-router";
import { ReviewCompletion } from "./-components/review-completion";
import { ReviewFooter } from "./-components/review-footer";
import { ReviewSettingsPopover } from "./-components/review-settings-popover";
import { ReviewStatsBreakdown } from "./-components/review-stats-breakdown";
import {
  ReviewSwipeDeckVisual,
  useReviewSwipeDeck,
} from "./-components/review-swipe-deck";
import { SwipeBindingsConfig } from "./-components/swipe-bindings-config";
import { EmptyState } from "@/components/page-shell/empty-state";
import { PageHeaderActions } from "@/components/page-shell/page-header-actions";
import { PageHeading } from "@/components/page-shell/page-heading";
import { Button, LinkButton } from "@/components/ui-primitives/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui-primitives/tooltip";
import {
  useReviewDirectionStats,
  useReviewQueueActions,
  useReviewQueueCount,
  useReviewQueueCurrentIndex,
  useReviewQueueHistory,
  useReviewQueueIsComplete,
  useReviewQueueIsEmpty,
} from "@/stores/review-queue-store";
import { Progress } from "@/components/ui-primitives/progress";

export const Route = createFileRoute("/_auth/(review)/review/")({
  component: ReviewPage,
});

function ReviewPage() {
  const isEmpty = useReviewQueueIsEmpty();
  const isComplete = useReviewQueueIsComplete();
  const count = useReviewQueueCount();
  const currentIndex = useReviewQueueCurrentIndex();
  const history = useReviewQueueHistory();
  const directionStats = useReviewDirectionStats();
  const { skipToEnd } = useReviewQueueActions();

  // All hooks must be called unconditionally - call deck hook here
  const deckState = useReviewSwipeDeck();

  if (isEmpty) {
    return (
      <div className="flex min-w-0 flex-col overflow-hidden">
        <PageHeading title="Review Queue" />
        <PageHeaderActions>
          <ReviewSettingsPopover />
        </PageHeaderActions>
        <EmptyState
          message="No items in review queue. Add files from a page to start reviewing."
          action={
            <LinkButton to="/pages" search={{ q: undefined }} variant="outline">
              Browse pages
            </LinkButton>
          }
        />
        <SwipeBindingsConfig className="mt-8" />
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="flex min-h-[calc(100dvh-8rem)] flex-col items-center justify-center">
        <PageHeaderActions>
          <ReviewSettingsPopover />
        </PageHeaderActions>
        <ReviewCompletion
          stats={directionStats}
          bindings={deckState.bindings}
        />
        <ReviewFooter
          onSwipe={deckState.handleSwipe}
          onUndo={deckState.performUndo}
          undoCount={history.length}
          disabled
        />
      </div>
    );
  }

  const progress = count > 0 ? (currentIndex / count) * 100 : 0;

  // Calculate available height accounting for header, footer, and main padding
  // The deck will size itself based on viewport
  return (
    <div className="flex h-full flex-col">
      <PageHeaderActions>
        <ReviewSettingsPopover />
      </PageHeaderActions>

      {/* Stats breakdown */}
      {history.length > 0 && (
        <ReviewStatsBreakdown
          stats={directionStats}
          bindings={deckState.bindings}
          variant="inline"
          className="px-4 pb-1"
        />
      )}
      {/* Progress indicator */}
      <div className="text-muted-foreground flex items-center gap-2 px-4 py-1 text-sm tabular-nums">
        <Progress value={progress} className="flex-1" />
        <span className="shrink-0">
          {currentIndex + 1}/{count}
        </span>
        <Tooltip>
          <TooltipTrigger
            render={(props) => (
              <Button
                {...props}
                variant="ghost"
                size="icon-sm"
                onClick={skipToEnd}
                aria-label="End review"
              >
                <IconPlayerStopFilled className="size-4" />
              </Button>
            )}
          />
          <TooltipContent>End review</TooltipContent>
        </Tooltip>
      </div>

      {/* Swipe deck - centered */}
      <div className="flex h-full flex-1 items-center justify-center px-4">
        <ReviewSwipeDeckVisual
          visibleFileIds={deckState.visibleFileIds}
          exitingCards={deckState.exitingCards}
          gesturesEnabled={deckState.gesturesEnabled}
          bindings={deckState.bindings}
          handleSwipe={deckState.handleSwipe}
          handleExitComplete={deckState.handleExitComplete}
        />
      </div>

      {/* Footer - renders via portal */}
      <ReviewFooter
        onSwipe={deckState.handleSwipe}
        onUndo={deckState.performUndo}
        undoCount={history.length}
      />
    </div>
  );
}
