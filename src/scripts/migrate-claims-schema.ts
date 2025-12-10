import "dotenv/config";
import { db } from "../lib/db";
import { sql } from "drizzle-orm";

async function migrateClaimsSchema() {
  console.log("============================================================");
  console.log("Starting claims schema migration...");
  console.log("============================================================\n");

  try {
    // Create enums if they don't exist
    console.log("Creating enums...");
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE claim_status AS ENUM ('pending', 'approved', 'rejected', 'expired');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE featured_tier AS ENUM ('none', 'basic', 'premium');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log("✓ Enums created\n");

    // Add new columns to clinics table
    console.log("Adding columns to clinics table...");
    await db.execute(sql`
      ALTER TABLE clinics
      ADD COLUMN IF NOT EXISTS owner_user_id text REFERENCES "user"(id),
      ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false NOT NULL,
      ADD COLUMN IF NOT EXISTS claimed_at timestamp,
      ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false NOT NULL,
      ADD COLUMN IF NOT EXISTS featured_tier featured_tier DEFAULT 'none',
      ADD COLUMN IF NOT EXISTS featured_until timestamp;
    `);
    console.log("✓ Clinics table updated\n");

    // Create indexes on clinics
    console.log("Creating indexes on clinics...");
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS clinics_owner_idx ON clinics(owner_user_id);
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS clinics_featured_idx ON clinics(is_featured);
    `);
    console.log("✓ Indexes created\n");

    // Create clinic_claims table
    console.log("Creating clinic_claims table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS clinic_claims (
        id text PRIMARY KEY,
        clinic_id text NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
        user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        full_name text NOT NULL,
        role text NOT NULL,
        business_email text NOT NULL,
        business_phone text NOT NULL,
        additional_notes text,
        status claim_status DEFAULT 'pending' NOT NULL,
        admin_notes text,
        rejection_reason text,
        ip_address text,
        user_agent text,
        reviewed_at timestamp,
        reviewed_by text REFERENCES "user"(id),
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      );
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS clinic_claims_clinic_idx ON clinic_claims(clinic_id);
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS clinic_claims_user_idx ON clinic_claims(user_id);
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS clinic_claims_status_idx ON clinic_claims(status);
    `);
    console.log("✓ clinic_claims table created\n");

    // Create featured_subscriptions table
    console.log("Creating featured_subscriptions table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS featured_subscriptions (
        id text PRIMARY KEY,
        clinic_id text NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
        user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        polar_subscription_id text UNIQUE,
        polar_customer_id text,
        polar_product_id text,
        tier featured_tier DEFAULT 'none' NOT NULL,
        billing_cycle text,
        status text DEFAULT 'active' NOT NULL,
        start_date timestamp NOT NULL,
        end_date timestamp,
        canceled_at timestamp,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      );
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS featured_subscriptions_clinic_idx ON featured_subscriptions(clinic_id);
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS featured_subscriptions_user_idx ON featured_subscriptions(user_id);
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS featured_subscriptions_polar_sub_idx ON featured_subscriptions(polar_subscription_id);
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS featured_subscriptions_status_idx ON featured_subscriptions(status);
    `);
    console.log("✓ featured_subscriptions table created\n");

    // Create claim_rate_limits table
    console.log("Creating claim_rate_limits table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS claim_rate_limits (
        id text PRIMARY KEY,
        ip_address text NOT NULL,
        claim_count integer DEFAULT 1 NOT NULL,
        window_start timestamp DEFAULT now() NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS claim_rate_limits_ip_idx ON claim_rate_limits(ip_address);
    `);
    console.log("✓ claim_rate_limits table created\n");

    console.log("============================================================");
    console.log("Migration complete!");
    console.log("============================================================");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }

  process.exit(0);
}

migrateClaimsSchema();
