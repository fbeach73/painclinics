import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  boolean,
  index,
  uniqueIndex,
  integer,
  doublePrecision,
  jsonb,
  varchar,
  numeric,
} from "drizzle-orm/pg-core";

// ============================================
// Enums
// ============================================

export const serviceCategoryEnum = pgEnum("service_category", [
  "injection",
  "procedure",
  "physical",
  "diagnostic",
  "management",
  "specialized",
]);

export const claimStatusEnum = pgEnum("claim_status", [
  "pending",
  "approved",
  "rejected",
  "expired",
]);

export const featuredTierEnum = pgEnum("featured_tier", [
  "none",
  "basic",
  "premium",
]);

export const emailStatusEnum = pgEnum("email_status", [
  "queued",
  "delivered",
  "bounced",
  "complained",
  "failed",
  "opened",
  "clicked",
]);

export const blogPostStatusEnum = pgEnum("blog_post_status", [
  "draft",
  "published",
  "archived",
]);

export const clinicStatusEnum = pgEnum("clinic_status", [
  "draft",
  "published",
  "deleted",
]);

// ============================================
// Google Places Sync Enums
// ============================================

export const syncScheduleFrequencyEnum = pgEnum("sync_schedule_frequency", [
  "manual",
  "daily",
  "weekly",
  "monthly",
]);

export const syncStatusEnum = pgEnum("sync_status", [
  "pending",
  "in_progress",
  "completed",
  "failed",
  "cancelled",
]);

// ============================================
// Email Broadcast Enums
// ============================================

export const broadcastStatusEnum = pgEnum("broadcast_status", [
  "draft",
  "sending",
  "completed",
  "failed",
]);

export const targetAudienceEnum = pgEnum("target_audience", [
  "all_with_email",
  "featured_only",
  "claimed_owners",
  "by_state",
  "by_tier",
  "custom",
  "manual",
]);

export const leadStatusEnum = pgEnum("lead_status", [
  "new",
  "contacted",
  "qualified",
  "closed",
]);

// ============================================
// Ad Server Enums
// ============================================

export const adStatusEnum = pgEnum("ad_status", [
  "active",
  "paused",
  "ended",
]);

export const adCreativeTypeEnum = pgEnum("ad_creative_type", [
  "image_banner",
  "html",
  "text",
  "native",
]);

export const adAspectRatioEnum = pgEnum("ad_aspect_ratio", [
  "1:1",
  "16:9",
  "21:9",
  "4:3",
  "3:2",
  "auto",
]);

export const adPageTypeEnum = pgEnum("ad_page_type", [
  "clinic",
  "directory",
  "blog",
  "homepage",
  "global",
]);

export const user = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    image: text("image"),
    role: text("role").default("user").notNull(), // "user" | "admin" | "clinic_owner"
    // Email preferences
    emailUnsubscribedAt: timestamp("email_unsubscribed_at"),
    unsubscribeToken: text("unsubscribe_token").unique(),
    // Stripe integration
    stripeCustomerId: text("stripe_customer_id"),
    // Activity tracking
    lastLoginAt: timestamp("last_login_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("user_email_idx").on(table.email)]
);

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("session_user_id_idx").on(table.userId),
    index("session_token_idx").on(table.token),
  ]
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("account_user_id_idx").on(table.userId),
    index("account_provider_account_idx").on(table.providerId, table.accountId),
  ]
);

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

// ============================================
// Clinic Data Import Tables
// ============================================

