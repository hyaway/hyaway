import {
  ComputerDesktopIcon,
  MoonIcon,
  SunIcon,
} from "@heroicons/react/20/solid";
import type { Theme } from "@/lib/theme-store";
import { Button } from "@/components/ui/button";
import {
  getWindowSystemTheme,
  useThemeActions,
  useThemePreference,
} from "@/lib/theme-store";
import { cn } from "@/lib/utils";

interface Props {
  appearance?: "plain" | "outline";
}
function getNextTheme(currentPreference: Theme): Theme {
  const systemTheme = getWindowSystemTheme();

  if (currentPreference === "system") {
    return systemTheme === "light"
      ? "dark"
      : systemTheme === "dark"
        ? "light"
        : "dark";
  }

  if (systemTheme && currentPreference === systemTheme) {
    return "system";
  }

  return currentPreference === "light" ? "dark" : "light";
}

export function ThemeSwitcher({ appearance = "plain" }: Props) {
  const themePreference = useThemePreference();
  const { setThemePreference } = useThemeActions();
  return (
    <Button
      intent={appearance}
      size="sq-sm"
      aria-label="Switch theme"
      onPress={() => setThemePreference(getNextTheme(themePreference))}
    >
      <SunIcon
        className={cn(
          "h-[1.2rem] w-[1.2rem] rotate-0 transition-all dark:scale-0 dark:-rotate-90",
          themePreference === "system"
            ? "-translate-y-0.5 scale-30"
            : "scale-100",
        )}
      />
      <MoonIcon
        className={cn(
          "absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:rotate-0",
          themePreference === "system"
            ? "-translate-y-0.5 dark:scale-30"
            : "dark:scale-100",
        )}
      />
      <ComputerDesktopIcon
        className={cn(
          "absolute h-[1.2rem] w-[1.2rem] transition-all",
          themePreference === "system" ? "scale-100" : "scale-0",
        )}
      />
    </Button>
  );
}
