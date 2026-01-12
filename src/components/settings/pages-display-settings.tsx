import { useState } from "react";
import {
  AccordionSection,
  RangeSliderField,
  SliderField,
  SwitchField,
} from "./setting-fields";
import {
  MAX_PAGES_LANES,
  MAX_PAGE_CARD_GAP,
  MAX_PAGE_CARD_WIDTH,
  MIN_PAGES_LANES,
  MIN_PAGE_CARD_WIDTH,
  usePagesCardWidth,
  usePagesExpandCards,
  usePagesHorizontalGap,
  usePagesLastOpenSection,
  usePagesMaxLanes,
  usePagesMinLanes,
  usePagesSettingsActions,
  usePagesShowScrollBadge,
  usePagesVerticalGap,
} from "@/stores/pages-settings-store";
import { Accordion } from "@/components/ui-primitives/accordion";

export const PAGES_DISPLAY_SETTINGS_TITLE = "Pages display";

export interface PagesDisplaySettingsProps {
  idPrefix?: string;
  /** When true, allows multiple sections to be open at the same time */
  openMultiple?: boolean;
  /** When false, all accordion sections start collapsed */
  defaultOpen?: boolean;
}

export function PagesDisplaySettings({
  idPrefix = "",
  openMultiple = false,
  defaultOpen = false,
}: PagesDisplaySettingsProps) {
  const pagesMinLanes = usePagesMinLanes();
  const pagesMaxLanes = usePagesMaxLanes();
  const pagesShowScrollBadge = usePagesShowScrollBadge();
  const pagesCardWidth = usePagesCardWidth();
  const pagesHorizontalGap = usePagesHorizontalGap();
  const pagesVerticalGap = usePagesVerticalGap();
  const pagesExpandCards = usePagesExpandCards();
  const pagesLastOpenSection = usePagesLastOpenSection();
  const {
    setLanesRange,
    setShowScrollBadge,
    setCardWidth,
    setHorizontalGap,
    setVerticalGap,
    setExpandCards,
    setLastOpenSection,
  } = usePagesSettingsActions();

  // Track which section was last opened (only when not on settings page with multiple open)
  const [openSections, setOpenSections] = useState<Array<string>>(() =>
    defaultOpen ? [pagesLastOpenSection || "layout"] : [],
  );

  const handleAccordionChange = (value: Array<string>) => {
    setOpenSections(value);
    if (!openMultiple) {
      setLastOpenSection(value.length > 0 ? value[0] : "");
    }
  };

  return (
    <Accordion
      multiple={openMultiple}
      value={openSections}
      onValueChange={handleAccordionChange}
      className="rounded-none border-0"
    >
      <AccordionSection value="layout" title="Layout">
        <RangeSliderField
          id={`${idPrefix}pages-lanes-range-slider`}
          label="Columns"
          minValue={pagesMinLanes}
          maxValue={pagesMaxLanes}
          min={MIN_PAGES_LANES}
          max={MAX_PAGES_LANES}
          step={1}
          onValueChange={setLanesRange}
        />
        <SliderField
          id={`${idPrefix}pages-card-width-slider`}
          label="Card width"
          value={pagesCardWidth}
          min={MIN_PAGE_CARD_WIDTH}
          max={MAX_PAGE_CARD_WIDTH}
          step={8}
          onValueChange={setCardWidth}
          formatValue={(v) => `${v}px`}
        />
        <SwitchField
          id={`${idPrefix}expand-cards-switch`}
          label="Stretch cards to fill columns"
          checked={pagesExpandCards}
          onCheckedChange={setExpandCards}
        />
        <SwitchField
          id={`${idPrefix}show-scroll-badge-switch`}
          label="Show scroll position"
          checked={pagesShowScrollBadge}
          onCheckedChange={setShowScrollBadge}
        />
      </AccordionSection>

      <AccordionSection value="spacing" title="Spacing">
        <SliderField
          id={`${idPrefix}pages-horizontal-gap-slider`}
          label="Between columns"
          value={pagesHorizontalGap}
          min={0}
          max={MAX_PAGE_CARD_GAP}
          step={2}
          onValueChange={setHorizontalGap}
          formatValue={(v) => `${v}px`}
        />
        <SliderField
          id={`${idPrefix}pages-vertical-gap-slider`}
          label="Between rows"
          value={pagesVerticalGap}
          min={0}
          max={MAX_PAGE_CARD_GAP}
          step={2}
          onValueChange={setVerticalGap}
          formatValue={(v) => `${v}px`}
        />
      </AccordionSection>
    </Accordion>
  );
}