export const clinics = pgTable(
  "clinics",
  {
    // Primary identification
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    wpId: integer("wp_id"),
    placeId: text("place_id").unique(),
    title: text("title").notNull(),
    permalink: text("permalink").notNull().unique(),
    postType: text("post_type").default("pain-management"),
    clinicType: text("clinic_type"),

    // Location
    streetAddress: text("street_address"),
    city: text("city").notNull(),
    state: text("state").notNull(),
    stateAbbreviation: text("state_abbreviation"),
    postalCode: text("postal_code").notNull(),
    mapLatitude: doublePrecision("map_latitude").notNull(),
    mapLongitude: doublePrecision("map_longitude").notNull(),
    detailedAddress: text("detailed_address"),

    // Contact
    phone: text("phone"),
    phones: text("phones").array(),
    website: text("website"),
    emails: text("emails").array(),

    // Reviews & Ratings
    reviewCount: integer("review_count").default(0),
    rating: doublePrecision("rating"),
    reviewsPerScore: jsonb("reviews_per_score"),
    reviewKeywords: jsonb("review_keywords"),
    featuredReviews: jsonb("featured_reviews"),
    detailedReviews: jsonb("detailed_reviews"), // Full review objects array from Outscraper
    allReviewsText: text("all_reviews_text"), // Concatenated stripped reviews for AI content generation

    // Business Info
    priceRange: varchar("price_range", { length: 50 }), // Price range from Outscraper 'range' field
    businessDescription: text("business_description"), // From Outscraper 'about' field

    // Business Hours
    clinicHours: jsonb("clinic_hours"),
    closedOn: text("closed_on"),
    popularTimes: jsonb("popular_times"),
    timezone: text("timezone"), // IANA timezone e.g. "America/New_York", derived from lat/lng

    // Content
    content: text("content"),
    newPostContent: text("new_post_content"),

    // Images
    imageUrl: text("image_url"),
    imageFeatured: text("image_featured"),
    featImage: text("feat_image"),
    clinicImageUrls: text("clinic_image_urls").array(),
    clinicImageMedia: text("clinic_image_media").array(),
    qrCode: text("qr_code"),

    // Amenities & Features
    amenities: text("amenities").array(),
    normalizedAmenities: text("normalized_amenities").array(), // Controlled vocabulary for filtering
    checkboxFeatures: text("checkbox_features").array(),

    // Payment & Insurance (populated by crawl4ai extraction + NPPES matching)
    paymentMethods: text("payment_methods").array(), // "credit-card", "cash", "check", "financing", "sliding-scale"
    npi: text("npi"), // National Provider Identifier from CMS NPPES registry
    googleListingLink: text("google_listing_link"),

    // Q&A
    questions: jsonb("questions"),

    // Social Media
    facebook: text("facebook"),
    instagram: text("instagram"),
    twitter: text("twitter"),
    youtube: text("youtube"),
    linkedin: text("linkedin"),
    tiktok: text("tiktok"),
    pinterest: text("pinterest"),

    // Metadata
    importBatchId: text("import_batch_id"),
    importedAt: timestamp("imported_at"), // When clinic was first imported (for NEW badge)
    importUpdatedAt: timestamp("import_updated_at"), // When existing clinic was updated via import (for UPDATED badge)
    status: clinicStatusEnum("status").default("published").notNull(),
    publishedAt: timestamp("published_at"), // When clinic was first published (null if never published)
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),

    // Ownership & Claiming
    ownerUserId: text("owner_user_id").references(() => user.id),
    isVerified: boolean("is_verified").default(false).notNull(),
    claimedAt: timestamp("claimed_at"),

    // Featured Listings
    isFeatured: boolean("is_featured").default(false).notNull(),
    featuredTier: featuredTierEnum("featured_tier").default("none"),
    featuredUntil: timestamp("featured_until"),
  },
  (table) => [
    index("clinics_place_id_idx").on(table.placeId),
    index("clinics_city_idx").on(table.city),
    index("clinics_state_idx").on(table.state),
    index("clinics_state_city_idx").on(table.stateAbbreviation, table.city),
    index("clinics_postal_code_idx").on(table.postalCode),
    index("clinics_rating_idx").on(table.rating),
    index("clinics_import_batch_idx").on(table.importBatchId),
    index("clinics_owner_idx").on(table.ownerUserId),
    index("clinics_featured_idx").on(table.isFeatured),
    index("clinics_status_idx").on(table.status),
    index("clinics_created_at_idx").on(table.createdAt),
    index("clinics_published_at_idx").on(table.publishedAt),
    // Directory filter indexes
    index("clinics_state_city_rating_idx").on(table.stateAbbreviation, table.city, table.rating),
  ]
);

export const importBatches = pgTable("import_batches", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  fileName: text("file_name"),
  status: text("status").default("pending"), // pending, processing, completed, failed, rolled_back
  totalRecords: integer("total_records").default(0),
  successCount: integer("success_count").default(0),
  errorCount: integer("error_count").default(0),
  skipCount: integer("skip_count").default(0),
  errors: jsonb("errors"),
  importedBy: text("imported_by").references(() => user.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

// ============================================
// Services Tables
// ============================================

export const services = pgTable(
  "services",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    name: text("name").notNull().unique(),
    slug: text("slug").notNull().unique(),
    iconName: text("icon_name").notNull(),
    description: text("description"),
    category: serviceCategoryEnum("category").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    displayOrder: integer("display_order").default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("services_slug_idx").on(table.slug),
    index("services_category_idx").on(table.category),
  ]
);

export const clinicServices = pgTable(
  "clinic_services",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    clinicId: text("clinic_id")
      .notNull()
      .references(() => clinics.id, { onDelete: "cascade" }),
    serviceId: text("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "cascade" }),
    isFeatured: boolean("is_featured").default(false).notNull(),
    displayOrder: integer("display_order").default(0),
    addedAt: timestamp("added_at").defaultNow().notNull(),
    addedBy: text("added_by").references(() => user.id),
  },
  (table) => [
    index("clinic_services_clinic_idx").on(table.clinicId),
    index("clinic_services_service_idx").on(table.serviceId),
    index("clinic_services_featured_idx").on(table.clinicId, table.isFeatured),
  ]
);

// ============================================
// Insurance Tables
// ============================================

export const insuranceProviders = pgTable(
  "insurance_providers",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    name: text("name").notNull().unique(),
    slug: text("slug").notNull().unique(),
    displayOrder: integer("display_order").default(0),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("insurance_providers_slug_idx").on(table.slug),
  ]
);

