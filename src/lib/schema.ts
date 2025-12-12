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

export const emailStatusEnum = pgEnum("email_status", [
  "queued",
  "delivered",
  "bounced",
  "complained",
  "failed",
  "opened",
  "clicked",
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
