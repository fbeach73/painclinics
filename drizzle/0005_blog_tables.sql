-- Blog Post Status Enum
DO $$ BEGIN
    CREATE TYPE "public"."blog_post_status" AS ENUM('draft', 'published', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Blog Posts Table
CREATE TABLE IF NOT EXISTS "blog_posts" (
    "id" text PRIMARY KEY NOT NULL,
    "wp_id" integer UNIQUE,
    "title" text NOT NULL,
    "slug" text NOT NULL UNIQUE,
    "content" text NOT NULL,
    "excerpt" text,
    "meta_title" text,
    "meta_description" text,
    "featured_image_url" text,
    "featured_image_alt" text,
    "wp_featured_image_url" text,
    "author_name" text,
    "author_slug" text,
    "status" "blog_post_status" DEFAULT 'published' NOT NULL,
    "published_at" timestamp,
    "wp_created_at" timestamp,
    "wp_modified_at" timestamp,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    "import_batch_id" text,
    "migration_metadata" jsonb
);

-- Blog Categories Table
CREATE TABLE IF NOT EXISTS "blog_categories" (
    "id" text PRIMARY KEY NOT NULL,
    "wp_id" integer UNIQUE,
    "name" text NOT NULL,
    "slug" text NOT NULL UNIQUE,
    "description" text,
    "parent_id" text,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Blog Tags Table
CREATE TABLE IF NOT EXISTS "blog_tags" (
    "id" text PRIMARY KEY NOT NULL,
    "wp_id" integer UNIQUE,
    "name" text NOT NULL,
    "slug" text NOT NULL UNIQUE,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Blog Post Categories Junction Table
CREATE TABLE IF NOT EXISTS "blog_post_categories" (
    "id" text PRIMARY KEY NOT NULL,
    "post_id" text NOT NULL REFERENCES "blog_posts"("id") ON DELETE CASCADE,
    "category_id" text NOT NULL REFERENCES "blog_categories"("id") ON DELETE CASCADE,
    "created_at" timestamp DEFAULT now() NOT NULL
);

-- Blog Post Tags Junction Table
CREATE TABLE IF NOT EXISTS "blog_post_tags" (
    "id" text PRIMARY KEY NOT NULL,
    "post_id" text NOT NULL REFERENCES "blog_posts"("id") ON DELETE CASCADE,
    "tag_id" text NOT NULL REFERENCES "blog_tags"("id") ON DELETE CASCADE,
    "created_at" timestamp DEFAULT now() NOT NULL
);

-- Blog Import Batches Table
CREATE TABLE IF NOT EXISTS "blog_import_batches" (
    "id" text PRIMARY KEY NOT NULL,
    "status" text DEFAULT 'pending',
    "source_url" text,
    "total_posts_found" integer DEFAULT 0,
    "posts_processed" integer DEFAULT 0,
    "posts_success" integer DEFAULT 0,
    "posts_error" integer DEFAULT 0,
    "posts_skipped" integer DEFAULT 0,
    "images_processed" integer DEFAULT 0,
    "images_success" integer DEFAULT 0,
    "images_error" integer DEFAULT 0,
    "categories_created" integer DEFAULT 0,
    "tags_created" integer DEFAULT 0,
    "errors" jsonb,
    "image_mapping" jsonb,
    "redirects" jsonb,
    "imported_by" text REFERENCES "user"("id"),
    "created_at" timestamp DEFAULT now() NOT NULL,
    "completed_at" timestamp
);

-- Indexes for blog_posts
CREATE INDEX IF NOT EXISTS "blog_posts_slug_idx" ON "blog_posts" ("slug");
CREATE INDEX IF NOT EXISTS "blog_posts_wp_id_idx" ON "blog_posts" ("wp_id");
CREATE INDEX IF NOT EXISTS "blog_posts_status_idx" ON "blog_posts" ("status");
CREATE INDEX IF NOT EXISTS "blog_posts_published_at_idx" ON "blog_posts" ("published_at");
CREATE INDEX IF NOT EXISTS "blog_posts_import_batch_idx" ON "blog_posts" ("import_batch_id");

-- Indexes for blog_categories
CREATE INDEX IF NOT EXISTS "blog_categories_slug_idx" ON "blog_categories" ("slug");
CREATE INDEX IF NOT EXISTS "blog_categories_wp_id_idx" ON "blog_categories" ("wp_id");
CREATE INDEX IF NOT EXISTS "blog_categories_parent_idx" ON "blog_categories" ("parent_id");

-- Indexes for blog_tags
CREATE INDEX IF NOT EXISTS "blog_tags_slug_idx" ON "blog_tags" ("slug");
CREATE INDEX IF NOT EXISTS "blog_tags_wp_id_idx" ON "blog_tags" ("wp_id");

-- Indexes for blog_post_categories
CREATE INDEX IF NOT EXISTS "blog_post_categories_post_idx" ON "blog_post_categories" ("post_id");
CREATE INDEX IF NOT EXISTS "blog_post_categories_category_idx" ON "blog_post_categories" ("category_id");

-- Indexes for blog_post_tags
CREATE INDEX IF NOT EXISTS "blog_post_tags_post_idx" ON "blog_post_tags" ("post_id");
CREATE INDEX IF NOT EXISTS "blog_post_tags_tag_idx" ON "blog_post_tags" ("tag_id");
