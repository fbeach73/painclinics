/**
 * Script to push schema changes to database
 * Bypasses interactive drizzle-kit prompts by using SQL directly
 */

import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import pg from "pg";
import "dotenv/config";

const { Pool } = pg;

async function main() {
  const connectionString = process.env.POSTGRES_URL;
  if (!connectionString) {
    throw new Error("POSTGRES_URL environment variable is required");
  }

  const pool = new Pool({ connectionString });
  const db = drizzle(pool);

  console.log("Creating clinics table if not exists...");

  // Create clinics table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "clinics" (
      "id" text PRIMARY KEY NOT NULL,
      "wp_id" integer,
      "place_id" text UNIQUE,
      "title" text NOT NULL,
      "permalink" text NOT NULL UNIQUE,
      "post_type" text DEFAULT 'pain-management',
      "clinic_type" text,
      "street_address" text,
      "city" text NOT NULL,
      "state" text NOT NULL,
      "state_abbreviation" text,
      "postal_code" text NOT NULL,
      "map_latitude" double precision NOT NULL,
      "map_longitude" double precision NOT NULL,
      "detailed_address" text,
      "phone" text,
      "phones" text[],
      "website" text,
      "emails" text[],
      "review_count" integer DEFAULT 0,
      "rating" double precision,
      "reviews_per_score" jsonb,
      "review_keywords" jsonb,
      "featured_reviews" jsonb,
      "clinic_hours" jsonb,
      "closed_on" text,
      "popular_times" jsonb,
      "content" text,
      "new_post_content" text,
      "image_url" text,
      "image_featured" text,
      "feat_image" text,
      "clinic_image_urls" text[],
      "clinic_image_media" text[],
      "qr_code" text,
      "amenities" text[],
      "checkbox_features" text[],
      "google_listing_link" text,
      "questions" jsonb,
      "facebook" text,
      "instagram" text,
      "twitter" text,
      "youtube" text,
      "linkedin" text,
      "tiktok" text,
      "pinterest" text,
      "import_batch_id" text,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL
    )
  `);

  console.log("Creating clinics indexes...");
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "clinics_place_id_idx" ON "clinics" USING btree ("place_id")`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "clinics_city_idx" ON "clinics" USING btree ("city")`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "clinics_state_idx" ON "clinics" USING btree ("state")`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "clinics_postal_code_idx" ON "clinics" USING btree ("postal_code")`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "clinics_rating_idx" ON "clinics" USING btree ("rating")`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "clinics_import_batch_idx" ON "clinics" USING btree ("import_batch_id")`);

  console.log("Creating import_batches table if not exists...");
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "import_batches" (
      "id" text PRIMARY KEY NOT NULL,
      "file_name" text,
      "status" text DEFAULT 'pending',
      "total_records" integer DEFAULT 0,
      "success_count" integer DEFAULT 0,
      "error_count" integer DEFAULT 0,
      "skip_count" integer DEFAULT 0,
      "errors" jsonb,
      "imported_by" text REFERENCES "user"("id"),
      "created_at" timestamp DEFAULT now() NOT NULL,
      "completed_at" timestamp
    )
  `);

  console.log("Creating optimization_batches table if not exists...");
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "optimization_batches" (
      "id" text PRIMARY KEY NOT NULL,
      "name" text,
      "status" text DEFAULT 'pending',
      "batch_size" integer DEFAULT 50,
      "review_frequency" integer DEFAULT 250,
      "target_word_count" integer DEFAULT 400,
      "include_keywords" boolean DEFAULT true,
      "generate_faq" boolean DEFAULT true,
      "faq_count" integer DEFAULT 4,
      "clinic_filters" jsonb,
      "total_clinics" integer DEFAULT 0,
      "processed_count" integer DEFAULT 0,
      "success_count" integer DEFAULT 0,
      "error_count" integer DEFAULT 0,
      "skipped_count" integer DEFAULT 0,
      "pending_review_count" integer DEFAULT 0,
      "approved_count" integer DEFAULT 0,
      "rejected_count" integer DEFAULT 0,
      "total_input_tokens" integer DEFAULT 0,
      "total_output_tokens" integer DEFAULT 0,
      "estimated_cost" double precision DEFAULT 0,
      "current_offset" integer DEFAULT 0,
      "errors" jsonb,
      "ai_model" text DEFAULT 'anthropic/claude-sonnet-4',
      "prompt_version" text DEFAULT 'v1.0',
      "started_by" text REFERENCES "user"("id"),
      "created_at" timestamp DEFAULT now() NOT NULL,
      "started_at" timestamp,
      "paused_at" timestamp,
      "completed_at" timestamp
    )
  `);

  console.log("Creating optimization_batches indexes...");
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "optimization_batches_status_idx" ON "optimization_batches" USING btree ("status")`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "optimization_batches_started_by_idx" ON "optimization_batches" USING btree ("started_by")`);

  console.log("Creating content_versions table if not exists...");
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "content_versions" (
      "id" text PRIMARY KEY NOT NULL,
      "clinic_id" text NOT NULL REFERENCES "clinics"("id") ON DELETE CASCADE,
      "version" integer NOT NULL DEFAULT 1,
      "original_content" text,
      "optimized_content" text,
      "keywords_used" jsonb,
      "faq_generated" jsonb,
      "changes_summary" text,
      "word_count_before" integer,
      "word_count_after" integer,
      "status" text DEFAULT 'pending',
      "optimization_batch_id" text REFERENCES "optimization_batches"("id"),
      "ai_model" text,
      "prompt_version" text,
      "input_tokens" integer,
      "output_tokens" integer,
      "cost" double precision,
      "validation_passed" boolean,
      "validation_warnings" jsonb,
      "validation_errors" jsonb,
      "requires_manual_review" boolean DEFAULT false,
      "reviewed_at" timestamp,
      "reviewed_by" text REFERENCES "user"("id"),
      "review_notes" text,
      "applied_at" timestamp,
      "applied_by" text REFERENCES "user"("id"),
      "created_at" timestamp DEFAULT now() NOT NULL,
      "optimized_at" timestamp
    )
  `);

  console.log("Creating content_versions indexes...");
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "content_versions_clinic_idx" ON "content_versions" USING btree ("clinic_id")`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "content_versions_batch_idx" ON "content_versions" USING btree ("optimization_batch_id")`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "content_versions_status_idx" ON "content_versions" USING btree ("status")`);

  console.log("Adding FK constraint for clinic_services -> clinics...");
  try {
    await db.execute(sql`
      ALTER TABLE "clinic_services"
      ADD CONSTRAINT "clinic_services_clinic_id_clinics_id_fk"
      FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE
    `);
    console.log("FK constraint added successfully");
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes("already exists")) {
      console.log("FK constraint already exists, skipping");
    } else {
      throw e;
    }
  }

  console.log("Schema push complete!");
  await pool.end();
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