export const clinicInsurance = pgTable(
  "clinic_insurance",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    clinicId: text("clinic_id")
      .notNull()
      .references(() => clinics.id, { onDelete: "cascade" }),
    insuranceId: text("insurance_id")
      .notNull()
      .references(() => insuranceProviders.id, { onDelete: "cascade" }),
    addedAt: timestamp("added_at").defaultNow().notNull(),
    addedBy: text("added_by").references(() => user.id),
  },
  (table) => [
    uniqueIndex("clinic_insurance_unique_idx").on(table.clinicId, table.insuranceId),
    index("clinic_insurance_clinic_idx").on(table.clinicId),
    index("clinic_insurance_insurance_idx").on(table.insuranceId),
  ]
);

// ============================================
// Clinic Claims Tables
// ============================================

export const clinicClaims = pgTable(
  "clinic_claims",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    clinicId: text("clinic_id")
      .notNull()
      .references(() => clinics.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    // Claimant information
    fullName: text("full_name").notNull(),
    role: text("role").notNull(), // "owner" | "manager" | "authorized_representative"
    businessEmail: text("business_email").notNull(),
    businessPhone: text("business_phone").notNull(),
    additionalNotes: text("additional_notes"),

    // Status tracking
    status: claimStatusEnum("status").default("pending").notNull(),
    adminNotes: text("admin_notes"),
    rejectionReason: text("rejection_reason"),

    // Anti-fraud tracking
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),

    // Review tracking
    reviewedAt: timestamp("reviewed_at"),
    reviewedBy: text("reviewed_by").references(() => user.id),

    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("clinic_claims_clinic_idx").on(table.clinicId),
    index("clinic_claims_user_idx").on(table.userId),
    index("clinic_claims_status_idx").on(table.status),
  ]
);

export const featuredSubscriptions = pgTable(
  "featured_subscriptions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    clinicId: text("clinic_id")
      .notNull()
      .references(() => clinics.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    // Stripe integration
    stripeSubscriptionId: text("stripe_subscription_id").unique(),
    stripeCustomerId: text("stripe_customer_id"),
    stripePriceId: text("stripe_price_id"),

    // Subscription details
    tier: featuredTierEnum("tier").default("none").notNull(),
    billingCycle: text("billing_cycle"), // "monthly" | "annual"

    // Status
    status: text("status").default("active").notNull(), // "active" | "canceled" | "past_due" | "expired"

    // Dates
    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date"),
    canceledAt: timestamp("canceled_at"),

    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("featured_subscriptions_clinic_idx").on(table.clinicId),
    index("featured_subscriptions_user_idx").on(table.userId),
    index("featured_subscriptions_stripe_sub_idx").on(table.stripeSubscriptionId),
    index("featured_subscriptions_status_idx").on(table.status),
  ]
);

export const claimRateLimits = pgTable(
  "claim_rate_limits",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    ipAddress: text("ip_address").notNull(),
    claimCount: integer("claim_count").default(1).notNull(),
    windowStart: timestamp("window_start").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("claim_rate_limits_ip_idx").on(table.ipAddress)]
);

// ============================================
// Email Logs Table
// ============================================

export const emailLogs = pgTable(
  "email_logs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("user_id").references(() => user.id),
    recipientEmail: text("recipient_email").notNull(),
    templateName: text("template_name").notNull(),
    subject: text("subject").notNull(),
    mailgunMessageId: text("mailgun_message_id").unique(),
    status: emailStatusEnum("status").default("queued"),
    metadata: jsonb("metadata"), // { clinicId?, claimId?, subscriptionId? }
    errorMessage: text("error_message"),
    sentAt: timestamp("sent_at").defaultNow(),
    deliveredAt: timestamp("delivered_at"),
    openedAt: timestamp("opened_at"),
    clickedAt: timestamp("clicked_at"),
    bouncedAt: timestamp("bounced_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("email_logs_user_idx").on(table.userId),
    index("email_logs_recipient_idx").on(table.recipientEmail),
    index("email_logs_template_idx").on(table.templateName),
    index("email_logs_status_idx").on(table.status),
    index("email_logs_mailgun_id_idx").on(table.mailgunMessageId),
    index("email_logs_sent_at_idx").on(table.sentAt),
  ]
);

// ============================================
// Clinic Leads Table
// ============================================

