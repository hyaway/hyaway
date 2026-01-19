// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useMemo } from "react";
import { IconExternalLink, IconLink } from "@tabler/icons-react";

import type { FileMetadata } from "@/integrations/hydrus-api/models";
import { Heading } from "@/components/ui-primitives/heading";

interface FileUrlsSectionProps {
  data: FileMetadata;
}

export function FileUrlsSection({ data }: FileUrlsSectionProps) {
  const urls = useMemo(() => {
    if (!data.known_urls || data.known_urls.length === 0) return [];
    // Sort URLs alphabetically by domain for easier scanning
    return [...data.known_urls].sort((a, b) => {
      try {
        const domainA = new URL(a).hostname;
        const domainB = new URL(b).hostname;
        return domainA.localeCompare(domainB) || a.localeCompare(b);
      } catch {
        return a.localeCompare(b);
      }
    });
  }, [data.known_urls]);

  if (urls.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <Heading level={2}>URLs ({urls.length})</Heading>
      <ul className="space-y-2">
        {urls.map((url) => (
          <UrlListItem key={url} url={url} />
        ))}
      </ul>
    </div>
  );
}

function UrlListItem({ url }: { url: string }) {
  const displayInfo = useMemo(() => {
    try {
      const parsed = new URL(url);
      return {
        domain: parsed.hostname,
        path: parsed.pathname + parsed.search,
      };
    } catch {
      return { domain: url, path: "" };
    }
  }, [url]);

  return (
    <li className="group">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-muted/50 hover:bg-muted flex items-start gap-2 rounded-lg border p-2 transition-colors"
      >
        <IconLink className="text-muted-foreground mt-0.5 size-4 shrink-0" />
        <div className="min-w-0 flex-1">
          <span className="text-sm font-medium">{displayInfo.domain}</span>
          {displayInfo.path && displayInfo.path !== "/" && (
            <span className="text-muted-foreground block truncate text-xs">
              {displayInfo.path}
            </span>
          )}
        </div>
        <IconExternalLink className="text-muted-foreground mt-0.5 size-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
      </a>
    </li>
  );
}
