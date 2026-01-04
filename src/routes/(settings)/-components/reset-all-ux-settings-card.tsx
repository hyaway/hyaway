import { Button } from "@/components/ui-primitives/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui-primitives/card";
import { useFileViewerSettingsActions } from "@/stores/file-viewer-settings-store";
import { useGallerySettingsActions } from "@/stores/gallery-settings-store";
import { usePagesSettingsActions } from "@/stores/pages-settings-store";
import { useSearchLimitsActions } from "@/stores/search-limits-store";
import { useTagsSettingsActions } from "@/stores/tags-settings-store";
import { useWatchHistoryActions } from "@/stores/watch-history-store";

export function ResetAllUxSettingsCard() {
  const { reset: resetGallery } = useGallerySettingsActions();
  const { reset: resetFileViewer } = useFileViewerSettingsActions();
  const { reset: resetPages } = usePagesSettingsActions();
  const { reset: resetSearchLimits } = useSearchLimitsActions();
  const { reset: resetTags } = useTagsSettingsActions();
  const { reset: resetWatchHistory } = useWatchHistoryActions();

  const handleResetAll = () => {
    resetGallery();
    resetFileViewer();
    resetPages();
    resetSearchLimits();
    resetTags();
    resetWatchHistory();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset all UX settings</CardTitle>
        <CardDescription>
          Reset all settings on this page to their default values. This does not
          affect your theme preference or watch history entries.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Button variant="destructive" onClick={handleResetAll}>
          Reset UX settings
        </Button>
      </CardContent>
    </Card>
  );
}