export const clinicLeads = pgTable(
  "clinic_leads",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    clinicId: text("clinic_id")
      .notNull()
      .references(() => clinics.id, { onDelete: "cascade" }),

    // Patient Information
    patientName: text("patient_name").notNull(),
    patientEmail: text("patient_email").notNull(),
    patientPhone: text("patient_phone").notNull(),
    preferredContactTime: text("preferred_contact_time").notNull(),
    additionalInfo: text("additional_info"),

    // Medical Intake
    painType: text("pain_type").notNull(),
    painDuration: text("pain_duration").notNull(),
    previousTreatment: text("previous_treatment").notNull(),
    insurance: text("insurance").notNull(),

    // Full form data for reference
    formData: jsonb("form_data"),

    // Status Management
    status: leadStatusEnum("status").default("new").notNull(),

    // Follow-up Tracking
    followedUpAt: timestamp("followed_up_at"),
    followUpDate: timestamp("follow_up_date"),

    // Admin Notes
    adminNotes: text("admin_notes"),

    // Email Log References
    clinicEmailLogId: text("clinic_email_log_id").references(() => emailLogs.id),
    patientEmailLogId: text("patient_email_log_id").references(() => emailLogs.id),

    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("clinic_leads_clinic_idx").on(table.clinicId),
    index("clinic_leads_status_idx").on(table.status),
    index("clinic_leads_created_at_idx").on(table.createdAt),
    index("clinic_leads_patient_email_idx").on(table.patientEmail),
    index("clinic_leads_followed_up_at_idx").on(table.followedUpAt),
  ]
);

// ============================================
// Email Broadcasts Table
// ============================================

export const emailBroadcasts = pgTable(
  "email_broadcasts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    name: text("name").notNull(),
    subject: text("subject").notNull(),
    previewText: text("preview_text"),
    htmlContent: text("html_content").notNull(),
    targetAudience: targetAudienceEnum("target_audience").default("all_with_email"),
    targetFilters: jsonb("target_filters"), // { states?: string[], tiers?: string[], excludeUnsubscribed?: boolean }
    attachments: jsonb("attachments"), // [{ url: string, filename: string, size: number }]
    status: broadcastStatusEnum("status").default("draft"),
    recipientCount: integer("recipient_count").default(0),
    sentCount: integer("sent_count").default(0),
    failedCount: integer("failed_count").default(0),
    openedCount: integer("opened_count").default(0),
    clickedCount: integer("clicked_count").default(0),
    scheduledAt: timestamp("scheduled_at"),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    createdBy: text("created_by").references(() => user.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("broadcast_status_idx").on(table.status),
    index("broadcast_created_at_idx").on(table.createdAt),
  ]
);

// ============================================
// Email Unsubscribes Table
// ============================================
// Tracks unsubscribes for emails that don't have user accounts
// (e.g., clinic emails without claimed owners)

export const emailUnsubscribes = pgTable(
  "email_unsubscribes",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    email: text("email").notNull(),
    token: text("token").notNull().unique(),
    clinicId: text("clinic_id").references(() => clinics.id), // Optional link to clinic
    unsubscribedAt: timestamp("unsubscribed_at"), // null = token created but not yet used
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("email_unsubscribes_email_idx").on(table.email),
    index("email_unsubscribes_token_idx").on(table.token),
    index("email_unsubscribes_clinic_idx").on(table.clinicId),
  ]
);

// ============================================
// Blog Tables
// ============================================

export const blogPosts = pgTable(
  "blog_posts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    wpId: integer("wp_id").unique(), // WordPress ID for deduplication
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(), // Must match WordPress exactly
    content: text("content").notNull(), // Processed HTML with Blob URLs
    excerpt: text("excerpt"),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    featuredImageUrl: text("featured_image_url"), // Vercel Blob URL
    featuredImageAlt: text("featured_image_alt"),
    wpFeaturedImageUrl: text("wp_featured_image_url"), // Original WP URL
    authorName: text("author_name"),
    authorSlug: text("author_slug"),
    status: blogPostStatusEnum("status").default("published").notNull(),
    publishedAt: timestamp("published_at"),
    wpCreatedAt: timestamp("wp_created_at"),
    wpModifiedAt: timestamp("wp_modified_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    importBatchId: text("import_batch_id"),
    migrationMetadata: jsonb("migration_metadata"), // { wpUrl, imageMapping, errors }
  },
  (table) => [
    index("blog_posts_slug_idx").on(table.slug),
    index("blog_posts_wp_id_idx").on(table.wpId),
    index("blog_posts_status_idx").on(table.status),
    index("blog_posts_published_at_idx").on(table.publishedAt),
    index("blog_posts_import_batch_idx").on(table.importBatchId),
  ]
);

export const blogCategories = pgTable(
  "blog_categories",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    wpId: integer("wp_id").unique(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    parentId: text("parent_id"), // Self-reference for hierarchy
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("blog_categories_slug_idx").on(table.slug),
    index("blog_categories_wp_id_idx").on(table.wpId),
    index("blog_categories_parent_idx").on(table.parentId),
  ]
);

export const blogTags = pgTable(
  "blog_tags",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    wpId: integer("wp_id").unique(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("blog_tags_slug_idx").on(table.slug),
    index("blog_tags_wp_id_idx").on(table.wpId),
  ]
);

