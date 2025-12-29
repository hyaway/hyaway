import {
  DocumentIcon,
  FilmIcon,
  PhotoIcon,
  SpeakerWaveIcon,
} from "@heroicons/react/24/solid";

export function MimeIcon({
  mime,
  className,
}: {
  mime: string;
  className?: string;
}) {
  if (mime.startsWith("image/")) {
    return <PhotoIcon className={className} />;
  }
  if (mime.startsWith("video/")) {
    return <FilmIcon className={className} />;
  }
  if (mime.startsWith("audio/")) {
    return <SpeakerWaveIcon className={className} />;
  }
  return <DocumentIcon className={className} />;
}
