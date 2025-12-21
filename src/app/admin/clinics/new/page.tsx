import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClinicForm } from "@/components/admin/clinics/clinic-form";

export default function NewClinicPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/clinics">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Clinics
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Add New Clinic</h1>
          <p className="text-muted-foreground">
            Create a new clinic listing
          </p>
        </div>
      </div>

      {/* Form */}
      <ClinicForm />
    </div>
  );
}
