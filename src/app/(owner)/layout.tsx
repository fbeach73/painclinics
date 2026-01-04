import { OwnerSidebar } from "@/components/owner/owner-sidebar";
import { requireAuth } from "@/lib/session";

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Only require authentication, not owner role
  // Individual pages can add additional role checks if needed
  await requireAuth();

  return (
    <div className="flex min-h-screen">
      <OwnerSidebar />
      <main className="flex-1 p-6 bg-muted/30">{children}</main>
    </div>
  );
}
