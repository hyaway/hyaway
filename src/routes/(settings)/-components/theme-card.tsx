// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import type { Theme } from "@/stores/theme-store";
import { SettingsCardTitle } from "@/components/settings/settings-ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui-primitives/card";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui-primitives/toggle-group";
import { Label } from "@/components/ui-primitives/label";
import { useThemeActions, useThemePreference } from "@/stores/theme-store";

export function ThemeCard() {
  const themePreference = useThemePreference();
  const { setThemePreference } = useThemeActions();

  return (
    <Card>
      <CardHeader>
        <SettingsCardTitle>Theme</SettingsCardTitle>
        <CardDescription>
          Choose your preferred color scheme for the application.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
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
