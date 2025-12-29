import { AdjustmentsHorizontalIcon } from "@heroicons/react/24/solid";
import { Button } from "@/components/ui-primitives/button";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui-primitives/popover";
import {
  SettingsGroup,
  SliderField,
  SwitchField,
} from "@/components/settings/setting-fields";
import {
  MAX_GRID_LANES,
  useGridExpandImages,
  useGridMaxLanes,
  useUxSettingsActions,
} from "@/lib/ux-settings-store";

export function ImageGallerySettingsContent() {
  const gridMaxLanes = useGridMaxLanes();
  const gridExpandImages = useGridExpandImages();
  const { setGridMaxLanes, setGridExpandImages } = useUxSettingsActions();

  return (
    <>
      <PopoverHeader>
        <PopoverTitle>Gallery settings</PopoverTitle>
      </PopoverHeader>
      <SettingsGroup>
        <SliderField
          id="max-lanes-popover-slider"
          label="Maximum lanes"
          value={gridMaxLanes}
          min={3}
          max={MAX_GRID_LANES}
          step={1}
          onValueChange={setGridMaxLanes}
        />
        <SwitchField
          id="expand-images-popover-switch"
          label="Expand images to fill remaining space at the end"
          checked={gridExpandImages}
          onCheckedChange={setGridExpandImages}
        />
      </SettingsGroup>
    </>
  );
}

export function ImageGallerySettingsPopover() {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="ghost" size="icon">
            <AdjustmentsHorizontalIcon />
            <span className="sr-only">Gallery settings</span>
          </Button>
        }
      />
      <PopoverContent align="end" className="w-80">
        <ImageGallerySettingsContent />
      </PopoverContent>
    </Popover>
  );
}
