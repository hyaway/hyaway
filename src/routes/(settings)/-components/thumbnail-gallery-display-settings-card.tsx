import {
  THUMBNAIL_GALLERY_DISPLAY_SETTINGS_TITLE,
  ThumbnailGalleryDisplaySettings,
} from "@/components/settings/thumbnail-gallery-display-settings";
import { SettingsResetButton } from "@/components/settings/settings-ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui-primitives/card";
import { useGallerySettingsActions } from "@/stores/gallery-settings-store";

export function ThumbnailGalleryDisplaySettingsCard() {
  const { reset } = useGallerySettingsActions();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle>{THUMBNAIL_GALLERY_DISPLAY_SETTINGS_TITLE}</CardTitle>
          <SettingsResetButton onReset={reset} />
        </div>
        <CardDescription>
          Configure how images are displayed in the gallery grid.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ThumbnailGalleryDisplaySettings openMultiple settingsPage />
      </CardContent>
    </Card>
  );
}
