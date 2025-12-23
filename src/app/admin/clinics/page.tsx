import Link from "next/link";
import { Plus } from "lucide-react";
import { ClinicsTable } from "@/components/admin/clinics-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getClinicsForAdmin,
  getClinicCount,
  getAllStatesWithClinics,
} from "@/lib/clinic-queries";

export default async function ClinicsPage() {
  const [clinics, totalCount, states] = await Promise.all([
    getClinicsForAdmin(100, 0),
    getClinicCount(),
    getAllStatesWithClinics(),
  ]);

  // Transform clinics to match expected interface
  const clinicsData = clinics.map((clinic) => ({
    id: clinic.id,
    title: clinic.title,
    city: clinic.city,
    stateAbbreviation: clinic.stateAbbreviation,
    permalink: clinic.permalink,
    rating: clinic.rating,
    reviewCount: clinic.reviewCount,
    isFeatured: clinic.isFeatured,
    featuredTier: clinic.featuredTier,
    status: clinic.status,
    createdAt: clinic.createdAt?.toISOString() ?? new Date().toISOString(),
    hasEnhancedContent: clinic.hasEnhancedContent ?? false,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clinics</h1>
          <p className="text-muted-foreground">
            Manage clinic data and services
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-sm">
            {totalCount.toLocaleString()} total clinics
          </Badge>
          <Link href="/admin/clinics/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Clinic
            </Button>
          </Link>
        </div>
      </div>

      <ClinicsTable
        initialClinics={clinicsData}
        initialTotalCount={totalCount}
        states={states.sort()}
      />
    </div>
  );
}
