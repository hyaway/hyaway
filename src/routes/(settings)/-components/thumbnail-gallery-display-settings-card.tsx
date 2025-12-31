import { ThumbnailGalleryDisplaySettings } from "@/components/settings/thumbnail-gallery-display-settings";
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
        <CardTitle>Thumbnail gallery display</CardTitle>
        <CardDescription>
          Configure how images are displayed in the gallery grid.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ThumbnailGalleryDisplaySettings />
      </CardContent>
    </Card>
  );
}
