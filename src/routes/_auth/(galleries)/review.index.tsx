import { IconPlayerStopFilled } from "@tabler/icons-react";
import { createFileRoute } from "@tanstack/react-router";
import { ReviewCompletion } from "./-components/review-completion";
import { ReviewFooter } from "./-components/review-footer";
import {
  ReviewSwipeDeckVisual,
  useReviewSwipeDeck,
} from "./-components/review-swipe-deck";
import { FileViewerSettingsPopover } from "@/components/file-detail/file-viewer-settings-popover";
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
  useReviewQueueActions,
  useReviewQueueCount,
  useReviewQueueCurrentIndex,
  useReviewQueueHistory,
  useReviewQueueIsComplete,
  useReviewQueueIsEmpty,
  useReviewStats,
} from "@/stores/review-queue-store";

export const Route = createFileRoute("/_auth/(galleries)/review/")({
  component: ReviewPage,
});

function ReviewPage() {
  const isEmpty = useReviewQueueIsEmpty();
  const isComplete = useReviewQueueIsComplete();
  const count = useReviewQueueCount();
  const currentIndex = useReviewQueueCurrentIndex();
  const history = useReviewQueueHistory();
  const stats = useReviewStats();
  const { skipToEnd } = useReviewQueueActions();

  // All hooks must be called unconditionally - call deck hook here
  const deckState = useReviewSwipeDeck();

  if (isEmpty) {
    return (
      <div className="flex flex-col">
        <PageHeading title="Review Queue" />
        <PageHeaderActions>
          <FileViewerSettingsPopover />
        </PageHeaderActions>
        <EmptyState
          message="No items in review queue. Add files from a page to start reviewing."
          action={
            <LinkButton to="/pages" variant="outline">
              Browse pages
            </LinkButton>
          }
        />
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="flex min-h-[calc(100dvh-8rem)] flex-col items-center justify-center">
        <PageHeaderActions>
          <FileViewerSettingsPopover />
        </PageHeaderActions>
        <ReviewCompletion
          stats={stats}
          onUndo={
            history.length > 0
              ? () => deckState.performAction("undo")
              : undefined
          }
          canUndo={history.length > 0}
        />
        <ReviewFooter
          onAction={deckState.performAction}
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
    <div className="flex flex-col">
      <PageHeaderActions>
        <FileViewerSettingsPopover />
      </PageHeaderActions>

      {/* Progress indicator */}
      <div className="text-muted-foreground flex items-center gap-2 px-4 py-1 text-xs tabular-nums">
        <div className="bg-muted h-1 flex-1 overflow-hidden rounded-full">
          <div
            className="bg-primary h-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
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
      <div className="flex flex-1 items-center justify-center px-4">
        <ReviewSwipeDeckVisual
          visibleFileIds={deckState.visibleFileIds}
          exitingCards={deckState.exitingCards}
          handleSwipe={deckState.handleSwipe}
          handleExitComplete={deckState.handleExitComplete}
        />
      </div>

      {/* Footer - renders via portal */}
      <ReviewFooter
        onAction={deckState.performAction}
        undoCount={history.length}
      />
    </div>
  );
}
