// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useState } from "react";
import type { FileMetadata } from "@/integrations/hydrus-api/models";
import {
  useApiAccessKey,
  useApiEndpoint,
  useApiSessionKey,
  useAuthWithSessionKey,
} from "@/integrations/hydrus-api/hydrus-config-store";
import {
  HYDRUS_API_HEADER_ACCESS_KEY,
  HYDRUS_API_HEADER_SESSION_KEY,
} from "@/integrations/hydrus-api/models";
import { isStaticImage } from "@/lib/mime-utils";
import { refreshSessionKey } from "@/integrations/hydrus-api/clients/session-key-client";

// Shared probe state to avoid hundreds of HEAD requests when many images fail at once
let probePromise: Promise<boolean> | null = null;
let lastProbeTime = 0;
const PROBE_DEBOUNCE_MS = 1000;

/**
 * Check if the current session key is expired (419).
 * Debounced and shared across all callers - only one probe per second.
 */
async function probeSessionExpired(probeUrl: string): Promise<boolean> {
  const now = Date.now();

  // If we probed recently, reuse that result
  if (probePromise && now - lastProbeTime < PROBE_DEBOUNCE_MS) {
    return probePromise;
  }

  lastProbeTime = now;
  probePromise = fetch(probeUrl, { method: "HEAD" })
    .then((response) => response.status === 419)
    .catch(() => false);

  return probePromise;
}

/**
 * Hook that subscribes to auth changes.
 * Used for single file views where re-render is acceptable.
 */
const useAuthForUrl = () => {
  const useSession = useAuthWithSessionKey();
  const sessionKey = useApiSessionKey();
  const accessKey = useApiAccessKey();

  if (useSession) {
    return {
      authKey: sessionKey,
      headerName: HYDRUS_API_HEADER_SESSION_KEY,
    };
  }
  return {
    authKey: accessKey,
    headerName: HYDRUS_API_HEADER_ACCESS_KEY,
  };
};

export const useUrlWithApiKey = (url: string) => {
  const { authKey, headerName } = useAuthForUrl();
  return `${url}${url.includes("?") ? "&" : "?"}${headerName}=${authKey}`;
};

/**
 * Hook for media URLs (files, thumbnails) that handles auth and 419 recovery.
 * After success, freezes the working auth to avoid re-fetching on token refresh.
 * On error, triggers session key refresh (fire-and-forget) if 419 detected.
 */
const useMediaUrlWithRetry = (baseUrl: string) => {
  const useSessionKey = useAuthWithSessionKey();
  const storeAuth = useAuthForUrl();
  const [frozenAuth, setFrozenAuth] = useState<{
    authKey: string;
    headerName: string;
  } | null>(null);

  // Use frozen auth if we had a successful load, otherwise use current store auth
  const auth = frozenAuth ?? storeAuth;
  const url = `${baseUrl}&${auth.headerName}=${auth.authKey}`;

  // On success: freeze the working auth
  const onLoad = () => {
    setFrozenAuth((current) => current ?? storeAuth);
  };

  // On error: check if 419 (debounced probe), trigger refresh if so
  const onError = () => {
    if (useSessionKey) {
      // Debounced probe - only one HEAD request per second across all images
      probeSessionExpired(url).then((is419) => {
        if (is419) {
          // Fire-and-forget refresh - Web Locks handles deduplication
          refreshSessionKey(auth.authKey).catch(() => {});
        }
      });
    }
    setFrozenAuth(null);
  };

  return { url, onLoad, onError };
};

/**
 * Hook that prefetches a static image into the browser cache.
 * No-ops for non-image MIME types or when metadata is undefined.
 */
export function usePrefetchFileImage(metadata: FileMetadata | undefined): void {
  const apiEndpoint = useApiEndpoint();
  const url = useUrlWithApiKey(
    `${apiEndpoint}/get_files/file?file_id=${metadata?.file_id ?? 0}`,
  );

  useEffect(() => {
    if (!metadata || !isStaticImage(metadata.mime)) return;
    const img = new Image();
    img.fetchPriority = "low";
    img.src = url;
  }, [metadata, url]);
}

