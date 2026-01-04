import { useSyncExternalStore } from "react";
import {
  AccordionSection,
  RangeSliderField,
  SliderField,
  SwitchField,
} from "./setting-fields";
import type { ImageBackground } from "@/stores/file-viewer-settings-store";
import type { TagsSortMode } from "@/stores/tags-settings-store";
import {
  MAX_GALLERY_BASE_WIDTH,
  MAX_GALLERY_ENTRY_DURATION,
  MAX_GALLERY_GAP,
  MAX_GALLERY_HOVER_SCALE_DURATION,
  MAX_GALLERY_LANES,
  MAX_GALLERY_REFLOW_DURATION,
  MIN_GALLERY_BASE_WIDTH,
  MIN_GALLERY_LANES,
  useGalleryBaseWidthMode,
  useGalleryCustomBaseWidth,
  useGalleryEnableContextMenu,
  useGalleryEntryDuration,
  useGalleryExpandImages,
  useGalleryHorizontalGap,
  useGalleryHoverZoomDuration,
  useGalleryImageBackground,
  useGalleryLastOpenSection,
  useGalleryLinkImageBackground,
  useGalleryMaxLanes,
  useGalleryMinLanes,
  useGalleryReflowDuration,
  useGallerySettingsActions,
  useGalleryShowScrollBadge,
  useGalleryVerticalGap,
} from "@/stores/gallery-settings-store";
import {
  useFileViewerSettingsActions,
  useImageBackground,
} from "@/stores/file-viewer-settings-store";
import {
  useTagsSettingsActions,
  useTagsSortMode,
} from "@/stores/tags-settings-store";
import { Accordion } from "@/components/ui-primitives/accordion";
import { Label } from "@/components/ui-primitives/label";
import { Switch } from "@/components/ui-primitives/switch";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui-primitives/toggle-group";

function subscribeToWindowSize(callback: () => void) {
  window.addEventListener("resize", callback);
  return () => window.removeEventListener("resize", callback);
}

function getWindowWidth() {
  return window.innerWidth;
}

function useWindowWidth() {
  return useSyncExternalStore(subscribeToWindowSize, getWindowWidth);
}

export const THUMBNAIL_GALLERY_DISPLAY_SETTINGS_TITLE = "Thumbnail gallery";

export interface ThumbnailGalleryDisplaySettingsProps {
  idPrefix?: string;
  /** When true, allows multiple sections to be open at the same time */
  openMultiple?: boolean;
  /** When false, all accordion sections start collapsed */
  defaultOpen?: boolean;
  /** When true, styles the settings for use on a settings page */
  settingsPage?: boolean;
}

