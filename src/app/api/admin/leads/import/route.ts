import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { clinics, clinicLeads } from "@/lib/schema";
import { createLead } from "@/lib/lead-queries";
import { eq, ilike, and } from "drizzle-orm";

// API key for import endpoint (set in environment)
const IMPORT_API_KEY = process.env.LEADS_IMPORT_API_KEY;

// Schema for a single lead import
const leadImportSchema = z.object({
  // Clinic identification (need at least one)
  clinicName: z.string().min(1),
  clinicCity: z.string().optional(),
  clinicState: z.string().optional(),

  // Patient info (required)
  patientName: z.string().min(1),
  patientEmail: z.string().email(),
  patientPhone: z.string().min(1),
  preferredContactTime: z.string().default("anytime"),

  // Medical intake (required)
  painType: z.string().min(1),
  painDuration: z.string().min(1),
  previousTreatment: z.string().min(1),
  insurance: z.string().min(1),

  // Optional
  additionalInfo: z.string().optional(),

  // Submission timestamp (ISO string or parseable date)
  submittedAt: z.string().optional(),

  // Status for imported leads (default to "contacted" since these are historical)
  status: z.enum(["new", "contacted", "qualified", "closed"]).default("contacted"),
});

const bulkImportSchema = z.object({
  leads: z.array(leadImportSchema).min(1).max(500),
});

type LeadImport = z.infer<typeof leadImportSchema>;

/**
 * Find clinic by name (and optionally city/state)
 */
async function findClinic(
  clinicName: string,
  clinicCity?: string,
  clinicState?: string
): Promise<{ id: string } | null> {
  const conditions = [ilike(clinics.title, `%${clinicName}%`)];

  if (clinicCity) {
    conditions.push(ilike(clinics.city, `%${clinicCity}%`));
  }

  if (clinicState) {
    // Try both full state name and abbreviation
    conditions.push(
      ilike(clinics.stateAbbreviation, clinicState.length === 2 ? clinicState : `%${clinicState}%`)
    );
  }

  const result = await db
    .select({ id: clinics.id })
    .from(clinics)
    .where(and(...conditions))
    .limit(1);

  return result[0] ?? null;
}

/**
 * POST /api/admin/leads/import
 * Import historical leads from parsed email data
 *
 * Headers:
 *   x-api-key: Your LEADS_IMPORT_API_KEY
 *
 * Body (single):
 *   { clinicName, patientName, patientEmail, ... }
 *
 * Body (bulk):
 *   { leads: [{ clinicName, patientName, ... }, ...] }
 */
export async function POST(request: NextRequest) {
  // Verify API key
  const apiKey = request.headers.get("x-api-key");
  if (!IMPORT_API_KEY || apiKey !== IMPORT_API_KEY) {
    return NextResponse.json(
      { error: "Unauthorized - invalid or missing API key" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    // Determine if single or bulk import
    const isBulk = "leads" in body && Array.isArray(body.leads);
    let leadsToImport: LeadImport[];

    if (isBulk) {
      const validation = bulkImportSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { error: "Validation failed", details: validation.error.flatten() },
          { status: 400 }
        );
      }
      leadsToImport = validation.data.leads;
    } else {
      const validation = leadImportSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { error: "Validation failed", details: validation.error.flatten() },
          { status: 400 }
        );
      }
      leadsToImport = [validation.data];
    }

    // Process each lead
    const results: {
      success: boolean;
      patientEmail: string;
      clinicName: string;
      error?: string;
      leadId?: string;
    }[] = [];

    for (const lead of leadsToImport) {
      try {
        // Find the clinic
        const clinic = await findClinic(
          lead.clinicName,
          lead.clinicCity,
          lead.clinicState
        );

        if (!clinic) {
          results.push({
            success: false,
            patientEmail: lead.patientEmail,
            clinicName: lead.clinicName,
            error: `Clinic not found: ${lead.clinicName}${lead.clinicCity ? ` in ${lead.clinicCity}` : ""}${lead.clinicState ? `, ${lead.clinicState}` : ""}`,
          });
          continue;
        }

        // Parse submission date if provided
        let createdAt: Date | undefined;
        if (lead.submittedAt) {
          const parsed = new Date(lead.submittedAt);
          if (!isNaN(parsed.getTime())) {
            createdAt = parsed;
          }
        }

        // Normalize preferredContactTime
        const normalizedContactTime = normalizeContactTime(lead.preferredContactTime);

        // Create the lead
        const newLead = await createLead({
          clinicId: clinic.id,
          patientName: lead.patientName,
          patientEmail: lead.patientEmail,
          patientPhone: lead.patientPhone,
          preferredContactTime: normalizedContactTime,
          additionalInfo: lead.additionalInfo || null,
          painType: lead.painType,
          painDuration: lead.painDuration,
          previousTreatment: lead.previousTreatment,
          insurance: lead.insurance,
          formData: {
            imported: true,
            importedAt: new Date().toISOString(),
            originalSubmittedAt: lead.submittedAt,
          },
        });

        // Update status and createdAt if needed (createLead doesn't support these directly)
        if (lead.status !== "new" || createdAt) {
          await db
            .update(clinicLeads)
            .set({
              status: lead.status,
              ...(createdAt && { createdAt }),
              // Mark as already followed up for historical leads
              ...(lead.status === "contacted" && { followedUpAt: createdAt || new Date() }),
            })
            .where(eq(clinicLeads.id, newLead.id));
        }

        results.push({
          success: true,
          patientEmail: lead.patientEmail,
          clinicName: lead.clinicName,
          leadId: newLead.id,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        results.push({
          success: false,
          patientEmail: lead.patientEmail,
          clinicName: lead.clinicName,
          error: message,
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      message: `Imported ${successCount} leads${failCount > 0 ? `, ${failCount} failed` : ""}`,
      total: results.length,
      success: successCount,
      failed: failCount,
      results,
    });
  } catch (error) {
    console.error("Error importing leads:", error);
    return NextResponse.json(
      { error: "Failed to import leads" },
      { status: 500 }
    );
  }
}

/**
 * Normalize contact time strings from email to our enum values
 */
function normalizeContactTime(time: string): string {
  const lower = time.toLowerCase();
  if (lower.includes("morning")) return "morning";
  if (lower.includes("afternoon")) return "afternoon";
  if (lower.includes("evening")) return "evening";
  if (lower.includes("anytime") || lower.includes("any time")) return "anytime";
  return time; // Return as-is if no match
}
