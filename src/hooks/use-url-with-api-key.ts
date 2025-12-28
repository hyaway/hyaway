import { useCallback, useState } from "react";
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
  const onLoad = useCallback(() => {
    setFrozenAuth((current) => current ?? storeAuth);
  }, [storeAuth]);

  // On error: check if 419 (debounced probe), trigger refresh if so
  const onError = useCallback(() => {
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
  }, [useSessionKey, url, auth.authKey]);

  return { url, onLoad, onError };
};

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
