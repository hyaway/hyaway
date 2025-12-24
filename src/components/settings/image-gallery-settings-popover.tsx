import { Settings01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui-primitives/button";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui-primitives/popover";
import { Label } from "@/components/ui-primitives/label";
import { Slider } from "@/components/ui-primitives/slider";
import { Switch } from "@/components/ui-primitives/switch";
import {
  MAX_GRID_LANES,
  useGridExpandImages,
  useGridMaxLanes,
  useUxSettingsActions,
} from "@/lib/ux-settings-store";

export function ImageGallerySettingsPopover() {
  const gridMaxLanes = useGridMaxLanes();
  const gridExpandImages = useGridExpandImages();
  const { setGridMaxLanes, setGridExpandImages } = useUxSettingsActions();

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="ghost" size="icon">
            <HugeiconsIcon icon={Settings01Icon} />
            <span className="sr-only">Gallery settings</span>
          </Button>
        }
      />
      <PopoverContent align="end" className="w-80">
        <PopoverHeader>
          <PopoverTitle>Gallery settings</PopoverTitle>
        </PopoverHeader>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="max-lanes-popover-slider">Maximum lanes</Label>
              <span className="text-muted-foreground text-base tabular-nums">
                {gridMaxLanes}
              </span>
            </div>
            <Slider
              id="max-lanes-popover-slider"
              value={[Math.min(gridMaxLanes, MAX_GRID_LANES)]}
              onValueChange={(value) => {
                const lanes = Array.isArray(value) ? value[0] : value;
                setGridMaxLanes(lanes);
              }}
              min={3}
              max={MAX_GRID_LANES}
              step={1}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="expand-images-popover-switch">
              Expand images to fill space
            </Label>
            <Switch
              id="expand-images-popover-switch"
              checked={gridExpandImages}
              onCheckedChange={setGridExpandImages}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
