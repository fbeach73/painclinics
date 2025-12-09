import { eq, asc, and, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { clinicServices, services, clinics } from "@/lib/schema";
import type { ClinicService, Service, SetServiceInput } from "@/types/service";

/**
 * Get all services for a clinic, with service details included.
 *
 * @param clinicId - The clinic ID
 * @returns Array of ClinicService objects with service details
 */
export async function getClinicServices(clinicId: string): Promise<ClinicService[]> {
  const results = await db
    .select({
      id: clinicServices.id,
      clinicId: clinicServices.clinicId,
      serviceId: clinicServices.serviceId,
      isFeatured: clinicServices.isFeatured,
      displayOrder: clinicServices.displayOrder,
      addedAt: clinicServices.addedAt,
      addedBy: clinicServices.addedBy,
      service: {
        id: services.id,
        name: services.name,
        slug: services.slug,
        iconName: services.iconName,
        description: services.description,
        category: services.category,
        isActive: services.isActive,
        displayOrder: services.displayOrder,
        createdAt: services.createdAt,
        updatedAt: services.updatedAt,
      },
    })
    .from(clinicServices)
    .innerJoin(services, eq(clinicServices.serviceId, services.id))
    .where(eq(clinicServices.clinicId, clinicId))
    .orderBy(asc(clinicServices.displayOrder), asc(services.name));

  return results;
}

/**
 * Get only featured services for a clinic, with service details.
 * Useful for displaying on clinic cards and summaries.
 *
 * @param clinicId - The clinic ID
 * @returns Array of ClinicService objects (featured only)
 */
export async function getFeaturedClinicServices(
  clinicId: string
): Promise<ClinicService[]> {
  const results = await db
    .select({
      id: clinicServices.id,
      clinicId: clinicServices.clinicId,
      serviceId: clinicServices.serviceId,
      isFeatured: clinicServices.isFeatured,
      displayOrder: clinicServices.displayOrder,
      addedAt: clinicServices.addedAt,
      addedBy: clinicServices.addedBy,
      service: {
        id: services.id,
        name: services.name,
        slug: services.slug,
        iconName: services.iconName,
        description: services.description,
        category: services.category,
        isActive: services.isActive,
        displayOrder: services.displayOrder,
        createdAt: services.createdAt,
        updatedAt: services.updatedAt,
      },
    })
    .from(clinicServices)
    .innerJoin(services, eq(clinicServices.serviceId, services.id))
    .where(
      and(eq(clinicServices.clinicId, clinicId), eq(clinicServices.isFeatured, true))
    )
    .orderBy(asc(clinicServices.displayOrder), asc(services.name));

  return results;
}

/**
 * Set all services for a clinic (full replacement).
 * Removes existing services and inserts the new set.
 *
 * @param clinicId - The clinic ID
 * @param serviceInputs - Array of service assignments
 * @param addedBy - Optional user ID who is making the change
 */
export async function setClinicServices(
  clinicId: string,
  serviceInputs: SetServiceInput[],
  addedBy?: string
): Promise<void> {
  await db.transaction(async (tx) => {
    // Delete existing services for this clinic
    await tx.delete(clinicServices).where(eq(clinicServices.clinicId, clinicId));

    // Insert new services if any
    if (serviceInputs.length > 0) {
      await tx.insert(clinicServices).values(
        serviceInputs.map((input) => ({
          clinicId,
          serviceId: input.serviceId,
          isFeatured: input.isFeatured,
          displayOrder: input.displayOrder,
          addedBy: addedBy ?? null,
        }))
      );
    }
  });
}

/**
 * Add a single service to a clinic.
 *
 * @param clinicId - The clinic ID
 * @param serviceId - The service ID to add
 * @param isFeatured - Whether this is a featured service (default: false)
 * @param displayOrder - Display order (default: 0)
 * @param addedBy - Optional user ID who is making the change
 */
export async function addServiceToClinic(
  clinicId: string,
  serviceId: string,
  isFeatured = false,
  displayOrder = 0,
  addedBy?: string
): Promise<void> {
  await db
    .insert(clinicServices)
    .values({
      clinicId,
      serviceId,
      isFeatured,
      displayOrder,
      addedBy: addedBy ?? null,
    })
    .onConflictDoNothing();
}

/**
 * Remove a service from a clinic.
 *
 * @param clinicId - The clinic ID
 * @param serviceId - The service ID to remove
 */
export async function removeServiceFromClinic(
  clinicId: string,
  serviceId: string
): Promise<void> {
  await db
    .delete(clinicServices)
    .where(
      and(
        eq(clinicServices.clinicId, clinicId),
        eq(clinicServices.serviceId, serviceId)
      )
    );
}

/**
 * Update a clinic service's featured status or display order.
 *
 * @param clinicId - The clinic ID
 * @param serviceId - The service ID
 * @param updates - The fields to update
 */
export async function updateClinicService(
  clinicId: string,
  serviceId: string,
  updates: { isFeatured?: boolean; displayOrder?: number }
): Promise<void> {
  await db
    .update(clinicServices)
    .set(updates)
    .where(
      and(
        eq(clinicServices.clinicId, clinicId),
        eq(clinicServices.serviceId, serviceId)
      )
    );
}

/**
 * Summary of a clinic for service listings.
 */
export interface ClinicSummary {
  id: string;
  title: string;
  city: string;
  stateAbbreviation: string | null;
  permalink: string;
}

/**
 * Get all clinics that offer a specific service.
 *
 * @param serviceId - The service ID
 * @returns Array of clinic summaries
 */
export async function getClinicsByService(
  serviceId: string
): Promise<ClinicSummary[]> {
  const results = await db
    .select({
      id: clinics.id,
      title: clinics.title,
      city: clinics.city,
      stateAbbreviation: clinics.stateAbbreviation,
      permalink: clinics.permalink,
    })
    .from(clinicServices)
    .innerJoin(clinics, eq(clinicServices.clinicId, clinics.id))
    .where(eq(clinicServices.serviceId, serviceId))
    .orderBy(asc(clinics.stateAbbreviation), asc(clinics.city), asc(clinics.title));

  return results;
}

/**
 * Get count of featured services for a clinic.
 * Useful for validation (recommending max 8 featured services).
 *
 * @param clinicId - The clinic ID
 * @returns Number of featured services
 */
export async function getFeaturedServiceCount(clinicId: string): Promise<number> {
  const result = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(clinicServices)
    .where(
      and(eq(clinicServices.clinicId, clinicId), eq(clinicServices.isFeatured, true))
    );

  return result[0]?.count ?? 0;
}

/**
 * Get services available to add to a clinic.
 * Returns all active services that the clinic doesn't already have.
 *
 * @param clinicId - The clinic ID
 * @returns Array of available services
 */
export async function getAvailableServicesForClinic(
  clinicId: string
): Promise<Service[]> {
  // Get IDs of services already assigned to this clinic
  const existingServices = await db
    .select({ serviceId: clinicServices.serviceId })
    .from(clinicServices)
    .where(eq(clinicServices.clinicId, clinicId));

  const existingIds = existingServices.map((s) => s.serviceId);

  // Get all active services not in the existing list
  if (existingIds.length === 0) {
    return db
      .select()
      .from(services)
      .where(eq(services.isActive, true))
      .orderBy(asc(services.category), asc(services.displayOrder), asc(services.name));
  }

  return db
    .select()
    .from(services)
    .where(
      and(
        eq(services.isActive, true),
        sql`${services.id} != ALL(${existingIds})`
      )
    )
    .orderBy(asc(services.category), asc(services.displayOrder), asc(services.name));
}

// Type export for the clinic_services record
export type ClinicServiceRecord = typeof clinicServices.$inferSelect;