export const blogPostCategories = pgTable(
  "blog_post_categories",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    postId: text("post_id")
      .notNull()
      .references(() => blogPosts.id, { onDelete: "cascade" }),
    categoryId: text("category_id")
      .notNull()
      .references(() => blogCategories.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("blog_post_categories_post_idx").on(table.postId),
    index("blog_post_categories_category_idx").on(table.categoryId),
  ]
);

export const blogPostTags = pgTable(
  "blog_post_tags",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    postId: text("post_id")
      .notNull()
      .references(() => blogPosts.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => blogTags.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("blog_post_tags_post_idx").on(table.postId),
    index("blog_post_tags_tag_idx").on(table.tagId),
  ]
);

export const blogImportBatches = pgTable("blog_import_batches", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  status: text("status").default("pending"), // pending, fetching, migrating_images, processing, completed, failed
  sourceUrl: text("source_url"),
  totalPostsFound: integer("total_posts_found").default(0),
  postsProcessed: integer("posts_processed").default(0),
  postsSuccess: integer("posts_success").default(0),
  postsError: integer("posts_error").default(0),
  postsSkipped: integer("posts_skipped").default(0),
  imagesProcessed: integer("images_processed").default(0),
  imagesSuccess: integer("images_success").default(0),
  imagesError: integer("images_error").default(0),
  categoriesCreated: integer("categories_created").default(0),
  tagsCreated: integer("tags_created").default(0),
  errors: jsonb("errors"),
  imageMapping: jsonb("image_mapping"), // { wpUrl: blobUrl }
  redirects: jsonb("redirects"), // Array of { source, destination }
  importedBy: text("imported_by").references(() => user.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

// ============================================
// Ad Server Tables
// ============================================

export const adCampaigns = pgTable(
  "ad_campaigns",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    name: text("name").notNull(),
    advertiserName: text("advertiser_name").notNull(),
    advertiserEmail: text("advertiser_email"),
    advertiserUrl: text("advertiser_url"),
    status: adStatusEnum("status").default("paused").notNull(),
    startDate: timestamp("start_date"),
    endDate: timestamp("end_date"),
    dailyBudgetCents: integer("daily_budget_cents"), // Optional daily budget in cents
    totalBudgetCents: integer("total_budget_cents"), // Optional total budget in cents
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("ad_campaigns_status_idx").on(table.status),
    index("ad_campaigns_start_date_idx").on(table.startDate),
    index("ad_campaigns_end_date_idx").on(table.endDate),
  ]
);

export const adCreatives = pgTable(
  "ad_creatives",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    campaignId: text("campaign_id")
      .notNull()
      .references(() => adCampaigns.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    creativeType: adCreativeTypeEnum("creative_type").notNull(),
    // Content fields — use whichever applies to the type
    imageUrl: text("image_url"),
    imageAlt: text("image_alt"),
    htmlContent: text("html_content"),
    headline: text("headline"),
    bodyText: text("body_text"),
    ctaText: text("cta_text"),
    destinationUrl: text("destination_url").notNull(),
    aspectRatio: adAspectRatioEnum("aspect_ratio").default("auto").notNull(),
    weight: integer("weight").default(1).notNull(), // Relative weight for rotation within campaign
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("ad_creatives_campaign_idx").on(table.campaignId),
    index("ad_creatives_type_idx").on(table.creativeType),
    index("ad_creatives_aspect_ratio_idx").on(table.aspectRatio),
    index("ad_creatives_active_idx").on(table.isActive),
  ]
);

export const adPlacements = pgTable(
  "ad_placements",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    name: text("name").notNull().unique(), // e.g. "clinic_sidebar", "directory_top"
    label: text("label").notNull(), // Human-readable label
    pageType: adPageTypeEnum("page_type").notNull(),
    description: text("description"),
    defaultWidth: integer("default_width"),
    defaultHeight: integer("default_height"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("ad_placements_page_type_idx").on(table.pageType),
    index("ad_placements_active_idx").on(table.isActive),
  ]
);

export const adCampaignPlacements = pgTable(
  "ad_campaign_placements",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    campaignId: text("campaign_id")
      .notNull()
      .references(() => adCampaigns.id, { onDelete: "cascade" }),
    placementId: text("placement_id")
      .notNull()
      .references(() => adPlacements.id, { onDelete: "cascade" }),
    weight: integer("weight").default(1).notNull(), // Relative weight for this campaign in this placement
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("ad_campaign_placement_unique_idx").on(table.campaignId, table.placementId),
    index("ad_campaign_placements_campaign_idx").on(table.campaignId),
    index("ad_campaign_placements_placement_idx").on(table.placementId),
  ]
);

