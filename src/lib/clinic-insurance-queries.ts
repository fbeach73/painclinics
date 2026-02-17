import { eq, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  clinicInsurance,
  insuranceProviders as insuranceProvidersTable,
} from "@/lib/schema";
import type { InsuranceType } from "@/types/clinic";

/**
 * Get insurance provider slugs for a clinic from the junction table.
 */
export async function getClinicInsuranceSlugs(
  clinicId: string
): Promise<InsuranceType[]> {
  const results = await db
    .select({
      slug: insuranceProvidersTable.slug,
    })
    .from(clinicInsurance)
    .innerJoin(
      insuranceProvidersTable,
      eq(clinicInsurance.insuranceId, insuranceProvidersTable.id)
    )
    .where(eq(clinicInsurance.clinicId, clinicId))
    .orderBy(asc(insuranceProvidersTable.displayOrder));

  return results.map((r) => r.slug as InsuranceType);
}
