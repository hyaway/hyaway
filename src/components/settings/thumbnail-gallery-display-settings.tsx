import { SettingsGroup, SliderField, SwitchField } from "./setting-fields";
import {
  MAX_GRID_LANES,
  useGridExpandImages,
  useGridMaxLanes,
  useGridShowScrollBadge,
  useUxSettingsActions,
} from "@/lib/ux-settings-store";

export const THUMBNAIL_GALLERY_DISPLAY_SETTINGS_TITLE =
  "Thumbnail gallery display";

export interface ThumbnailGalleryDisplaySettingsProps {
  idPrefix?: string;
}

export function ThumbnailGalleryDisplaySettings({
  idPrefix = "",
}: ThumbnailGalleryDisplaySettingsProps) {
  const gridMaxLanes = useGridMaxLanes();
  const gridExpandImages = useGridExpandImages();
  const gridShowScrollBadge = useGridShowScrollBadge();
  const { setGridMaxLanes, setGridExpandImages, setGridShowScrollBadge } =
    useUxSettingsActions();

  return (
    <SettingsGroup>
      <SliderField
        id={`${idPrefix}max-lanes-slider`}
        label="Maximum lanes"
        value={gridMaxLanes}
        min={3}
        max={MAX_GRID_LANES}
        step={1}
        onValueChange={setGridMaxLanes}
      />
      <SwitchField
        id={`${idPrefix}expand-images-switch`}
        label="Expand images to fill remaining space at the end"
        checked={gridExpandImages}
        onCheckedChange={setGridExpandImages}
      />
      <SwitchField
        id={`${idPrefix}show-scroll-badge-switch`}
        label="Show scroll position badge"
        checked={gridShowScrollBadge}
        onCheckedChange={setGridShowScrollBadge}
      />
    </SettingsGroup>
  );
}
