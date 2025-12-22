import { HYDRUS_API_HEADER_SESSION_KEY } from "@/integrations/hydrus-api/models";
import {
  useApiEndpoint,
  useApiSessionKey,
} from "@/integrations/hydrus-api/hydrus-config-store";

export const useUrlWithApiKey = (url: string) => {
  const sessionKey = useApiSessionKey();
  return `${url}${url.includes("?") ? "&" : "?"}${HYDRUS_API_HEADER_SESSION_KEY}=${sessionKey}`;
};

export const useThumbnailFileIdUrl = (fileId: number) => {
  const apiEndpoint = useApiEndpoint();
  const sessionKey = useApiSessionKey();
  return `${apiEndpoint}/get_files/thumbnail?file_id=${fileId}&${HYDRUS_API_HEADER_SESSION_KEY}=${sessionKey}`;
};

export const useFullFileIdUrl = (fileId: number) => {
  const apiEndpoint = useApiEndpoint();
  const sessionKey = useApiSessionKey();
  return `${apiEndpoint}/get_files/file?file_id=${fileId}&${HYDRUS_API_HEADER_SESSION_KEY}=${sessionKey}`;
};

export const useDownloadFileIdUrl = (fileId: number) => {
  const apiEndpoint = useApiEndpoint();
  const sessionKey = useApiSessionKey();
  return `${apiEndpoint}/get_files/file?file_id=${fileId}&download=true&${HYDRUS_API_HEADER_SESSION_KEY}=${sessionKey}`;
};
