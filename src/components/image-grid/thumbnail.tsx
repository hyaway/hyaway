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
      className={cn(`group h-full w-full overflow-visible`, className)}
    >
      <div className="h-full w-full overflow-hidden rounded border object-cover transition-[width,height,transform] duration-350 ease-out group-hover:scale-(--thumbnail-hover-scale) hover:pointer-events-none">
        <img
          src={url}
          alt={`Thumbnail for file ID ${fileId}`}
          className="h-full w-full overflow-visible object-cover transition-[width,height,transform]"
          loading="lazy"
        />
      </div>
    </div>
  );
}
