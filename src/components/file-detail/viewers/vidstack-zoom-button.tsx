import { Tooltip } from "@vidstack/react";
import { IconZoomIn, IconZoomOut } from "@tabler/icons-react";
import { TouchTarget } from "@/components/ui-primitives/touch-target";

interface VidstackZoomButtonProps {
  zoomFill: boolean;
  onToggle: () => void;
}

/** Vidstack control button for zoom/fit toggle */
export function VidstackZoomButton({
  zoomFill,
  onToggle,
}: VidstackZoomButtonProps) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <button
          className="vds-button"
          onClick={onToggle}
          aria-label={zoomFill ? "Fit to container" : "Zoom to fill"}
          role="button"
          type="button"
        >
          <TouchTarget>
            {zoomFill ? (
              <IconZoomOut className="size-6.5" />
            ) : (
              <IconZoomIn className="size-6.5" />
            )}
          </TouchTarget>
        </button>
      </Tooltip.Trigger>
      <Tooltip.Content className="vds-tooltip-content" placement="top">
        {zoomFill ? "Fit" : "Zoom"}
      </Tooltip.Content>
    </Tooltip.Root>
  );
}
