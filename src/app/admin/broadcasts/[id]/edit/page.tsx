import { notFound } from "next/navigation";
import { BroadcastForm } from "@/components/admin/broadcasts";
import { getBroadcast } from "@/lib/broadcast/broadcast-queries";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const broadcast = await getBroadcast(id);

  if (!broadcast) {
    return {
      title: "Broadcast Not Found - Admin",
    };
  }

  return {
    title: `Edit: ${broadcast.name} - Admin`,
    description: `Edit broadcast: ${broadcast.name}`,
  };
}

export default async function EditBroadcastPage({ params }: PageProps) {
  const { id } = await params;
  const broadcast = await getBroadcast(id);

  if (!broadcast) {
    notFound();
  }

  // Only allow editing draft broadcasts
  if (broadcast.status !== "draft") {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Cannot Edit Broadcast</h1>
        <p className="text-muted-foreground">
          This broadcast has already been sent or is currently sending. Only draft broadcasts can be edited.
        </p>
      </div>
    );
  }

  return <BroadcastForm broadcast={broadcast} />;
}
