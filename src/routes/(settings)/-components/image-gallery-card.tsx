import {
  SettingsGroup,
  SliderField,
  SwitchField,
} from "@/components/settings/setting-fields";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui-primitives/card";
import {
  MAX_GRID_LANES,
  useGridExpandImages,
  useGridMaxLanes,
  useUxSettingsActions,
} from "@/lib/ux-settings-store";

export function ImageGalleryCard() {
  const gridMaxLanes = useGridMaxLanes();
  const gridExpandImages = useGridExpandImages();
  const { setGridMaxLanes, setGridExpandImages } = useUxSettingsActions();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Image gallery</CardTitle>
        <CardDescription>
          Configure how images are displayed in the gallery grid.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SettingsGroup>
          <SliderField
            id="max-lanes-slider"
            label="Maximum lanes"
            value={gridMaxLanes}
            min={3}
            max={MAX_GRID_LANES}
            step={1}
            onValueChange={setGridMaxLanes}
          />
          <SwitchField
            id="expand-images-switch"
            label="Expand images to fill remaining space at the end"
            checked={gridExpandImages}
            onCheckedChange={setGridExpandImages}
          />
        </SettingsGroup>
      </CardContent>
    </Card>
  );
}
