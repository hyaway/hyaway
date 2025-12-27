import { useCallback, useState } from "react";
import {
  useApiAccessKey,
  useApiEndpoint,
  useApiSessionKey,
  useAuthStore,
  useAuthWithSessionKey,
} from "@/integrations/hydrus-api/hydrus-config-store";
import {
  HYDRUS_API_HEADER_ACCESS_KEY,
  HYDRUS_API_HEADER_SESSION_KEY,
} from "@/integrations/hydrus-api/models";
import { refreshSessionKey } from "@/integrations/hydrus-api/api-client";

/**
 * Get auth key and header name without subscribing to changes.
 * Used for thumbnails to prevent mass re-renders on session key refresh.
 */
const getAuthForUrl = () => {
  const { authWithSessionKey, sessionKey, api_access_key } =
    useAuthStore.getState();

  if (authWithSessionKey) {
    return {
      authKey: sessionKey,
      headerName: HYDRUS_API_HEADER_SESSION_KEY,
    };
  }
  return {
    authKey: api_access_key,
    headerName: HYDRUS_API_HEADER_ACCESS_KEY,
  };
};

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

export const useFullFileIdUrl = (fileId: number) => {
  const apiEndpoint = useApiEndpoint();
  const { authKey, headerName } = useAuthForUrl();
  return `${apiEndpoint}/get_files/file?file_id=${fileId}&${headerName}=${authKey}`;
};

export const useDownloadFileIdUrl = (fileId: number) => {
  const apiEndpoint = useApiEndpoint();
  const { authKey, headerName } = useAuthForUrl();
  return `${apiEndpoint}/get_files/file?file_id=${fileId}&download=true&${headerName}=${authKey}`;
};

/**
 * Hook for thumbnails that keeps previous URL until error.
 * Only the thumbnail that errors will refresh after session key refresh.
 */
export const useThumbnailWithRefresh = (fileId: number) => {
  const apiEndpoint = useApiEndpoint();
  const [retryCount, setRetryCount] = useState(0);

  const { authKey, headerName } = getAuthForUrl();
  const url = `${apiEndpoint}/get_files/thumbnail?file_id=${fileId}&${headerName}=${authKey}&_retry=${retryCount}`;

  const onError = useCallback(() => {
    refreshSessionKey().then(() => {
      setRetryCount((c) => c + 1);
    });
  }, []);

  return { url, onError };
};