export function ThumbnailGalleryDisplaySettings({
  idPrefix = "",
  openMultiple = false,
  defaultOpen = true,
  settingsPage = false,
}: ThumbnailGalleryDisplaySettingsProps) {
  const windowWidth = useWindowWidth();
  const galleryMinLanes = useGalleryMinLanes();
  const galleryMaxLanes = useGalleryMaxLanes();
  const galleryExpandImages = useGalleryExpandImages();
  const galleryShowScrollBadge = useGalleryShowScrollBadge();
  const galleryEnableContextMenu = useGalleryEnableContextMenu();
  const galleryBaseWidthMode = useGalleryBaseWidthMode();
  const galleryCustomBaseWidth = useGalleryCustomBaseWidth();
  const galleryHorizontalGap = useGalleryHorizontalGap();
  const galleryVerticalGap = useGalleryVerticalGap();
  const galleryReflowDuration = useGalleryReflowDuration();
  const galleryEntryDuration = useGalleryEntryDuration();
  const galleryHoverZoomDuration = useGalleryHoverZoomDuration();
  const galleryImageBackground = useGalleryImageBackground();
  const galleryLinkImageBackground = useGalleryLinkImageBackground();
  const galleryLastOpenSection = useGalleryLastOpenSection();
  const fileViewerImageBackground = useImageBackground();
  const tagsSortMode = useTagsSortMode();
  const { setImageBackground: setFileViewerImageBackground } =
    useFileViewerSettingsActions();
  const { setSortMode: setTagsSortMode } = useTagsSettingsActions();

  // Check if min lanes would overflow the window width
  const minLayoutWidth =
    galleryMinLanes * (galleryCustomBaseWidth + galleryHorizontalGap);
  const isColumnsDestructive = minLayoutWidth > windowWidth;

  const {
    setLanesRange,
    setExpandImages,
    setShowScrollBadge,
    setEnableContextMenu,
    setBaseWidthMode,
    setCustomBaseWidth,
    setHorizontalGap,
    setVerticalGap,
    setReflowDuration,
    setEntryDuration,
    setHoverZoomDuration,
    setImageBackground: setGalleryImageBackground,
    setLinkImageBackground,
    setLastOpenSection,
  } = useGallerySettingsActions();

  // When linked, changing gallery background also updates file viewer background
  const handleImageBackgroundChange = (value: ImageBackground) => {
    setGalleryImageBackground(value);
    if (galleryLinkImageBackground) {
      setFileViewerImageBackground(value);
    }
  };

  // When enabling link, sync gallery background to file viewer
  const handleLinkChange = (linked: boolean) => {
    setLinkImageBackground(linked);
    if (linked) {
      setFileViewerImageBackground(galleryImageBackground);
    }
  };

  // Determine which background to show (use file viewer's when linked)
  const effectiveBackground = galleryLinkImageBackground
    ? fileViewerImageBackground
    : galleryImageBackground;

  // Track which section was last opened (only when not on settings page with multiple open)
  const handleAccordionChange = (value: Array<string>) => {
    if (!openMultiple && value.length > 0) {
      setLastOpenSection(value[0]);
    }
  };

  return (
    <Accordion
      multiple={openMultiple}
      defaultValue={defaultOpen ? [galleryLastOpenSection] : []}
      onValueChange={handleAccordionChange}
      className="rounded-none border-0"
    >
      <AccordionSection value="layout" title="Layout">
        <RangeSliderField
          id={`${idPrefix}lanes-range-slider`}
          label={`Columns ${isColumnsDestructive ? "(will shrink)" : ""}`}
          minValue={galleryMinLanes}
          maxValue={galleryMaxLanes}
          min={MIN_GALLERY_LANES}
          max={MAX_GALLERY_LANES}
          step={1}
          onValueChange={setLanesRange}
          isDestructive={isColumnsDestructive}
        />

        <SwitchField
          id={`${idPrefix}expand-images-switch`}
          label="Stretch thumbnails to fill columns"
          checked={galleryExpandImages}
          onCheckedChange={setExpandImages}
        />
        <SwitchField
          id={`${idPrefix}show-scroll-badge-switch`}
          label="Show scroll position"
          checked={galleryShowScrollBadge}
          onCheckedChange={setShowScrollBadge}
        />
      </AccordionSection>

      <AccordionSection value="spacing" title="Spacing">
        <SliderField
          id={`${idPrefix}horizontal-gap-slider`}
          label="Between columns"
          value={galleryHorizontalGap}
          min={0}
          max={MAX_GALLERY_GAP}
          step={1}
          onValueChange={setHorizontalGap}
          formatValue={(v) => `${v}px`}
        />
        <SliderField
          id={`${idPrefix}vertical-gap-slider`}
          label="Between rows"
          value={galleryVerticalGap}
          min={0}
          max={MAX_GALLERY_GAP}
          step={1}
          onValueChange={setVerticalGap}
          formatValue={(v) => `${v}px`}
        />
      </AccordionSection>

      <AccordionSection value="animation" title="Animation">
        <SliderField
          id={`${idPrefix}reflow-duration-slider`}
          label="Layout transition"
          value={galleryReflowDuration}
          min={0}
          max={MAX_GALLERY_REFLOW_DURATION}
          step={50}
          onValueChange={setReflowDuration}
          formatValue={(v) => (v === 0 ? "Off" : `${v}ms`)}
        />
        <SliderField
          id={`${idPrefix}entry-duration-slider`}
          label="Entry animation"
          value={galleryEntryDuration}
          min={0}
          max={MAX_GALLERY_ENTRY_DURATION}
          step={50}
          onValueChange={setEntryDuration}
          formatValue={(v) => (v === 0 ? "Off" : `${v}ms`)}
        />
        <SliderField
          id={`${idPrefix}hover-scale-duration-slider`}
          label="Hover zoom"
          value={galleryHoverZoomDuration}
          min={0}
          max={MAX_GALLERY_HOVER_SCALE_DURATION}
          step={25}
          onValueChange={setHoverZoomDuration}
          formatValue={(v) => (v === 0 ? "Off" : `${v}ms`)}
        />
      </AccordionSection>

      <AccordionSection value="thumbnails" title="Thumbnails">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Label>Image background</Label>
            {settingsPage && (
              <label className="text-muted-foreground flex cursor-pointer items-center gap-2 text-sm">
                <Switch
                  checked={galleryLinkImageBackground}
                  onCheckedChange={handleLinkChange}
                />
                Sync with viewer
              </label>
            )}
          </div>
          <ToggleGroup
            value={[effectiveBackground]}
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
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Label>Thumbnail size</Label>
            <ToggleGroup
              value={[galleryBaseWidthMode]}
              onValueChange={(values) => {
                const value = values[0];
                if (value === "service" || value === "custom") {
                  setBaseWidthMode(value);
                }
              }}
              variant="outline"
              size="sm"
            >
              <ToggleGroupItem value="service">Hydrus</ToggleGroupItem>
              <ToggleGroupItem value="custom">Custom</ToggleGroupItem>
            </ToggleGroup>
          </div>
          {galleryBaseWidthMode === "custom" && (
            <SliderField
              id={`${idPrefix}custom-base-width-slider`}
              label="Width"
              value={galleryCustomBaseWidth}
              min={MIN_GALLERY_BASE_WIDTH}
              max={MAX_GALLERY_BASE_WIDTH}
              step={10}
              onValueChange={setCustomBaseWidth}
              formatValue={(v) => `${v}px`}
            />
          )}
        </div>
        <SwitchField
          id={`${idPrefix}show-context-menu-switch`}
          label="Show context menu on right-click"
          checked={galleryEnableContextMenu}
          onCheckedChange={setEnableContextMenu}
        />
      </AccordionSection>

      <AccordionSection value="tags" title="Tags sidebar">
        <div className="flex flex-col gap-3">
          <Label htmlFor={`${idPrefix}tags-sort-toggle`}>Sort tags by</Label>
          <ToggleGroup
            id={`${idPrefix}tags-sort-toggle`}
            value={[tagsSortMode]}
            onValueChange={(value) => {
              const newValue = value[0] as TagsSortMode | undefined;
              if (newValue) {
                setTagsSortMode(newValue);
              }
            }}
            variant="outline"
          >
            <ToggleGroupItem value="count">Count</ToggleGroupItem>
            <ToggleGroupItem value="namespace">Namespace</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </AccordionSection>
    </Accordion>
  );
}
