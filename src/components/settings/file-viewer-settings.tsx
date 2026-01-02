import { SettingsGroup, SwitchField } from "./setting-fields";
import type { ImageBackground } from "@/lib/ux-settings-store";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui-primitives/toggle-group";
import {
  useFileViewerStartExpanded,
  useImageBackground,
  useSettingsActions,
} from "@/lib/ux-settings-store";
import { Label } from "@/components/ui-primitives/label";

export const FILE_VIEWER_SETTINGS_TITLE = "Media viewer";

export interface FileViewerSettingsProps {
  idPrefix?: string;
}

export function FileViewerSettings({ idPrefix = "" }: FileViewerSettingsProps) {
  const fileViewerStartExpanded = useFileViewerStartExpanded();
  const imageBackground = useImageBackground();
  const { setFileViewerStartExpanded, setImageBackground } =
    useSettingsActions();

  return (
    <SettingsGroup>
      <SwitchField
        id={`${idPrefix}file-viewer-start-expanded-switch`}
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
  );
}