export const adSettings = pgTable("ad_settings", {
  id: integer("id").primaryKey(), // Single-row table, always id=1
  adServerPercentage: integer("ad_server_percentage").default(0).notNull(), // 0-100: percentage of traffic that sees ads
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const adImpressions = pgTable(
  "ad_impressions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    creativeId: text("creative_id")
      .notNull()
      .references(() => adCreatives.id, { onDelete: "cascade" }),
    placementId: text("placement_id")
      .notNull()
      .references(() => adPlacements.id, { onDelete: "cascade" }),
    campaignId: text("campaign_id")
      .notNull()
      .references(() => adCampaigns.id, { onDelete: "cascade" }),
    clickId: text("click_id").notNull().unique(), // Pre-generated UUID for S2S click tracking
    pagePath: text("page_path"),
    destinationUrl: text("destination_url"), // Denormalized from creative at impression time
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("ad_impressions_creative_idx").on(table.creativeId),
    index("ad_impressions_placement_idx").on(table.placementId),
    index("ad_impressions_campaign_idx").on(table.campaignId),
    index("ad_impressions_click_id_idx").on(table.clickId),
    index("ad_impressions_created_at_idx").on(table.createdAt),
  ]
);

export const adClicks = pgTable(
  "ad_clicks",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    clickId: text("click_id")
      .notNull()
      .unique()
      .references(() => adImpressions.clickId, { onDelete: "cascade" }),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    isBot: boolean("is_bot").default(false).notNull(),
    botReason: text("bot_reason"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("ad_clicks_click_id_idx").on(table.clickId),
    index("ad_clicks_created_at_idx").on(table.createdAt),
    index("ad_clicks_is_bot_idx").on(table.isBot),
  ]
);

export const adConversions = pgTable(
  "ad_conversions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    clickId: text("click_id")
      .notNull()
      .unique()
      .references(() => adClicks.clickId, { onDelete: "cascade" }),
    conversionType: text("conversion_type"), // e.g. "lead", "sale", "signup"
    payout: numeric("payout", { precision: 10, scale: 2 }), // Dollar amount
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("ad_conversions_click_id_idx").on(table.clickId),
    index("ad_conversions_created_at_idx").on(table.createdAt),
    index("ad_conversions_type_idx").on(table.conversionType),
  ]
);

// ============================================
// Relations
// ============================================

export const userRelations = relations(user, ({ many }) => ({
  ownedClinics: many(clinics),
  claims: many(clinicClaims),
  subscriptions: many(featuredSubscriptions),
  emailLogs: many(emailLogs),
  broadcasts: many(emailBroadcasts),
}));

export const clinicsRelations = relations(clinics, ({ one, many }) => ({
  owner: one(user, {
    fields: [clinics.ownerUserId],
    references: [user.id],
  }),
  claims: many(clinicClaims),
  leads: many(clinicLeads),
  featuredSubscription: one(featuredSubscriptions),
  clinicServices: many(clinicServices),
  clinicInsurance: many(clinicInsurance),
  analyticsEvents: many(analyticsEvents),
}));

export const clinicClaimsRelations = relations(clinicClaims, ({ one }) => ({
  clinic: one(clinics, {
    fields: [clinicClaims.clinicId],
    references: [clinics.id],
  }),
  user: one(user, {
    fields: [clinicClaims.userId],
    references: [user.id],
  }),
  reviewer: one(user, {
    fields: [clinicClaims.reviewedBy],
    references: [user.id],
  }),
}));

export const clinicLeadsRelations = relations(clinicLeads, ({ one }) => ({
  clinic: one(clinics, {
    fields: [clinicLeads.clinicId],
    references: [clinics.id],
  }),
  clinicEmailLog: one(emailLogs, {
    fields: [clinicLeads.clinicEmailLogId],
    references: [emailLogs.id],
  }),
  patientEmailLog: one(emailLogs, {
    fields: [clinicLeads.patientEmailLogId],
    references: [emailLogs.id],
  }),
}));

export const featuredSubscriptionsRelations = relations(
  featuredSubscriptions,
  ({ one }) => ({
    clinic: one(clinics, {
      fields: [featuredSubscriptions.clinicId],
      references: [clinics.id],
    }),
    user: one(user, {
      fields: [featuredSubscriptions.userId],
      references: [user.id],
    }),
  })
);

export const servicesRelations = relations(services, ({ many }) => ({
  clinicServices: many(clinicServices),
}));

export const clinicServicesRelations = relations(clinicServices, ({ one }) => ({
  clinic: one(clinics, {
    fields: [clinicServices.clinicId],
    references: [clinics.id],
  }),
  service: one(services, {
    fields: [clinicServices.serviceId],
    references: [services.id],
  }),
}));

export const insuranceProvidersRelations = relations(insuranceProviders, ({ many }) => ({
  clinicInsurance: many(clinicInsurance),
}));

export const clinicInsuranceRelations = relations(clinicInsurance, ({ one }) => ({
  clinic: one(clinics, {
    fields: [clinicInsurance.clinicId],
    references: [clinics.id],
  }),
  insurance: one(insuranceProviders, {
    fields: [clinicInsurance.insuranceId],
    references: [insuranceProviders.id],
  }),
}));

export const emailLogsRelations = relations(emailLogs, ({ one }) => ({
  user: one(user, {
    fields: [emailLogs.userId],
    references: [user.id],
  }),
}));

