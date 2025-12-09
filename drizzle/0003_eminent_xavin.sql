CREATE TYPE "public"."service_category" AS ENUM('injection', 'procedure', 'physical', 'diagnostic', 'management', 'specialized');--> statement-breakpoint
CREATE TABLE "clinic_services" (
	"id" text PRIMARY KEY NOT NULL,
	"clinic_id" text NOT NULL,
	"service_id" text NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"display_order" integer DEFAULT 0,
	"added_at" timestamp DEFAULT now() NOT NULL,
	"added_by" text
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"icon_name" text NOT NULL,
	"description" text,
	"category" "service_category" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "services_name_unique" UNIQUE("name"),
	CONSTRAINT "services_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "clinic_services" ADD CONSTRAINT "clinic_services_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinic_services" ADD CONSTRAINT "clinic_services_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinic_services" ADD CONSTRAINT "clinic_services_added_by_user_id_fk" FOREIGN KEY ("added_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "clinic_services_clinic_idx" ON "clinic_services" USING btree ("clinic_id");--> statement-breakpoint
CREATE INDEX "clinic_services_service_idx" ON "clinic_services" USING btree ("service_id");--> statement-breakpoint
CREATE INDEX "clinic_services_featured_idx" ON "clinic_services" USING btree ("clinic_id","is_featured");--> statement-breakpoint
CREATE INDEX "services_slug_idx" ON "services" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "services_category_idx" ON "services" USING btree ("category");