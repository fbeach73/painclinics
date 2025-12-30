import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

async function migrate() {
  try {
    console.log("Creating broadcast_status enum...");
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE broadcast_status AS ENUM ('draft', 'sending', 'completed', 'failed');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    console.log("Creating target_audience enum...");
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE target_audience AS ENUM ('all_with_email', 'featured_only', 'by_state', 'by_tier', 'custom');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    console.log("Creating email_broadcasts table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS email_broadcasts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        subject TEXT NOT NULL,
        preview_text TEXT,
        html_content TEXT NOT NULL,
        target_audience target_audience DEFAULT 'all_with_email',
        target_filters JSONB,
        attachments JSONB,
        status broadcast_status DEFAULT 'draft',
        recipient_count INTEGER DEFAULT 0,
        sent_count INTEGER DEFAULT 0,
        failed_count INTEGER DEFAULT 0,
        opened_count INTEGER DEFAULT 0,
        clicked_count INTEGER DEFAULT 0,
        scheduled_at TIMESTAMP,
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        created_by TEXT REFERENCES "user"(id),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    console.log("Creating indexes...");
    await db.execute(sql`CREATE INDEX IF NOT EXISTS broadcast_status_idx ON email_broadcasts(status)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS broadcast_created_at_idx ON email_broadcasts(created_at)`);

    console.log("Migration complete!");
    process.exit(0);
  } catch (error) {
    console.error("Migration error:", error);
    process.exit(1);
  }
}

migrate();