export const useFullFileIdUrl = (fileId: number) => {
  const apiEndpoint = useApiEndpoint();
  return useMediaUrlWithRetry(
    `${apiEndpoint}/get_files/file?file_id=${fileId}`,
  );
};

export const useThumbnailUrl = (fileId: number) => {
  const apiEndpoint = useApiEndpoint();
  return useMediaUrlWithRetry(
    `${apiEndpoint}/get_files/thumbnail?file_id=${fileId}`,
  );
};

export const useDownloadFileIdUrl = (fileId: number) => {
  const apiEndpoint = useApiEndpoint();
  const { authKey, headerName } = useAuthForUrl();
  return `${apiEndpoint}/get_files/file?file_id=${fileId}&download=true&${headerName}=${authKey}`;
};

/**
 * Render format enum for the /get_files/render endpoint.
 * @see https://hydrusnetwork.github.io/hydrus/developer_api.html#get_files_render
 */
export const RenderFormat = {
  /** JPEG format - quality sets JPEG quality 0-100 */
  JPEG: 1,
  /** PNG format - quality sets compression level 0-9 */
  PNG: 2,
  /** WEBP format - quality sets WEBP quality 1-100, over 100 for lossless */
  WEBP: 33,
  /** APNG format for ugoiras - quality has no effect */
  APNG: 23,
  /** Animated WEBP format for ugoiras - quality sets WEBP quality 1-100 */
  ANIMATED_WEBP: 83,
} as const;

export type RenderFormat = (typeof RenderFormat)[keyof typeof RenderFormat];

export interface RenderFileOptions {
  /** Target render format */
  renderFormat?: RenderFormat;
  /** Quality or compression level (format-dependent) */
  renderQuality?: number;
  /** Target width (must provide both width and height) */
  width?: number;
  /** Target height (must provide both width and height) */
  height?: number;
  /** Trigger browser download dialog instead of inline display */
  download?: boolean;
}

/**
 * Hook to get a rendered image URL from Hydrus.
 * Useful for rendering PSD files, applying color profile conversion,
 * or resizing images server-side.
 *
 * @permission Requires: Search Files (3)
 * @see https://hydrusnetwork.github.io/hydrus/developer_api.html#get_files_render
 */
export const useRenderFileIdUrl = (
  fileId: number,
  options: RenderFileOptions = {},
) => {
  const apiEndpoint = useApiEndpoint();
  const { renderFormat, renderQuality, width, height, download } = options;

  // Build query params
  const params = new URLSearchParams();
  params.set("file_id", String(fileId));

  if (renderFormat !== undefined) {
    params.set("render_format", String(renderFormat));
  }
  if (renderQuality !== undefined) {
    params.set("render_quality", String(renderQuality));
  }
  if (width !== undefined && height !== undefined) {
    params.set("width", String(width));
    params.set("height", String(height));
  }
  if (download) {
    params.set("download", "true");
  }

  return useMediaUrlWithRetry(`${apiEndpoint}/get_files/render?${params}`);
};

/**
 * Get a static rendered file URL (non-reactive, single use).
 * Useful when you need the URL string directly without hooks.
 *
 * @permission Requires: Search Files (3)
 * @see https://hydrusnetwork.github.io/hydrus/developer_api.html#get_files_render
 */
export const getRenderFileIdUrl = (
  apiEndpoint: string,
  authKey: string,
  headerName: string,
  fileId: number,
  options: RenderFileOptions = {},
) => {
  const { renderFormat, renderQuality, width, height, download } = options;

  const params = new URLSearchParams();
  params.set("file_id", String(fileId));
  params.set(headerName, authKey);

  if (renderFormat !== undefined) {
    params.set("render_format", String(renderFormat));
  }
  if (renderQuality !== undefined) {
    params.set("render_quality", String(renderQuality));
  }
  if (width !== undefined && height !== undefined) {
    params.set("width", String(width));
    params.set("height", String(height));
  }
  if (download) {
    params.set("download", "true");
  }

  return `${apiEndpoint}/get_files/render?${params}`;
};
