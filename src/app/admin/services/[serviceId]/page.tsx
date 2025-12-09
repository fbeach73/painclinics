import { notFound } from "next/navigation";
import { getServiceById } from "@/lib/services-queries";
import { EditServiceClient } from "./edit-service-client";

interface PageProps {
  params: Promise<{ serviceId: string }>;
}

export default async function EditServicePage({ params }: PageProps) {
  const { serviceId } = await params;
  const service = await getServiceById(serviceId);

  if (!service) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit Service</h1>
        <p className="text-muted-foreground">
          Update the details for {service.name}
        </p>
      </div>
      <div className="max-w-2xl">
        <EditServiceClient service={service} />
      </div>
    </div>
  );
}
