import { Settings01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui-primitives/button";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui-primitives/popover";
import { SliderField } from "@/components/settings/setting-fields";
import {
  MAX_PAGES_COLUMNS,
  usePagesMaxColumns,
  useUxSettingsActions,
} from "@/lib/ux-settings-store";

export function PagesSettingsPopover() {
  const pagesMaxColumns = usePagesMaxColumns();
  const { setPagesMaxColumns } = useUxSettingsActions();

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="ghost" size="icon">
            <HugeiconsIcon icon={Settings01Icon} />
            <span className="sr-only">Page settings</span>
          </Button>
        }
      />
      <PopoverContent align="end" className="w-80">
        <PopoverHeader>
          <PopoverTitle>Pages settings</PopoverTitle>
        </PopoverHeader>
        <SliderField
          id="pages-columns-popover-slider"
          label="Maximum columns"
          value={pagesMaxColumns}
          min={3}
          max={MAX_PAGES_COLUMNS}
          step={1}
          onValueChange={setPagesMaxColumns}
        />
      </PopoverContent>
    </Popover>
  );
}
