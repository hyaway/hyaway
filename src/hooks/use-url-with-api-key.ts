import { HYDRUS_API_HEADER_ACCESS_KEY } from "@/integrations/hydrus-api/hydrus-api";
import {
  useApiAccessKey,
  useApiEndpoint,
} from "@/integrations/hydrus-api/hydrus-config-store";

export const useUrlWithApiKey = (url: string) => {
  const apiAccessKey = useApiAccessKey();
  return `${url}${url.includes("?") ? "&" : "?"}${HYDRUS_API_HEADER_ACCESS_KEY}=${apiAccessKey}`;
};

export const useThumbnailFileIdUrl = (fileId: number) => {
  const apiEndpoint = useApiEndpoint();
  const apiAccessKey = useApiAccessKey();
  return `${apiEndpoint}/get_files/thumbnail?file_id=${fileId}&${HYDRUS_API_HEADER_ACCESS_KEY}=${apiAccessKey}`;
};

export const useFullFileIdUrl = (fileId: number) => {
  const apiEndpoint = useApiEndpoint();
  const apiAccessKey = useApiAccessKey();
  return `${apiEndpoint}/get_files/file?file_id=${fileId}&${HYDRUS_API_HEADER_ACCESS_KEY}=${apiAccessKey}`;
};
