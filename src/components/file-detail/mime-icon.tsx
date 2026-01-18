// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import {
  IconFile,
  IconMovie,
  IconPhoto,
  IconVolume,
} from "@tabler/icons-react";

export function MimeIcon({
  mime,
  className,
}: {
  mime: string;
  className?: string;
}) {
  if (mime.startsWith("image/")) {
    return <IconPhoto className={className} />;
  }
  if (mime.startsWith("video/")) {
    return <IconMovie className={className} />;
  }
  if (mime.startsWith("audio/")) {
    return <IconVolume className={className} />;
  }
  return <IconFile className={className} />;
}
