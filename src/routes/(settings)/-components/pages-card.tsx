import { SliderField } from "@/components/settings/setting-fields";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui-primitives/card";
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
        <SliderField
          id="pages-columns-slider"
          label="Maximum columns"
          value={pagesMaxColumns}
          min={3}
          max={MAX_PAGES_COLUMNS}
          step={1}
          onValueChange={setPagesMaxColumns}
        />
      </CardContent>
    </Card>
  );
}
