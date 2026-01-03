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
  useGalleryShowScrollBadge,
  useGalleryVerticalGap,
  useSettingsActions,
} from "@/lib/settings-store";
import { Accordion } from "@/components/ui-primitives/accordion";
import { Label } from "@/components/ui-primitives/label";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui-primitives/toggle-group";

export const THUMBNAIL_GALLERY_DISPLAY_SETTINGS_TITLE =
  "Thumbnail gallery display";

export interface ThumbnailGalleryDisplaySettingsProps {
  idPrefix?: string;
  /** When true, allows multiple sections to be open at the same time */
  openMultiple?: boolean;
}

export function ThumbnailGalleryDisplaySettings({
  idPrefix = "",
  openMultiple = false,
}: ThumbnailGalleryDisplaySettingsProps) {
  const galleryMinLanes = useGalleryMinLanes();
  const galleryMaxLanes = useGalleryMaxLanes();
  const galleryExpandImages = useGalleryExpandImages();
  const galleryShowScrollBadge = useGalleryShowScrollBadge();
  const galleryBaseWidthMode = useGalleryBaseWidthMode();
  const galleryCustomBaseWidth = useGalleryCustomBaseWidth();
  const galleryHorizontalGap = useGalleryHorizontalGap();
  const galleryVerticalGap = useGalleryVerticalGap();
  const galleryReflowDuration = useGalleryReflowDuration();

  const {
    setGalleryLanesRange,
    setGalleryExpandImages,
    setGalleryShowScrollBadge,
    setGalleryBaseWidthMode,
    setGalleryCustomBaseWidth,
    setGalleryHorizontalGap,
    setGalleryVerticalGap,
    setGalleryReflowDuration,
  } = useSettingsActions();

  return (
    <Accordion
      multiple={openMultiple}
      defaultValue={["layout"]}
      className="rounded-none border-0"
    >
      <AccordionSection value="layout" title="Layout">
        <RangeSliderField
          id={`${idPrefix}lanes-range-slider`}
          label="Lane count range"
          minValue={galleryMinLanes}
          maxValue={galleryMaxLanes}
          min={MIN_GALLERY_LANES}
          max={MAX_GALLERY_LANES}
          step={1}
          onValueChange={setGalleryLanesRange}
        />
        <SwitchField
          id={`${idPrefix}expand-images-switch`}
          label="Grow thumbnails horizontally"
          checked={galleryExpandImages}
          onCheckedChange={setGalleryExpandImages}
        />
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Label>Base thumbnail width</Label>
            <ToggleGroup
              value={[galleryBaseWidthMode]}
              onValueChange={(values) => {
                const value = values[0];
                if (value === "service" || value === "custom") {
                  setGalleryBaseWidthMode(value);
                }
              }}
              variant="outline"
              size="sm"
            >
              <ToggleGroupItem value="service">Service</ToggleGroupItem>
              <ToggleGroupItem value="custom">Custom</ToggleGroupItem>
            </ToggleGroup>
          </div>
          {galleryBaseWidthMode === "custom" && (
            <SliderField
              id={`${idPrefix}custom-base-width-slider`}
              label="Custom width"
              value={galleryCustomBaseWidth}
              min={MIN_GALLERY_BASE_WIDTH}
              max={MAX_GALLERY_BASE_WIDTH}
              step={10}
              onValueChange={setGalleryCustomBaseWidth}
              formatValue={(v) => `${v}px`}
            />
          )}
        </div>
      </AccordionSection>

      <AccordionSection value="spacing" title="Spacing">
        <SliderField
          id={`${idPrefix}horizontal-gap-slider`}
          label="Horizontal gap"
          value={galleryHorizontalGap}
          min={0}
          max={MAX_GALLERY_GAP}
          step={1}
          onValueChange={setGalleryHorizontalGap}
          formatValue={(v) => `${v}px`}
        />
        <SliderField
          id={`${idPrefix}vertical-gap-slider`}
          label="Vertical gap"
          value={galleryVerticalGap}
          min={0}
          max={MAX_GALLERY_GAP}
          step={1}
          onValueChange={setGalleryVerticalGap}
          formatValue={(v) => `${v}px`}
        />
      </AccordionSection>

      <AccordionSection value="animation" title="Animation">
        <SliderField
          id={`${idPrefix}reflow-duration-slider`}
          label="Reflow duration"
          value={galleryReflowDuration}
          min={0}
          max={MAX_GALLERY_REFLOW_DURATION}
          step={50}
          onValueChange={setGalleryReflowDuration}
          formatValue={(v) => (v === 0 ? "Off" : `${v}ms`)}
        />
      </AccordionSection>

      <AccordionSection value="badge" title="Badge">
        <SwitchField
          id={`${idPrefix}show-scroll-badge-switch`}
          label="Show scroll position badge"
          checked={galleryShowScrollBadge}
          onCheckedChange={setGalleryShowScrollBadge}
        />
      </AccordionSection>
    </Accordion>
  );
}
