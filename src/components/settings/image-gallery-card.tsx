import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui-primitives/card";
import { Label } from "@/components/ui-primitives/label";
import { Slider } from "@/components/ui-primitives/slider";
import { Switch } from "@/components/ui-primitives/switch";
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
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="max-lanes-slider">Maximum lanes</Label>
              <span className="text-muted-foreground text-base tabular-nums">
                {gridMaxLanes}
              </span>
            </div>
            <Slider
              id="max-lanes-slider"
              value={[Math.min(gridMaxLanes, MAX_GRID_LANES)]}
              onValueChange={(value) => {
                const lanes = Array.isArray(value) ? value[0] : value;
                setGridMaxLanes(lanes);
              }}
              min={3}
              max={MAX_GRID_LANES}
              step={1}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="expand-images-switch">
              Expand images to fill space
            </Label>
            <Switch
              id="expand-images-switch"
              checked={gridExpandImages}
              onCheckedChange={setGridExpandImages}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
