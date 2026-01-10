import {
  IconArchive,
  IconArrowUp,
  IconHistory,
  IconTrash,
} from "@tabler/icons-react";
import type { ReviewAction } from "@/stores/review-queue-store";
import { FooterPortal } from "@/components/app-shell/footer-portal";
import { Badge } from "@/components/ui-primitives/badge";
import { Button } from "@/components/ui-primitives/button";
import { Kbd } from "@/components/ui-primitives/kbd";
import { cn } from "@/lib/utils";

interface ReviewFooterProps {
  /** Callback when an action button is clicked */
  onAction: (action: ReviewAction | "undo") => void;
  /** Number of actions that can be undone */
  undoCount: number;
  /** Whether the deck is empty/complete */
  disabled?: boolean;
}

export function ReviewFooter({
  onAction,
  undoCount,
  disabled,
}: ReviewFooterProps) {
  return (
    <FooterPortal>
      <div className="flex h-full items-center justify-center gap-1 px-2">
        {/* Undo button */}
        <ReviewActionButton
          label="Undo"
          icon={<IconHistory className="size-6" />}
          onClick={() => onAction("undo")}
          disabled={disabled || undoCount === 0}
          kbd="↓"
          badge={undoCount > 0 ? undoCount : undefined}
        />

        {/* Trash button */}
        <ReviewActionButton
          label="Trash"
          icon={<IconTrash className="size-6" />}
          onClick={() => onAction("trash")}
          disabled={disabled}
          variant="destructive"
          kbd="←"
        />

        {/* Skip button */}
        <ReviewActionButton
          label="Skip"
          icon={<IconArrowUp className="size-6" />}
          onClick={() => onAction("skip")}
          disabled={disabled}
          kbd="↑"
        />

        {/* Archive button */}
        <ReviewActionButton
          label="Archive"
          icon={<IconArchive className="size-6" />}
          onClick={() => onAction("archive")}
          disabled={disabled}
          kbd="→"
        />
      </div>
    </FooterPortal>
  );
}

interface ReviewActionButtonProps {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: "default" | "destructive";
  kbd: string;
  badge?: number;
}

function ReviewActionButton({
  label,
  icon,
  onClick,
  disabled,
  variant = "default",
  kbd,
  badge,
}: ReviewActionButtonProps) {
  return (
    <Button
      variant="ghost"
      size="xl"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative h-full flex-col items-center justify-center gap-0.5 border-none px-3",
        "@xl:flex-row @xl:gap-1.5 @xl:px-4",
        "short:gap-0 short:px-3",
        "short:@xl:flex-row short:@xl:gap-1.5 short:@xl:px-4",
        "transition-[gap,padding] duration-200",
        variant === "destructive" && "text-destructive hover:text-destructive",
      )}
    >
      <span className="short:size-5 short:[&>svg]:size-5 relative flex size-6 items-center justify-center [&>svg]:size-6">
        {icon}
        {badge !== undefined && badge > 0 && (
          <Badge
            variant="default"
            className="absolute -top-1 -right-2 flex h-4 min-w-4 items-center justify-center px-1 text-[10px]"
          >
            {badge > 99 ? "99+" : badge}
          </Badge>
        )}
      </span>
      <span className="short:sr-only short:@xl:not-sr-only flex flex-col items-center gap-0.5 text-xs max-[250px]:sr-only @xl:flex-row @xl:gap-1.5 @xl:text-sm">
        {label}
        <Kbd className="hidden @xl:inline-flex">{kbd}</Kbd>
      </span>
    </Button>
  );
}
