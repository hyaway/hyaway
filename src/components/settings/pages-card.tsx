import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui-primitives/card";
import { Label } from "@/components/ui-primitives/label";
import { Slider } from "@/components/ui-primitives/slider";
import {
  MAX_PAGES_COLUMNS,
  usePagesMaxColumns,
  useUxSettingsActions,
} from "@/lib/ux-settings-store";

export function PagesCard() {
  const pagesMaxColumns = usePagesMaxColumns();
  const { setPagesMaxColumns } = useUxSettingsActions();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pages</CardTitle>
        <CardDescription>
          Configure how page cards are displayed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="pages-columns-slider">Maximum columns</Label>
            <span className="text-muted-foreground text-base tabular-nums">
              {pagesMaxColumns}
            </span>
          </div>
          <Slider
            id="pages-columns-slider"
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
      </CardContent>
    </Card>
  );
}
