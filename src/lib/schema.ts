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
  varchar,
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
    status: clinicStatusEnum("status").default("published").notNull(),
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
// Relations
// ============================================

export const userRelations = relations(user, ({ many }) => ({
  ownedClinics: many(clinics),
  claims: many(clinicClaims),
  subscriptions: many(featuredSubscriptions),
  emailLogs: many(emailLogs),
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

export const emailLogsRelations = relations(emailLogs, ({ one }) => ({
  user: one(user, {
    fields: [emailLogs.userId],
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
