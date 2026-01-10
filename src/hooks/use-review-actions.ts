import { useNavigate } from "@tanstack/react-router";
import { IconCards } from "@tabler/icons-react";
import type { FloatingFooterAction } from "@/components/page-shell/page-floating-footer";
import {
  useReviewQueueActions,
  useReviewQueueRemaining,
} from "@/stores/review-queue-store";

interface UseReviewActionsOptions {
  /** File IDs to add to review queue */
  fileIds: Array<number>;
}

/**
 * Hook that provides review queue actions for gallery pages.
 * Returns an array of FloatingFooterAction objects ready to pass to PageFloatingFooter.
 */
export function useReviewActions({
  fileIds,
}: UseReviewActionsOptions): Array<FloatingFooterAction> {
  const navigate = useNavigate();
  const { setQueue, addToQueue } = useReviewQueueActions();
  const queueRemaining = useReviewQueueRemaining();

  const hasFiles = fileIds.length > 0;

  const handleReview = () => {
    if (!hasFiles) return;
    setQueue(fileIds);
    navigate({ to: "/review" });
  };

  const handleAddToQueue = () => {
    if (!hasFiles) return;
    addToQueue(fileIds);
    navigate({ to: "/review" });
  };

  if (!hasFiles) {
    return [];
  }

  if (queueRemaining > 0) {
    return [
      {
        id: "review-replace",
        label: "Replace queue",
        icon: IconCards,
        onClick: handleReview,
      },
      {
        id: "review-add",
        label: "Add to queue",
        icon: IconCards,
        onClick: handleAddToQueue,
      },
    ];
  }

  return [
    {
      id: "review",
      label: "Review",
      icon: IconCards,
      onClick: handleReview,
    },
  ];
}
