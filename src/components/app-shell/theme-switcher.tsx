import {
  IconDeviceDesktop,
  IconMoonFilled,
  IconSun,
} from "@tabler/icons-react";
import type { Theme } from "@/lib/theme-store";
import type { ComponentProps } from "react";
import { TouchTarget } from "@/components/ui-primitives/touch-target";
import { Button } from "@/components/ui-primitives/button";
import {
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui-primitives/sidebar";
import {
  getWindowSystemTheme,
  useThemeActions,
  useThemePreference,
} from "@/lib/theme-store";
import { cn } from "@/lib/utils";

function getNextTheme(currentPreference: Theme): Theme {
  const systemTheme = getWindowSystemTheme();

  if (currentPreference === "system") {
    return systemTheme === "light" ? "dark" : "light";
  }

  if (currentPreference === systemTheme) {
    return "system";
  }

  return currentPreference === "light" ? "dark" : "light";
}

export function ThemeSwitcher(props: ComponentProps<typeof Button>) {
  const themePreference = useThemePreference();
  const { setThemePreference } = useThemeActions();
  return (
    <Button
      variant={"ghost"}
      size={"icon-xl"}
      aria-label="Switch theme"
      {...props}
      onClick={() => setThemePreference(getNextTheme(themePreference))}
    >
      <ThemeIcon
        themePreference={themePreference}
        className="h-[1.2rem] w-[1.2rem]"
      />
    </Button>
  );
}

export function SidebarThemeSwitcher() {
  const themePreference = useThemePreference();
  const { setThemePreference } = useThemeActions();

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        onClick={() => setThemePreference(getNextTheme(themePreference))}
        aria-label="Switch theme"
        tooltip="Switch theme"
      >
        <TouchTarget>
          <ThemeIcon themePreference={themePreference} />
          <span>Switch theme</span>
        </TouchTarget>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function ThemeIcon({
  themePreference,
  className,
}: {
  themePreference: Theme;
  className?: string;
}) {
  return (
    <span
      className={cn("relative flex items-center justify-center", className)}
    >
      <IconSun
        className={cn(
          "size-4 rotate-0 transition-all dark:scale-0 dark:-rotate-90",
          themePreference === "system"
            ? "-translate-y-0.5 scale-30"
            : "scale-100",
        )}
      />
      <IconMoonFilled
        className={cn(
          "absolute size-4 scale-0 rotate-90 transition-all dark:rotate-0",
          themePreference === "system"
            ? "-translate-y-0.5 dark:scale-30"
            : "dark:scale-100",
        )}
      />
      <IconDeviceDesktop
        className={cn(
          "absolute size-4 transition-all",
          themePreference === "system" ? "scale-100" : "scale-0",
        )}
      />
    </span>
  );
}
