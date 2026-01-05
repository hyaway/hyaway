import { SettingsGroup, SwitchField } from "./setting-fields";
import type { ImageBackground } from "@/stores/file-viewer-settings-store";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui-primitives/toggle-group";
import {
  useFileViewerSettingsActions,
  useFileViewerStartExpanded,
  useFillCanvasBackground,
  useImageBackground,
  useMediaAutoPlay,
  useMediaStartMuted,
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
  const fillCanvasBackground = useFillCanvasBackground();
  const mediaAutoPlay = useMediaAutoPlay();
  const mediaStartMuted = useMediaStartMuted();
  const {
    setStartExpanded,
    setImageBackground,
    setFillCanvasBackground,
    setMediaAutoPlay,
    setMediaStartMuted,
  } = useFileViewerSettingsActions();

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
        <SwitchField
          id={`${idPrefix}fill-canvas-background-switch`}
          label="Fill canvas with background"
          checked={fillCanvasBackground}
          onCheckedChange={setFillCanvasBackground}
        />
      </div>
      <div className="flex flex-col gap-4">
        <Label>Video &amp; Audio</Label>
        <SwitchField
          id={`${idPrefix}media-autoplay-switch`}
          label="Start automatically"
          checked={mediaAutoPlay}
          onCheckedChange={setMediaAutoPlay}
        />
        <SwitchField
          id={`${idPrefix}media-start-muted-switch`}
          label="Start muted"
          checked={mediaStartMuted}
          onCheckedChange={setMediaStartMuted}
        />
      </div>
    </SettingsGroup>
  );
}
