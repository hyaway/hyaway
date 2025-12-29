import type { ImageBackground } from "@/lib/ux-settings-store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui-primitives/card";
import {
  SettingsGroup,
  SwitchField,
} from "@/components/settings/setting-fields";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui-primitives/toggle-group";
import {
  useFileViewerStartExpanded,
  useImageBackground,
  useUxSettingsActions,
} from "@/lib/ux-settings-store";
import { Label } from "@/components/ui-primitives/label";

export function FileViewerCard() {
  const fileViewerStartExpanded = useFileViewerStartExpanded();
  const imageBackground = useImageBackground();
  const { setFileViewerStartExpanded, setImageBackground } =
    useUxSettingsActions();

  return (
    <Card>
      <CardHeader>
        <CardTitle>File viewer</CardTitle>
        <CardDescription>
          Configure how the file viewer is displayed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SettingsGroup>
          <SwitchField
            id="file-viewer-start-expanded-switch"
            label="Start images expanded"
            checked={fileViewerStartExpanded}
            onCheckedChange={setFileViewerStartExpanded}
          />
          <div className="flex flex-col gap-3">
            <Label>Image background</Label>
            <ToggleGroup
              value={[imageBackground]}
              onValueChange={(value) => {
                const newValue = value[0] as ImageBackground | undefined;
                if (newValue) setImageBackground(newValue);
              }}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <ToggleGroupItem value="solid" className="flex-1">
                Solid
              </ToggleGroupItem>
              <ToggleGroupItem value="checkerboard" className="flex-1">
                Checkerboard
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </SettingsGroup>
      </CardContent>
    </Card>
  );
}
