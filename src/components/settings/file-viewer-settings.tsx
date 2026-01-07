import { AccordionSection, SwitchField } from "./setting-fields";
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
  useMediaStartWithSound,
  useVideoStartExpanded,
} from "@/stores/file-viewer-settings-store";
import {
  useGalleryLinkImageBackground,
  useGallerySettingsActions,
} from "@/stores/gallery-settings-store";
import { Accordion } from "@/components/ui-primitives/accordion";
import { Label } from "@/components/ui-primitives/label";

export const FILE_VIEWER_SETTINGS_TITLE = "Media viewer";

export interface FileViewerSettingsProps {
  idPrefix?: string;
  /** When true, allows multiple sections to be open at the same time */
  openMultiple?: boolean;
  /** When false, all accordion sections start collapsed */
  defaultOpen?: boolean;
  /** Mime type of the current file - determines which section opens by default */
  mimeType?: string;
}

/** Determine which section should open based on mime type */
function getDefaultSection(mimeType?: string): string {
  if (!mimeType) return "image";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/") || mimeType.startsWith("audio/")) {
    return "video-audio";
  }
  return "image";
}

export function FileViewerSettings({
  idPrefix = "",
  openMultiple = false,
  defaultOpen = false,
  mimeType,
}: FileViewerSettingsProps) {
  const fileViewerStartExpanded = useFileViewerStartExpanded();
  const imageBackground = useImageBackground();
  const fillCanvasBackground = useFillCanvasBackground();
  const videoStartExpanded = useVideoStartExpanded();
  const mediaAutoPlay = useMediaAutoPlay();
  const mediaStartWithSound = useMediaStartWithSound();
  const {
    setStartExpanded,
    setImageBackground,
    setFillCanvasBackground,
    setVideoStartExpanded,
    setMediaAutoPlay,
    setMediaStartWithSound,
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
    <Accordion
      multiple={openMultiple}
      defaultValue={defaultOpen ? [getDefaultSection(mimeType)] : []}
      className="rounded-none border-0"
    >
      <AccordionSection value="image" title="Image">
        <SwitchField
          id={`${idPrefix}file-viewer-start-expanded-switch`}
          label="Open images expanded"
          checked={fileViewerStartExpanded}
          onCheckedChange={setStartExpanded}
        />
        <div className="flex flex-col gap-4">
          <Label>Background</Label>
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
      </AccordionSection>

      <AccordionSection value="video-audio" title="Video &amp; Audio">
        <SwitchField
          id={`${idPrefix}video-start-expanded-switch`}
          label="Open videos expanded"
          checked={videoStartExpanded}
          onCheckedChange={setVideoStartExpanded}
        />
        <SwitchField
          id={`${idPrefix}media-autoplay-switch`}
          label="Start automatically"
          checked={mediaAutoPlay}
          onCheckedChange={setMediaAutoPlay}
        />
        <SwitchField
          id={`${idPrefix}media-start-with-sound-switch`}
          label="Start with sound"
          checked={mediaStartWithSound}
          onCheckedChange={setMediaStartWithSound}
        />
      </AccordionSection>
    </Accordion>
  );
}
