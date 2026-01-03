import {
  THUMBNAIL_GALLERY_DISPLAY_SETTINGS_TITLE,
  ThumbnailGalleryDisplaySettings,
} from "@/components/settings/thumbnail-gallery-display-settings";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui-primitives/card";

export function ThumbnailGalleryDisplaySettingsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{THUMBNAIL_GALLERY_DISPLAY_SETTINGS_TITLE}</CardTitle>
        <CardDescription>
          Configure how images are displayed in the gallery grid.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ThumbnailGalleryDisplaySettings openMultiple />
      </CardContent>
    </Card>
  );
}
