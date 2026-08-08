import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  json,
  longtext,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Digital products in the store
 */
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  originalPrice: decimal("originalPrice", { precision: 10, scale: 2 }),
  stripeProductId: varchar("stripeProductId", { length: 255 }),
  stripePriceId: varchar("stripePriceId", { length: 255 }),
  fileUrl: text("fileUrl"),
  fileKey: text("fileKey"),
  previewUrl: text("previewUrl"),
  thumbnail: text("thumbnail"),
  status: mysqlEnum("status", ["active", "inactive", "archived"]).default("active").notNull(),
  inventory: int("inventory").default(999),
  soldCount: int("soldCount").default(0),
  rating: decimal("rating", { precision: 3, scale: 2 }).default(0),
  reviewCount: int("reviewCount").default(0),
  isUpsell: boolean("isUpsell").default(false),
  upsellFor: int("upsellFor"),
  generatedBy: varchar("generatedBy", { length: 100 }),
  agentRunId: varchar("agentRunId", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * Orders placed by customers
 */
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  orderId: varchar("orderId", { length: 100 }).notNull().unique(),
  email: varchar("email", { length: 320 }).notNull(),
  productIds: json("productIds").$type<number[]>().notNull(),
  totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["stripe", "crypto"]).notNull(),
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "completed", "failed"]).default("pending").notNull(),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  cryptoTransactionId: varchar("cryptoTransactionId", { length: 255 }),
  stripeFee: decimal("stripeFee", { precision: 10, scale: 2 }).default(0),
  netRevenue: decimal("netRevenue", { precision: 10, scale: 2 }).default(0),
  downloadLinks: json("downloadLinks").$type<Record<number, string>>(),
  downloadedAt: timestamp("downloadedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

/**
 * Cryptocurrency payment invoices
 */
export const cryptoInvoices = mysqlTable("cryptoInvoices", {
  id: int("id").autoincrement().primaryKey(),
  invoiceId: varchar("invoiceId", { length: 100 }).notNull().unique(),
  orderId: int("orderId").notNull(),
  currency: mysqlEnum("currency", ["USDC", "USDT"]).notNull(),
  amount: decimal("amount", { precision: 18, scale: 6 }).notNull(),
  walletAddress: varchar("walletAddress", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["pending", "confirmed", "expired"]).default("pending").notNull(),
  transactionHash: varchar("transactionHash", { length: 255 }),
  expiresAt: timestamp("expiresAt"),
  confirmedAt: timestamp("confirmedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CryptoInvoice = typeof cryptoInvoices.$inferSelect;
export type InsertCryptoInvoice = typeof cryptoInvoices.$inferInsert;

/**
 * Email subscribers for follow-up sequences
 */
export const subscribers = mysqlTable("subscribers", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  status: mysqlEnum("status", ["active", "unsubscribed"]).default("active").notNull(),
  lastPurchaseAt: timestamp("lastPurchaseAt"),
  purchaseCount: int("purchaseCount").default(0),
  totalSpent: decimal("totalSpent", { precision: 10, scale: 2 }).default(0),
  sequenceStep: int("sequenceStep").default(0),
  sequenceLastSentAt: timestamp("sequenceLastSentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscriber = typeof subscribers.$inferSelect;
export type InsertSubscriber = typeof subscribers.$inferInsert;

/**
 * Email campaign tracking
 */
export const emailCampaigns = mysqlTable("emailCampaigns", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: varchar("campaignId", { length: 100 }).notNull().unique(),
  subscriberId: int("subscriberId").notNull(),
  type: mysqlEnum("type", ["welcome", "followup_day1", "followup_day3", "followup_day7", "followup_day14", "repeat_purchase"]).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["sent", "opened", "clicked", "bounced"]).default("sent").notNull(),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  openedAt: timestamp("openedAt"),
  clickedAt: timestamp("clickedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmailCampaign = typeof emailCampaigns.$inferSelect;
export type InsertEmailCampaign = typeof emailCampaigns.$inferInsert;

/**
 * AI agent run history
 */
export const agentRuns = mysqlTable("agentRuns", {
  id: int("id").autoincrement().primaryKey(),
  runId: varchar("runId", { length: 100 }).notNull().unique(),
  status: mysqlEnum("status", ["pending", "running", "completed", "failed"]).default("pending").notNull(),
  trigger: mysqlEnum("trigger", ["scheduled", "manual", "event"]).notNull(),
  eventType: varchar("eventType", { length: 100 }),
  productsGenerated: int("productsGenerated").default(0),
  productsRemoved: int("productsRemoved").default(0),
  pricingUpdates: int("pricingUpdates").default(0),
  prompt: longtext("prompt"),
  result: longtext("result"),
  error: text("error"),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AgentRun = typeof agentRuns.$inferSelect;
export type InsertAgentRun = typeof agentRuns.$inferInsert;

/**
 * Testimonials and social proof
 */
export const testimonials = mysqlTable("testimonials", {
  id: int("id").autoincrement().primaryKey(),
  customerName: varchar("customerName", { length: 255 }).notNull(),
  customerEmail: varchar("customerEmail", { length: 320 }),
  rating: int("rating").notNull(),
  text: text("text").notNull(),
  productId: int("productId"),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Testimonial = typeof testimonials.$inferSelect;
export type InsertTestimonial = typeof testimonials.$inferInsert;

/**
 * Dashboard analytics snapshots
 */
export const analyticsSnapshots = mysqlTable("analyticsSnapshots", {
  id: int("id").autoincrement().primaryKey(),
  date: timestamp("date").notNull(),
  totalRevenue: decimal("totalRevenue", { precision: 10, scale: 2 }).default(0),
  netRevenue: decimal("netRevenue", { precision: 10, scale: 2 }).default(0),
  ordersCount: int("ordersCount").default(0),
  conversionRate: decimal("conversionRate", { precision: 5, scale: 2 }).default(0),
  topProductId: int("topProductId"),
  topProductSales: int("topProductSales").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AnalyticsSnapshot = typeof analyticsSnapshots.$inferSelect;
export type InsertAnalyticsSnapshot = typeof analyticsSnapshots.$inferInsert;