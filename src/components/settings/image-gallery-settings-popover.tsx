import {
  SettingsHeader,
  SettingsTitle,
} from "@/components/settings/settings-ui";
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
      <SettingsHeader>
        <SettingsTitle>Gallery view</SettingsTitle>
      </SettingsHeader>
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
    <SettingsPopover label="Settings">
      <ImageGallerySettingsContent />
    </SettingsPopover>
  );
}
