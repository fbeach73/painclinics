import { OwnerSidebar } from "@/components/owner/owner-sidebar";
import { requireOwner } from "@/lib/session";

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireOwner();

  return (
    <div className="flex min-h-screen">
      <OwnerSidebar />
      <main className="flex-1 p-6 bg-muted/30">{children}</main>
    </div>
  );
}
