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
import { useTagsSortMode, useUxSettingsActions } from "@/lib/ux-settings-store";
import { useThemeActions, useThemePreference } from "@/lib/theme-store";

export const Route = createFileRoute("/settings/ux")({
  component: SettingsUXComponent,
  beforeLoad: () => ({
    getTitle: () => "UX settings",
  }),
});

function SettingsUXComponent() {
  return (
    <div className="flex max-w-xl flex-col gap-4 lg:mx-auto">
      <Heading level={2} className="sr-only">
        UX Settings
      </Heading>
      <ThemeCard />
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
