import { useSyncExternalStore } from "react";
import {
  AccordionSection,
  RangeSliderField,
  SliderField,
  SwitchField,
} from "./setting-fields";
import {
  MAX_GALLERY_BASE_WIDTH,
  MAX_GALLERY_GAP,
  MAX_GALLERY_LANES,
  MAX_GALLERY_REFLOW_DURATION,
  MIN_GALLERY_BASE_WIDTH,
  MIN_GALLERY_LANES,
  useGalleryBaseWidthMode,
  useGalleryCustomBaseWidth,
  useGalleryExpandImages,
  useGalleryHorizontalGap,
  useGalleryMaxLanes,
  useGalleryMinLanes,
  useGalleryReflowDuration,
  useGallerySettingsActions,
  useGalleryShowScrollBadge,
  useGalleryVerticalGap,
} from "@/stores/gallery-settings-store";
import { Accordion } from "@/components/ui-primitives/accordion";
import { Label } from "@/components/ui-primitives/label";
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
}

export function ThumbnailGalleryDisplaySettings({
  idPrefix = "",
  openMultiple = false,
  defaultOpen = true,
}: ThumbnailGalleryDisplaySettingsProps) {
  const windowWidth = useWindowWidth();
  const galleryMinLanes = useGalleryMinLanes();
  const galleryMaxLanes = useGalleryMaxLanes();
  const galleryExpandImages = useGalleryExpandImages();
  const galleryShowScrollBadge = useGalleryShowScrollBadge();
  const galleryBaseWidthMode = useGalleryBaseWidthMode();
  const galleryCustomBaseWidth = useGalleryCustomBaseWidth();
  const galleryHorizontalGap = useGalleryHorizontalGap();
  const galleryVerticalGap = useGalleryVerticalGap();
  const galleryReflowDuration = useGalleryReflowDuration();

  // Check if min lanes would overflow the window width
  const minLayoutWidth =
    galleryMinLanes * (galleryCustomBaseWidth + galleryHorizontalGap);
  const isColumnsDestructive = minLayoutWidth > windowWidth;

  const {
    setLanesRange,
    setExpandImages,
    setShowScrollBadge,
    setBaseWidthMode,
    setCustomBaseWidth,
    setHorizontalGap,
    setVerticalGap,
    setReflowDuration,
  } = useGallerySettingsActions();

  return (
    <Accordion
      multiple={openMultiple}
      defaultValue={defaultOpen ? ["layout"] : []}
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
      </AccordionSection>

      <AccordionSection value="indicators" title="Indicators">
        <SwitchField
          id={`${idPrefix}show-scroll-badge-switch`}
          label="Show scroll position"
          checked={galleryShowScrollBadge}
          onCheckedChange={setShowScrollBadge}
        />
      </AccordionSection>
    </Accordion>
  );
}
