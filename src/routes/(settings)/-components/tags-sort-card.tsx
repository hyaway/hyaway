import type { TagsSortMode } from "@/stores/tags-settings-store";
import { SettingsResetButton } from "@/components/settings/settings-ui";
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
import {
  useTagsSettingsActions,
  useTagsSortMode,
} from "@/stores/tags-settings-store";

export function TagsSortCard() {
  const tagsSortMode = useTagsSortMode();
  const { setSortMode, reset } = useTagsSettingsActions();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle>Tags sidebar</CardTitle>
          <SettingsResetButton onReset={reset} />
        </div>
        <CardDescription>
          Configure how tags are sorted in the sidebar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          <Label htmlFor="tags-sort-toggle">Sort tags by</Label>
          <ToggleGroup
            id="tags-sort-toggle"
            value={[tagsSortMode]}
            onValueChange={(value) => {
              const newValue = value[0] as TagsSortMode | undefined;
              if (newValue) {
                setSortMode(newValue);
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
