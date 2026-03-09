import { requireAdmin } from "@/lib/session";
import { MediaLibrary } from "@/components/admin/media-library";

export default async function MediaPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Media Library
      </h1>
      <MediaLibrary />
    </div>
  );
}
