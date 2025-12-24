import { createFileRoute } from "@tanstack/react-router";
import type { TagsSortMode } from "@/lib/ux-settings-store";
import type { Theme } from "@/lib/theme-store";
import { Heading } from "@/components/ui-primitives/heading";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui-primitives/card";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui-primitives/toggle-group";
import { Label } from "@/components/ui-primitives/label";
import { Slider } from "@/components/ui-primitives/slider";
import { Switch } from "@/components/ui-primitives/switch";
import {
  MAX_GRID_LANES,
  MAX_PAGES_COLUMNS,
  useGridExpandImages,
  useGridMaxLanes,
  usePagesMaxColumns,
  useTagsSortMode,
  useUxSettingsActions,
} from "@/lib/ux-settings-store";
import { useThemeActions, useThemePreference } from "@/lib/theme-store";

export const Route = createFileRoute("/settings/ux")({
  component: SettingsUXComponent,
  beforeLoad: () => ({
    getTitle: () => "UX settings",
  }),
});

function SettingsUXComponent() {
  return (
    <div className="flex max-w-xl flex-col gap-4">
      <Heading level={2} className="sr-only">
        UX Settings
      </Heading>
      <ThemeCard />
      <ImageGalleryCard />
      <PagesCard />
      <TagsSortCard />
    </div>
  );
}

function ThemeCard() {
  const themePreference = useThemePreference();
  const { setThemePreference } = useThemeActions();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Theme</CardTitle>
        <CardDescription>
          Choose your preferred color scheme for the application.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          <Label htmlFor="theme-toggle">Color scheme</Label>
          <ToggleGroup
            id="theme-toggle"
            value={[themePreference]}
            onValueChange={(value) => {
              const newValue = value[0] as Theme | undefined;
              if (newValue) {
                setThemePreference(newValue);
              }
            }}
            variant="outline"
          >
            <ToggleGroupItem value="light">Light</ToggleGroupItem>
            <ToggleGroupItem value="dark">Dark</ToggleGroupItem>
            <ToggleGroupItem value="system">System</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </CardContent>
    </Card>
  );
}

function ImageGalleryCard() {
  const gridMaxLanes = useGridMaxLanes();
  const gridExpandImages = useGridExpandImages();
  const { setGridMaxLanes, setGridExpandImages } = useUxSettingsActions();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Image gallery</CardTitle>
        <CardDescription>
          Configure how images are displayed in the gallery grid.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="max-lanes-slider">Maximum lanes</Label>
              <span className="text-muted-foreground text-base tabular-nums">
                {gridMaxLanes}
              </span>
            </div>
            <Slider
              id="max-lanes-slider"
              value={[Math.min(gridMaxLanes, MAX_GRID_LANES)]}
              onValueChange={(value) => {
                const lanes = Array.isArray(value) ? value[0] : value;
                setGridMaxLanes(lanes);
              }}
              min={3}
              max={MAX_GRID_LANES}
              step={1}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="expand-images-switch">
              Expand images to fill space
            </Label>
            <Switch
              id="expand-images-switch"
              checked={gridExpandImages}
              onCheckedChange={setGridExpandImages}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PagesCard() {
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

function TagsSortCard() {
  const tagsSortMode = useTagsSortMode();
  const { setTagsSortMode } = useUxSettingsActions();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tags sidebar</CardTitle>
        <CardDescription>
          Configure how tags are sorted in the sidebar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          <Label htmlFor="tags-sort-toggle">Sort tags by</Label>
          <ToggleGroup
            id="tags-sort-toggle"
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
      </CardContent>
    </Card>
  );
}
