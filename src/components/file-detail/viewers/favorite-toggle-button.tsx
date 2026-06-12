// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { IconStar, IconStarFilled } from "@tabler/icons-react";
import { useFavoriteToggle } from "@/hooks/use-favorite-toggle";
import { Toggle } from "@/components/ui-primitives/toggle";

/**
 * Star button for the image viewer control bars. Toggles the favourite
 * (like/dislike) rating on the current file. Renders nothing when there is no
 * like/dislike rating service or the user lacks the Edit Ratings permission.
 */
export function FavoriteToggleButton({ fileId }: { fileId: number }) {
  const { enabled, isLiked, toggle } = useFavoriteToggle(fileId);

  if (!enabled) return null;

  return (
    <Toggle
      variant="outline"
      size="sm"
      pressed={isLiked}
      className="hover:bg-accent hover:text-accent-foreground"
      onClick={(event) => {
        event.stopPropagation();
        toggle();
      }}
      title={isLiked ? "Unfavourite (S)" : "Favourite (S)"}
    >
      {isLiked ? (
        <IconStarFilled className="size-4" />
      ) : (
        <IconStar className="size-4" />
      )}
    </Toggle>
  );
}
