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
import { Label } from "@/components/ui-primitives/label";
import { Slider } from "@/components/ui-primitives/slider";
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
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="pages-columns-popover-slider">
              Maximum columns
            </Label>
            <span className="text-muted-foreground text-base tabular-nums">
              {pagesMaxColumns}
            </span>
          </div>
          <Slider
            id="pages-columns-popover-slider"
            value={[Math.min(pagesMaxColumns, MAX_PAGES_COLUMNS)]}
            onValueChange={(value) => {
              const columns = Array.isArray(value) ? value[0] : value;
              setPagesMaxColumns(columns);
            }}
            min={3}
            max={MAX_PAGES_COLUMNS}
            step={1}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
