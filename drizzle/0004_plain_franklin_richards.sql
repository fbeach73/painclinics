CREATE TYPE "public"."claim_status" AS ENUM('pending', 'approved', 'rejected', 'expired');--> statement-breakpoint
CREATE TYPE "public"."featured_tier" AS ENUM('none', 'basic', 'premium');--> statement-breakpoint
CREATE TABLE "claim_rate_limits" (
	"id" text PRIMARY KEY NOT NULL,
	"ip_address" text NOT NULL,
	"claim_count" integer DEFAULT 1 NOT NULL,
	"window_start" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinic_claims" (
	"id" text PRIMARY KEY NOT NULL,
	"clinic_id" text NOT NULL,
	"user_id" text NOT NULL,
	"full_name" text NOT NULL,
	"role" text NOT NULL,
	"business_email" text NOT NULL,
	"business_phone" text NOT NULL,
	"additional_notes" text,
	"status" "claim_status" DEFAULT 'pending' NOT NULL,
	"admin_notes" text,
	"rejection_reason" text,
	"ip_address" text,
	"user_agent" text,
	"reviewed_at" timestamp,
	"reviewed_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "featured_subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"clinic_id" text NOT NULL,
	"user_id" text NOT NULL,
	"polar_subscription_id" text,
	"polar_customer_id" text,
	"polar_product_id" text,
	"tier" "featured_tier" DEFAULT 'none' NOT NULL,
	"billing_cycle" text,
	"status" text DEFAULT 'active' NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"canceled_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "featured_subscriptions_polar_subscription_id_unique" UNIQUE("polar_subscription_id")
);
--> statement-breakpoint
ALTER TABLE "clinics" ADD COLUMN "owner_user_id" text;--> statement-breakpoint
ALTER TABLE "clinics" ADD COLUMN "is_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "clinics" ADD COLUMN "claimed_at" timestamp;--> statement-breakpoint
ALTER TABLE "clinics" ADD COLUMN "is_featured" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "clinics" ADD COLUMN "featured_tier" "featured_tier" DEFAULT 'none';--> statement-breakpoint
ALTER TABLE "clinics" ADD COLUMN "featured_until" timestamp;--> statement-breakpoint
ALTER TABLE "clinic_claims" ADD CONSTRAINT "clinic_claims_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinic_claims" ADD CONSTRAINT "clinic_claims_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinic_claims" ADD CONSTRAINT "clinic_claims_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "featured_subscriptions" ADD CONSTRAINT "featured_subscriptions_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "featured_subscriptions" ADD CONSTRAINT "featured_subscriptions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "claim_rate_limits_ip_idx" ON "claim_rate_limits" USING btree ("ip_address");--> statement-breakpoint
CREATE INDEX "clinic_claims_clinic_idx" ON "clinic_claims" USING btree ("clinic_id");--> statement-breakpoint
CREATE INDEX "clinic_claims_user_idx" ON "clinic_claims" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "clinic_claims_status_idx" ON "clinic_claims" USING btree ("status");--> statement-breakpoint
CREATE INDEX "featured_subscriptions_clinic_idx" ON "featured_subscriptions" USING btree ("clinic_id");--> statement-breakpoint
CREATE INDEX "featured_subscriptions_user_idx" ON "featured_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "featured_subscriptions_polar_sub_idx" ON "featured_subscriptions" USING btree ("polar_subscription_id");--> statement-breakpoint
CREATE INDEX "featured_subscriptions_status_idx" ON "featured_subscriptions" USING btree ("status");--> statement-breakpoint
ALTER TABLE "clinics" ADD CONSTRAINT "clinics_owner_user_id_user_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "clinics_state_city_idx" ON "clinics" USING btree ("state_abbreviation","city");--> statement-breakpoint
CREATE INDEX "clinics_owner_idx" ON "clinics" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "clinics_featured_idx" ON "clinics" USING btree ("is_featured");