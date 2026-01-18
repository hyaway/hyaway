// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { IconCheck, IconRestore } from "@tabler/icons-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Button } from "@/components/ui-primitives/button";
import { cn } from "@/lib/utils";

/**
 * A heading for settings cards. Renders as an h3 but styled to match CardTitle.
 * Use this instead of CardTitle for proper heading hierarchy.
 */
export function SettingsCardTitle({
  className,
  ...props
}: React.ComponentProps<"h3">) {
  return (
    <h3
      data-slot="card-title"
      className={cn("text-lg font-medium", className)}
      {...props}
    />
  );
}

/**
 * A subheading for grouping related settings within a card.
 * Renders as an h4 with muted styling.
 */
export function SettingsSubheading({
  className,
  ...props
}: React.ComponentProps<"h4">) {
  return (
    <h4
      data-slot="settings-subheading"
      className={cn("text-foreground text-sm font-medium", className)}
      {...props}
    />
  );
}

/**
 * Container for a settings section header with title and optional actions.
 * Use within SettingsSection or at the top of a popover.
 * The first header in a popover will bleed to the edges with negative margins.
 */
export function SettingsHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="settings-header"
      className={cn(
        "border-primary mb-4 flex items-center justify-between gap-2 border-b-3 pt-3 pb-1",
        className,
      )}
      {...props}
    />
  );
}

export function SettingsTitle({
  className,
  ...props
}: React.ComponentProps<"h3">) {
  return (
    <h3
      data-slot="settings-title"
      className={cn("text-base font-medium", className)}
      {...props}
    />
  );
}

interface SettingsResetButtonProps {
  onReset: () => void;
  label?: string;
}

export function SettingsResetButton({
  onReset,
  label = "Reset to defaults",
}: SettingsResetButtonProps) {
  const [showCheck, setShowCheck] = useState(false);

  const handleClick = () => {
    onReset();
    setShowCheck(true);
    setTimeout(() => setShowCheck(false), 2000);
  };

  return (
    <Button
      variant="ghost"
      size="icon-xs"
      onClick={handleClick}
      aria-label={label}
      title={label}
      className="relative"
    >
      <AnimatePresence mode="wait">
        {showCheck ? (
          <motion.span
            key="check"
            initial={{ opacity: 1, scale: 1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <IconCheck className="text-success size-5" />
          </motion.span>
        ) : (
          <motion.span
            key="restore"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.1 }}
          >
            <IconRestore className="size-5" />
          </motion.span>
        )}
      </AnimatePresence>
    </Button>
  );
}
