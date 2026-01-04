import { SettingsGroup, SwitchField } from "./setting-fields";
import type { ImageBackground } from "@/stores/file-viewer-settings-store";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui-primitives/toggle-group";
import {
  useFileViewerSettingsActions,
  useFileViewerStartExpanded,
  useImageBackground,
} from "@/stores/file-viewer-settings-store";
import {
  useGalleryLinkImageBackground,
  useGallerySettingsActions,
} from "@/stores/gallery-settings-store";
import { Label } from "@/components/ui-primitives/label";

export const FILE_VIEWER_SETTINGS_TITLE = "Media viewer";

export interface FileViewerSettingsProps {
  idPrefix?: string;
}

export function FileViewerSettings({ idPrefix = "" }: FileViewerSettingsProps) {
  const fileViewerStartExpanded = useFileViewerStartExpanded();
  const imageBackground = useImageBackground();
  const { setStartExpanded, setImageBackground } =
    useFileViewerSettingsActions();

  // Sync with gallery when linked
  const linkImageBackground = useGalleryLinkImageBackground();
  const { setImageBackground: setGalleryImageBackground } =
    useGallerySettingsActions();

  const handleImageBackgroundChange = (value: ImageBackground) => {
    setImageBackground(value);
    if (linkImageBackground) {
      setGalleryImageBackground(value);
    }
  };

  return (
    <SettingsGroup>
      <SwitchField
        id={`${idPrefix}file-viewer-start-expanded-switch`}
        label="Open images expanded"
        checked={fileViewerStartExpanded}
        onCheckedChange={setStartExpanded}
      />
      <div className="flex flex-col gap-4">
        <Label>Image background</Label>
        <ToggleGroup
          value={[imageBackground]}
          onValueChange={(value) => {
            const newValue = value[0] as ImageBackground | undefined;
            if (newValue) handleImageBackgroundChange(newValue);
          }}
          variant="outline"
          size="sm"
          spacing={1}
          className="grid w-full grid-cols-2 gap-1"
        >
          <ToggleGroupItem value="solid">Solid</ToggleGroupItem>
          <ToggleGroupItem value="checkerboard">Checkerboard</ToggleGroupItem>
          <ToggleGroupItem value="average" className="col-span-2">
            Average from image
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </SettingsGroup>
  );
}
