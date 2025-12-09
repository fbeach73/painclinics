import { eq, asc, sql, and, count as countFn } from "drizzle-orm";
import { db } from "@/lib/db";
import { services, clinicServices } from "@/lib/schema";
import type {
  Service,
  ServiceCategory,
  ServiceWithCount,
  CreateServiceInput,
  UpdateServiceInput,
} from "@/types/service";

/**
 * Get all services, ordered by category and display order.
 *
 * @param activeOnly - If true, only return active services (default: false)
 * @returns Array of Service objects
 */
export async function getAllServices(activeOnly = false): Promise<Service[]> {
  const conditions = activeOnly ? eq(services.isActive, true) : undefined;

  const results = await db
    .select()
    .from(services)
    .where(conditions)
    .orderBy(asc(services.category), asc(services.displayOrder), asc(services.name));

  return results;
}

/**
 * Get a single service by ID.
 *
 * @param id - The service ID
 * @returns The service or null if not found
 */
export async function getServiceById(id: string): Promise<Service | null> {
  const results = await db
    .select()
    .from(services)
    .where(eq(services.id, id))
    .limit(1);

  return results[0] || null;
}

/**
 * Get a single service by its slug.
 *
 * @param slug - The service slug (URL-friendly identifier)
 * @returns The service or null if not found
 */
export async function getServiceBySlug(slug: string): Promise<Service | null> {
  const results = await db
    .select()
    .from(services)
    .where(eq(services.slug, slug))
    .limit(1);

  return results[0] || null;
}

/**
 * Get all services in a specific category.
 *
 * @param category - The service category
 * @param activeOnly - If true, only return active services (default: true)
 * @returns Array of Service objects
 */
export async function getServicesByCategory(
  category: ServiceCategory,
  activeOnly = true
): Promise<Service[]> {
  const conditions = activeOnly
    ? and(eq(services.category, category), eq(services.isActive, true))
    : eq(services.category, category);

  return db
    .select()
    .from(services)
    .where(conditions)
    .orderBy(asc(services.displayOrder), asc(services.name));
}

/**
 * Create a new service.
 *
 * @param data - The service data to create
 * @returns The created service
 */
export async function createService(data: CreateServiceInput): Promise<Service> {
  const results = await db
    .insert(services)
    .values({
      name: data.name,
      slug: data.slug,
      iconName: data.iconName,
      description: data.description ?? null,
      category: data.category,
      isActive: data.isActive ?? true,
      displayOrder: data.displayOrder ?? 0,
    })
    .returning();

  if (!results[0]) {
    throw new Error("Failed to create service");
  }

  return results[0];
}

/**
 * Update an existing service.
 *
 * @param id - The service ID to update
 * @param data - The fields to update
 * @returns The updated service
 * @throws Error if service not found
 */
export async function updateService(
  id: string,
  data: UpdateServiceInput
): Promise<Service> {
  const results = await db
    .update(services)
    .set({
      ...(data.name !== undefined && { name: data.name }),
      ...(data.slug !== undefined && { slug: data.slug }),
      ...(data.iconName !== undefined && { iconName: data.iconName }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.category !== undefined && { category: data.category }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.displayOrder !== undefined && { displayOrder: data.displayOrder }),
    })
    .where(eq(services.id, id))
    .returning();

  if (!results[0]) {
    throw new Error(`Service with id ${id} not found`);
  }

  return results[0];
}

/**
 * Delete a service by ID.
 * Will fail if there are clinic_services records referencing this service
 * (due to foreign key constraint).
 *
 * @param id - The service ID to delete
 * @throws Error if service not found or has clinic associations
 */
export async function deleteService(id: string): Promise<void> {
  // Check if any clinics are using this service
  const usageCount = await db
    .select({ count: countFn() })
    .from(clinicServices)
    .where(eq(clinicServices.serviceId, id));

  const count = usageCount[0]?.count ?? 0;
  if (count > 0) {
    throw new Error(
      `Cannot delete service: ${count} clinic(s) are using this service`
    );
  }

  const result = await db.delete(services).where(eq(services.id, id)).returning();

  if (result.length === 0) {
    throw new Error(`Service with id ${id} not found`);
  }
}

/**
 * Get all services with their clinic usage count.
 * Used for admin display to show how many clinics use each service.
 *
 * @returns Array of ServiceWithCount objects
 */
export async function getServicesWithClinicCount(): Promise<ServiceWithCount[]> {
  const results = await db
    .select({
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
      clinicCount: sql<number>`COUNT(${clinicServices.id})::int`,
    })
    .from(services)
    .leftJoin(clinicServices, eq(services.id, clinicServices.serviceId))
    .groupBy(services.id)
    .orderBy(asc(services.category), asc(services.displayOrder), asc(services.name));

  return results;
}

/**
 * Get services by multiple IDs.
 * Useful for fetching multiple services at once.
 *
 * @param ids - Array of service IDs
 * @returns Array of Service objects
 */
export async function getServicesByIds(ids: string[]): Promise<Service[]> {
  if (ids.length === 0) return [];

  return db
    .select()
    .from(services)
    .where(sql`${services.id} = ANY(${ids})`)
    .orderBy(asc(services.category), asc(services.displayOrder));
}

// Type export for the service record
export type ServiceRecord = typeof services.$inferSelect;
