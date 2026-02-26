import type { Metadata } from "next";
import {
  getGuidesAdmin,
  getGuideCountsByStatus,
} from "@/lib/guides/guide-admin-queries";
import { GuideList } from "./guide-list";

export const metadata: Metadata = {
  title: "Guides - Admin",
};

export default async function AdminGuidesPage() {
  const [{ guides, total }, counts] = await Promise.all([
    getGuidesAdmin({ page: 1, limit: 20 }),
    getGuideCountsByStatus(),
  ]);

  return (
    <GuideList
      initialGuides={guides}
      initialTotal={total}
      initialCounts={counts}
    />
  );
}