export const emailBroadcastsRelations = relations(emailBroadcasts, ({ one }) => ({
  creator: one(user, {
    fields: [emailBroadcasts.createdBy],
    references: [user.id],
  }),
}));

// ============================================
// Blog Relations
// ============================================

export const blogPostsRelations = relations(blogPosts, ({ many }) => ({
  postCategories: many(blogPostCategories),
  postTags: many(blogPostTags),
}));

export const blogCategoriesRelations = relations(
  blogCategories,
  ({ one, many }) => ({
    parent: one(blogCategories, {
      fields: [blogCategories.parentId],
      references: [blogCategories.id],
      relationName: "categoryHierarchy",
    }),
    children: many(blogCategories, { relationName: "categoryHierarchy" }),
    postCategories: many(blogPostCategories),
  })
);

export const blogTagsRelations = relations(blogTags, ({ many }) => ({
  postTags: many(blogPostTags),
}));

export const blogPostCategoriesRelations = relations(
  blogPostCategories,
  ({ one }) => ({
    post: one(blogPosts, {
      fields: [blogPostCategories.postId],
      references: [blogPosts.id],
    }),
    category: one(blogCategories, {
      fields: [blogPostCategories.categoryId],
      references: [blogCategories.id],
    }),
  })
);

export const blogPostTagsRelations = relations(blogPostTags, ({ one }) => ({
  post: one(blogPosts, {
    fields: [blogPostTags.postId],
    references: [blogPosts.id],
  }),
  tag: one(blogTags, {
    fields: [blogPostTags.tagId],
    references: [blogTags.id],
  }),
}));

// ============================================
// 404 Logging Table
// ============================================

export const notFoundLogs = pgTable(
  "not_found_logs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    path: text("path").notNull(),
    fullUrl: text("full_url"),
    referrer: text("referrer"),
    userAgent: text("user_agent"),
    ipAddress: text("ip_address"),
    hitCount: integer("hit_count").default(1).notNull(),
    firstSeenAt: timestamp("first_seen_at").defaultNow().notNull(),
    lastSeenAt: timestamp("last_seen_at").defaultNow().notNull(),
  },
  (table) => [
    index("not_found_logs_path_idx").on(table.path),
    index("not_found_logs_hit_count_idx").on(table.hitCount),
    index("not_found_logs_last_seen_idx").on(table.lastSeenAt),
  ]
);

// ============================================
// Resource Downloads Table
// ============================================

export const resourceDownloads = pgTable(
  "resource_downloads",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    email: text("email").notNull(),
    resourceName: text("resource_name").notNull(),
    source: text("source").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("resource_downloads_email_idx").on(table.email)]
);

// ============================================
// Google Places Sync Tables
// ============================================

export const syncSchedules = pgTable(
  "sync_schedules",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    name: text("name").notNull(),
    frequency: syncScheduleFrequencyEnum("frequency").default("manual"),
    isActive: boolean("is_active").default(true).notNull(),
    scope: text("scope").default("all"), // "all" | "selected" | "missing_data"
    clinicIds: text("clinic_ids").array(),
    stateFilter: text("state_filter"),
    syncReviews: boolean("sync_reviews").default(true),
    syncHours: boolean("sync_hours").default(true),
    syncPhotos: boolean("sync_photos").default(false),
    syncContact: boolean("sync_contact").default(true),
    syncLocation: boolean("sync_location").default(false),
    nextRunAt: timestamp("next_run_at"),
    lastRunAt: timestamp("last_run_at"),
    lastRunStatus: syncStatusEnum("last_run_status"),
    createdBy: text("created_by").references(() => user.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("sync_schedules_next_run_idx").on(table.nextRunAt),
    index("sync_schedules_active_idx").on(table.isActive),
  ]
);

export const syncLogs = pgTable(
  "sync_logs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    scheduleId: text("schedule_id").references(() => syncSchedules.id),
    status: syncStatusEnum("status").default("pending"),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    totalClinics: integer("total_clinics").default(0),
    successCount: integer("success_count").default(0),
    errorCount: integer("error_count").default(0),
    skippedCount: integer("skipped_count").default(0),
    errors: jsonb("errors"), // Array of { clinicId, error, timestamp }
    apiCallsUsed: integer("api_calls_used").default(0),
    triggeredBy: text("triggered_by"), // "cron" | "manual" | userId
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("sync_logs_schedule_idx").on(table.scheduleId),
    index("sync_logs_status_idx").on(table.status),
    index("sync_logs_created_idx").on(table.createdAt),
  ]
);

