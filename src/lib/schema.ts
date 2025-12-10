import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  boolean,
  index,
  integer,
  doublePrecision,
  jsonb,
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

export const user = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    image: text("image"),
    role: text("role").default("user").notNull(), // "user" | "admin" | "clinic_owner"
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

    // Business Hours
    clinicHours: jsonb("clinic_hours"),
    closedOn: text("closed_on"),
    popularTimes: jsonb("popular_times"),

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
    checkboxFeatures: text("checkbox_features").array(),
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
// Content Optimization Tables
// ============================================

export const optimizationBatches = pgTable(
  "optimization_batches",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    name: text("name"),
    status: text("status").default("pending"), // pending, processing, paused, awaiting_review, completed, failed, cancelled

    // Configuration
    batchSize: integer("batch_size").default(50),
    reviewFrequency: integer("review_frequency").default(250), // Pause every N records
    targetWordCount: integer("target_word_count").default(400),
    includeKeywords: boolean("include_keywords").default(true),
    generateFaq: boolean("generate_faq").default(true),
    faqCount: integer("faq_count").default(4),

    // Filters (JSON for flexibility)
    clinicFilters: jsonb("clinic_filters"), // { states?: string[], minReviewCount?: number, excludeOptimized?: boolean }

    // Progress tracking
    totalClinics: integer("total_clinics").default(0),
    processedCount: integer("processed_count").default(0),
    successCount: integer("success_count").default(0),
    errorCount: integer("error_count").default(0),
    skippedCount: integer("skipped_count").default(0),

    // Review tracking
    pendingReviewCount: integer("pending_review_count").default(0),
    approvedCount: integer("approved_count").default(0),
    rejectedCount: integer("rejected_count").default(0),

    // Cost tracking
    totalInputTokens: integer("total_input_tokens").default(0),
    totalOutputTokens: integer("total_output_tokens").default(0),
    estimatedCost: doublePrecision("estimated_cost").default(0),

    // Execution state
    currentOffset: integer("current_offset").default(0), // For resume capability
    errors: jsonb("errors"), // Array of error objects
    aiModel: text("ai_model").default("anthropic/claude-sonnet-4"),
    promptVersion: text("prompt_version").default("v1.0"),

    // User tracking
    startedBy: text("started_by").references(() => user.id),

    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    startedAt: timestamp("started_at"),
    pausedAt: timestamp("paused_at"),
    completedAt: timestamp("completed_at"),
  },
  (table) => [
    index("optimization_batches_status_idx").on(table.status),
    index("optimization_batches_started_by_idx").on(table.startedBy),
  ]
);

export const contentVersions = pgTable(
  "content_versions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    clinicId: text("clinic_id")
      .notNull()
      .references(() => clinics.id, { onDelete: "cascade" }),
    version: integer("version").notNull().default(1),

    // Content fields
    originalContent: text("original_content"),
    optimizedContent: text("optimized_content"),

    // Optimization metadata
    keywordsUsed: jsonb("keywords_used"), // Array of keywords integrated
    faqGenerated: jsonb("faq_generated"), // Array of { question: string, answer: string }
    changesSummary: text("changes_summary"),

    // Word counts
    wordCountBefore: integer("word_count_before"),
    wordCountAfter: integer("word_count_after"),

    // Status tracking
    status: text("status").default("pending"), // pending, approved, rejected, applied, rolled_back

    // Batch reference
    optimizationBatchId: text("optimization_batch_id").references(
      () => optimizationBatches.id
    ),

    // AI tracking
    aiModel: text("ai_model"),
    promptVersion: text("prompt_version"),
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    cost: doublePrecision("cost"),

    // Validation
    validationPassed: boolean("validation_passed"),
    validationWarnings: jsonb("validation_warnings"), // Array of warning strings
    validationErrors: jsonb("validation_errors"), // Array of error strings
    requiresManualReview: boolean("requires_manual_review").default(false),

    // Review tracking
    reviewedAt: timestamp("reviewed_at"),
    reviewedBy: text("reviewed_by").references(() => user.id),
    reviewNotes: text("review_notes"),

    // Applied tracking
    appliedAt: timestamp("applied_at"),
    appliedBy: text("applied_by").references(() => user.id),

    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    optimizedAt: timestamp("optimized_at"),
  },
  (table) => [
    index("content_versions_clinic_idx").on(table.clinicId),
    index("content_versions_batch_idx").on(table.optimizationBatchId),
    index("content_versions_status_idx").on(table.status),
  ]
);

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

    // Polar integration
    polarSubscriptionId: text("polar_subscription_id").unique(),
    polarCustomerId: text("polar_customer_id"),
    polarProductId: text("polar_product_id"),

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
    index("featured_subscriptions_polar_sub_idx").on(table.polarSubscriptionId),
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
// Relations
// ============================================

export const userRelations = relations(user, ({ many }) => ({
  ownedClinics: many(clinics),
  claims: many(clinicClaims),
  subscriptions: many(featuredSubscriptions),
}));

export const clinicsRelations = relations(clinics, ({ one, many }) => ({
  owner: one(user, {
    fields: [clinics.ownerUserId],
    references: [user.id],
  }),
  claims: many(clinicClaims),
  featuredSubscription: one(featuredSubscriptions),
  clinicServices: many(clinicServices),
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
