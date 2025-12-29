import {
  PopoverHeader,
  PopoverTitle,
} from "@/components/ui-primitives/popover";
import {
  SettingsGroup,
  SliderField,
  SwitchField,
} from "@/components/settings/setting-fields";
import { SettingsPopover } from "@/components/settings/settings-popover";
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

export function ImageGallerySettingsPopover({
  size,
}: {
  size?: "default" | "xl";
} = {}) {
  return (
    <SettingsPopover label="Gallery settings" size={size}>
      <ImageGallerySettingsContent />
    </SettingsPopover>
  );
}
