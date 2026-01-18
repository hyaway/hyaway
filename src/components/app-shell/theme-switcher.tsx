// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import {
  IconDeviceDesktop,
  IconMoonFilled,
  IconSun,
} from "@tabler/icons-react";
import type { Theme } from "@/stores/theme-store";
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
} from "@/stores/theme-store";
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
      size={"icon-sm"}
      aria-label="Switch theme"
      {...props}
      onClick={() => setThemePreference(getNextTheme(themePreference))}
    >
      <ThemeIcon themePreference={themePreference} />
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
          "rotate-0 transition-all dark:scale-0 dark:-rotate-90",
          themePreference === "system"
            ? "-translate-y-0.5 scale-30"
            : "scale-100",
        )}
      />
      <IconMoonFilled
        className={cn(
          "absolute scale-0 rotate-90 transition-all dark:rotate-0",
          themePreference === "system"
            ? "-translate-y-0.5 dark:scale-30"
            : "dark:scale-100",
        )}
      />
      <IconDeviceDesktop
        className={cn(
          "absolute transition-all",
          themePreference === "system" ? "scale-100" : "scale-0",
        )}
      />
    </span>
  );
}
