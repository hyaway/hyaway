import type { ImageBackground } from "@/lib/ux-settings-store";
import {
  SettingsHeader,
  SettingsTitle,
} from "@/components/settings/settings-ui";
import {
  SettingsGroup,
  SwitchField,
} from "@/components/settings/setting-fields";
import { SettingsPopover } from "@/components/settings/settings-popover";
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

export function FileViewerSettingsContent() {
  const fileViewerStartExpanded = useFileViewerStartExpanded();
  const imageBackground = useImageBackground();
  const { setFileViewerStartExpanded, setImageBackground } =
    useUxSettingsActions();

  return (
    <>
      <SettingsHeader>
        <SettingsTitle>Media viewer</SettingsTitle>
      </SettingsHeader>
      <SettingsGroup>
        <SwitchField
          id="file-viewer-start-expanded-popover-switch"
          label="Start images expanded"
          checked={fileViewerStartExpanded}
          onCheckedChange={setFileViewerStartExpanded}
        />
        <div className="flex flex-col gap-2">
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
    </>
  );
}

export function FileViewerSettingsPopover({
  className,
}: {
  className?: string;
} = {}) {
  return (
    <SettingsPopover label="Settings" className={className}>
      <FileViewerSettingsContent />
    </SettingsPopover>
  );
}
