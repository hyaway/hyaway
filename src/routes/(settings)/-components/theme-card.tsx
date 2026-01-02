import type { Theme } from "@/lib/theme-store";
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
import { useTheme } from "@/lib/theme-store";

export function ThemeCard() {
  const themePreference = useTheme.themePreference();
  const { setThemePreference } = useTheme.actions();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Theme</CardTitle>
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
