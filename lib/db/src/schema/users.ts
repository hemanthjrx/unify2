import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const usersTable = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    clerkUserId: text("clerk_user_id"),
    username: text("username"),
    name: text("name"),
    bio: text("bio"),
    role: text("role").notNull().default("user"),
    coins: integer("coins").notNull().default(50),
    avatarColor: text("avatar_color").notNull().default("#7c5cff"),
    bannerColor: text("banner_color").notNull().default("#1a1040"),
    email: text("email"),
    mobileNumber: text("mobile_number"),
    dob: text("dob"),
    usn: text("usn"),
    semester: text("semester"),
    branch: text("branch"),
    yearEnrolled: text("year_enrolled"),
    passwordHash: text("password_hash"),
    portfolioUrl: text("portfolio_url"),
    linkedinUrl: text("linkedin_url"),
    githubUrl: text("github_url"),
    isBanned: boolean("is_banned").notNull().default(false),
    isPrivate: boolean("is_private").notNull().default(true),
    skills: text("skills").array().notNull().default([]),
    onboardingComplete: boolean("onboarding_complete").notNull().default(false),
    weeklyPoints: integer("weekly_points").notNull().default(0),
    streak: integer("streak").notNull().default(0),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    bannedUntil: timestamp("banned_until", { withTimezone: true }),
    practiceUploadsUsed: integer("practice_uploads_used").notNull().default(0),
    accountStatus: text("account_status").notNull().default("approved"),
    idCardUrl: text("id_card_url"),
    feeReceiptUrl: text("fee_receipt_url"),
    reviewedBy: integer("reviewed_by"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    rejectionReason: text("rejection_reason"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => ({
    usernameIdx: uniqueIndex("users_username_idx").on(t.username),
  }),
);

export type User = typeof usersTable.$inferSelect;
