import { ImageGallerySettings } from "@/components/settings/image-gallery-settings";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui-primitives/card";

export function ImageGallerySettingsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Image gallery</CardTitle>
        <CardDescription>
          Configure how images are displayed in the gallery grid.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ImageGallerySettings />
      </CardContent>
    </Card>
  );
}
