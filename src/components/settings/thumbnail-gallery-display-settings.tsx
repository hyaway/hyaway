import { SettingsGroup, SliderField, SwitchField } from "./setting-fields";
import {
  MAX_GALLERY_LANES,
  useGalleryExpandImages,
  useGalleryMaxLanes,
  useGalleryShowScrollBadge,
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
  const galleryMaxLanes = useGalleryMaxLanes();
  const galleryExpandImages = useGalleryExpandImages();
  const galleryShowScrollBadge = useGalleryShowScrollBadge();
  const {
    setGalleryMaxLanes,
    setGalleryExpandImages,
    setGalleryShowScrollBadge,
  } = useUxSettingsActions();

  return (
    <SettingsGroup>
      <SliderField
        id={`${idPrefix}max-lanes-slider`}
        label="Maximum lanes"
        value={galleryMaxLanes}
        min={3}
        max={MAX_GALLERY_LANES}
        step={1}
        onValueChange={setGalleryMaxLanes}
      />
      <SwitchField
        id={`${idPrefix}expand-images-switch`}
        label="Expand images to fill remaining space at the end"
        checked={galleryExpandImages}
        onCheckedChange={setGalleryExpandImages}
      />
      <SwitchField
        id={`${idPrefix}show-scroll-badge-switch`}
        label="Show scroll position badge"
        checked={galleryShowScrollBadge}
        onCheckedChange={setGalleryShowScrollBadge}
      />
    </SettingsGroup>
  );
}
