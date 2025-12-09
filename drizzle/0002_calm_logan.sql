CREATE TABLE "content_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"clinic_id" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"original_content" text,
	"optimized_content" text,
	"keywords_used" jsonb,
	"faq_generated" jsonb,
	"changes_summary" text,
	"word_count_before" integer,
	"word_count_after" integer,
	"status" text DEFAULT 'pending',
	"optimization_batch_id" text,
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
	"reviewed_by" text,
	"review_notes" text,
	"applied_at" timestamp,
	"applied_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"optimized_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "optimization_batches" (
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
	"started_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"started_at" timestamp,
	"paused_at" timestamp,
	"completed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "content_versions" ADD CONSTRAINT "content_versions_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_versions" ADD CONSTRAINT "content_versions_optimization_batch_id_optimization_batches_id_fk" FOREIGN KEY ("optimization_batch_id") REFERENCES "public"."optimization_batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_versions" ADD CONSTRAINT "content_versions_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_versions" ADD CONSTRAINT "content_versions_applied_by_user_id_fk" FOREIGN KEY ("applied_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "optimization_batches" ADD CONSTRAINT "optimization_batches_started_by_user_id_fk" FOREIGN KEY ("started_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "content_versions_clinic_idx" ON "content_versions" USING btree ("clinic_id");--> statement-breakpoint
CREATE INDEX "content_versions_batch_idx" ON "content_versions" USING btree ("optimization_batch_id");--> statement-breakpoint
CREATE INDEX "content_versions_status_idx" ON "content_versions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "optimization_batches_status_idx" ON "optimization_batches" USING btree ("status");--> statement-breakpoint
CREATE INDEX "optimization_batches_started_by_idx" ON "optimization_batches" USING btree ("started_by");