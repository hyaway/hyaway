import { SettingsGroup, SliderField, SwitchField } from "./setting-fields";
import {
  MAX_GALLERY_LANES,
  useGalleryExpandImages,
  useGalleryMaxLanes,
  useGalleryShowScrollBadge,
  useSettingsActions,
} from "@/lib/settings-store";

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
  } = useSettingsActions();

  return (
    <SettingsGroup>
      <SliderField
        id={`${idPrefix}max-lanes-slider`}
        label="Maximum lanes"
        value={galleryMaxLanes}
        min={1}
        max={MAX_GALLERY_LANES}
        step={1}
        onValueChange={setGalleryMaxLanes}
      />
      <SwitchField
        id={`${idPrefix}expand-images-switch`}
        label="Grow thumbnails horizontally"
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
