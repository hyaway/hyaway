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
 * Hook for thumbnails that captures auth token in state.
 * Successfully loaded images keep their token; failed ones get the latest from store.
 */
export const useThumbnailWithRetry = (fileId: number) => {
  const apiEndpoint = useApiEndpoint();
  const currentAuth = useAuthForUrl();
  const [auth, setAuth] = useState(currentAuth);

  const url = `${apiEndpoint}/get_files/thumbnail?file_id=${fileId}&${auth.headerName}=${auth.authKey}`;

  const onError = useCallback(() => {
    setAuth(currentAuth);
  }, [currentAuth]);

  return { url, onError };
};
