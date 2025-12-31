import { useCanGoBack, useRouter } from "@tanstack/react-router";
import { IconArrowLeft } from "@tabler/icons-react";
import { Button } from "@/components/ui-primitives/button";
import { cn } from "@/lib/utils";

export interface BackButtonProps {
  className?: string;
}

/**
 * A back button that navigates to the previous page in history.
 * Only renders when there's history to go back to.
 */
export function BackButton({ className }: BackButtonProps) {
  const router = useRouter();
  const canGoBack = useCanGoBack();

  if (!canGoBack) {
    return null;
  }

  return (
    <Button
      onClick={() => router.history.back()}
      variant="ghost"
      size="icon"
      aria-label="Go back"
      className={cn(className)}
    >
      <IconArrowLeft className="size-5" />
    </Button>
  );
}
