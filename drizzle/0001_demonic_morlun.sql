CREATE TABLE "clinics" (
	"id" text PRIMARY KEY NOT NULL,
	"wp_id" integer,
	"place_id" text,
	"title" text NOT NULL,
	"permalink" text NOT NULL,
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
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "clinics_place_id_unique" UNIQUE("place_id"),
	CONSTRAINT "clinics_permalink_unique" UNIQUE("permalink")
);
--> statement-breakpoint
CREATE TABLE "import_batches" (
	"id" text PRIMARY KEY NOT NULL,
	"file_name" text,
	"status" text DEFAULT 'pending',
	"total_records" integer DEFAULT 0,
	"success_count" integer DEFAULT 0,
	"error_count" integer DEFAULT 0,
	"skip_count" integer DEFAULT 0,
	"errors" jsonb,
	"imported_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role" text DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_imported_by_user_id_fk" FOREIGN KEY ("imported_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "clinics_place_id_idx" ON "clinics" USING btree ("place_id");--> statement-breakpoint
CREATE INDEX "clinics_city_idx" ON "clinics" USING btree ("city");--> statement-breakpoint
CREATE INDEX "clinics_state_idx" ON "clinics" USING btree ("state");--> statement-breakpoint
CREATE INDEX "clinics_postal_code_idx" ON "clinics" USING btree ("postal_code");--> statement-breakpoint
CREATE INDEX "clinics_rating_idx" ON "clinics" USING btree ("rating");--> statement-breakpoint
CREATE INDEX "clinics_import_batch_idx" ON "clinics" USING btree ("import_batch_id");--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "account_provider_account_idx" ON "account" USING btree ("provider_id","account_id");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_token_idx" ON "session" USING btree ("token");--> statement-breakpoint
CREATE INDEX "user_email_idx" ON "user" USING btree ("email");