export const clinicSyncStatus = pgTable(
  "clinic_sync_status",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    clinicId: text("clinic_id")
      .notNull()
      .references(() => clinics.id, { onDelete: "cascade" }),
    lastReviewSync: timestamp("last_review_sync"),
    lastHoursSync: timestamp("last_hours_sync"),
    lastPhotosSync: timestamp("last_photos_sync"),
    lastContactSync: timestamp("last_contact_sync"),
    lastLocationSync: timestamp("last_location_sync"),
    lastFullSync: timestamp("last_full_sync"),
    lastSyncError: text("last_sync_error"),
    consecutiveErrors: integer("consecutive_errors").default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("clinic_sync_status_clinic_idx").on(table.clinicId),
    index("clinic_sync_status_last_full_sync_idx").on(table.lastFullSync),
  ]
);

// ============================================
// Google Places Sync Relations
// ============================================

export const syncSchedulesRelations = relations(syncSchedules, ({ one, many }) => ({
  creator: one(user, {
    fields: [syncSchedules.createdBy],
    references: [user.id],
  }),
  logs: many(syncLogs),
}));

export const syncLogsRelations = relations(syncLogs, ({ one }) => ({
  schedule: one(syncSchedules, {
    fields: [syncLogs.scheduleId],
    references: [syncSchedules.id],
  }),
}));

export const clinicSyncStatusRelations = relations(clinicSyncStatus, ({ one }) => ({
  clinic: one(clinics, {
    fields: [clinicSyncStatus.clinicId],
    references: [clinics.id],
  }),
}));

// ============================================
// Analytics Events Table
// ============================================

export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    eventType: text("event_type").notNull(), // "pageview" | "clinic_view"
    path: text("path").notNull(),
    clinicId: text("clinic_id").references(() => clinics.id, { onDelete: "set null" }),
    referrer: text("referrer"),
    referrerSource: text("referrer_source"), // "google" | "direct" | "facebook" | etc.
    referrerDomain: text("referrer_domain"),
    sessionHash: text("session_hash").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    eventDate: text("event_date").notNull(), // YYYY-MM-DD for grouping
  },
  (table) => [
    index("analytics_events_event_type_idx").on(table.eventType),
    index("analytics_events_path_idx").on(table.path),
    index("analytics_events_clinic_idx").on(table.clinicId),
    index("analytics_events_referrer_source_idx").on(table.referrerSource),
    index("analytics_events_session_hash_idx").on(table.sessionHash),
    index("analytics_events_created_at_idx").on(table.createdAt),
    index("analytics_events_event_date_idx").on(table.eventDate),
  ]
);

export const analyticsEventsRelations = relations(analyticsEvents, ({ one }) => ({
  clinic: one(clinics, {
    fields: [analyticsEvents.clinicId],
    references: [clinics.id],
  }),
}));

// ============================================
// Webhook Events Table (Idempotency)
// ============================================

// ============================================
// Ad Server Relations
// ============================================

export const adCampaignsRelations = relations(adCampaigns, ({ many }) => ({
  creatives: many(adCreatives),
  campaignPlacements: many(adCampaignPlacements),
}));

export const adCreativesRelations = relations(adCreatives, ({ one }) => ({
  campaign: one(adCampaigns, {
    fields: [adCreatives.campaignId],
    references: [adCampaigns.id],
  }),
}));

export const adPlacementsRelations = relations(adPlacements, ({ many }) => ({
  campaignPlacements: many(adCampaignPlacements),
}));

export const adCampaignPlacementsRelations = relations(adCampaignPlacements, ({ one }) => ({
  campaign: one(adCampaigns, {
    fields: [adCampaignPlacements.campaignId],
    references: [adCampaigns.id],
  }),
  placement: one(adPlacements, {
    fields: [adCampaignPlacements.placementId],
    references: [adPlacements.id],
  }),
}));

export const adImpressionsRelations = relations(adImpressions, ({ one }) => ({
  creative: one(adCreatives, {
    fields: [adImpressions.creativeId],
    references: [adCreatives.id],
  }),
  placement: one(adPlacements, {
    fields: [adImpressions.placementId],
    references: [adPlacements.id],
  }),
  campaign: one(adCampaigns, {
    fields: [adImpressions.campaignId],
    references: [adCampaigns.id],
  }),
}));

export const adClicksRelations = relations(adClicks, ({ one }) => ({
  impression: one(adImpressions, {
    fields: [adClicks.clickId],
    references: [adImpressions.clickId],
  }),
}));

export const adConversionsRelations = relations(adConversions, ({ one }) => ({
  click: one(adClicks, {
    fields: [adConversions.clickId],
    references: [adClicks.clickId],
  }),
}));

export const webhookEvents = pgTable(
  "webhook_events",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    stripeEventId: text("stripe_event_id").unique().notNull(),
    eventType: text("event_type").notNull(),
    status: text("status").notNull(), // "processed" | "received" | "failed" | "skipped"
    processedAt: timestamp("processed_at").defaultNow(),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("webhook_events_stripe_event_id_idx").on(table.stripeEventId),
    index("webhook_events_event_type_idx").on(table.eventType),
    index("webhook_events_status_idx").on(table.status),
    index("webhook_events_created_at_idx").on(table.createdAt),
  ]
);
