import { useThumbnailFileIdUrl } from "@/hooks/use-url-with-api-key";
import { cn } from "@/lib/utils";

export interface ThumbnailProps extends React.HTMLAttributes<HTMLDivElement> {
  fileId: number;
}

export function Thumbnail({ fileId, className, ...props }: ThumbnailProps) {
  const url = useThumbnailFileIdUrl(fileId);
  return (
    <div
      {...props}
      className={cn(`h-full w-full overflow-hidden rounded border`, className)}
    >
      <img
        src={url}
        alt={`Thumbnail for file ID ${fileId}`}
        className="h-full w-full object-cover"
        loading="lazy"
      />
    </div>
  );
}
