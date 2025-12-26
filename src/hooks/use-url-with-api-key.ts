import {
  useApiEndpoint,
  useAuthHeaderName,
  useAuthKey,
} from "@/integrations/hydrus-api/hydrus-config-store";

export const useUrlWithApiKey = (url: string) => {
  const authKey = useAuthKey();
  const headerName = useAuthHeaderName();
  return `${url}${url.includes("?") ? "&" : "?"}${headerName}=${authKey}`;
};

export const useThumbnailFileIdUrl = (fileId: number) => {
  const apiEndpoint = useApiEndpoint();
  const authKey = useAuthKey();
  const headerName = useAuthHeaderName();
  return `${apiEndpoint}/get_files/thumbnail?file_id=${fileId}&${headerName}=${authKey}`;
};

export const useFullFileIdUrl = (fileId: number) => {
  const apiEndpoint = useApiEndpoint();
  const authKey = useAuthKey();
  const headerName = useAuthHeaderName();
  return `${apiEndpoint}/get_files/file?file_id=${fileId}&${headerName}=${authKey}`;
};

export const useDownloadFileIdUrl = (fileId: number) => {
  const apiEndpoint = useApiEndpoint();
  const authKey = useAuthKey();
  const headerName = useAuthHeaderName();
  return `${apiEndpoint}/get_files/file?file_id=${fileId}&download=true&${headerName}=${authKey}`;
};
