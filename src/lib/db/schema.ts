import { relations, sql } from "drizzle-orm";
import {
  text,
  sqliteTable,
  integer,
  primaryKey,
} from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-valibot";
import {
  email,
  minLength,
  string,
  toLowerCase,
  toTrimmed,
  omit,
} from "valibot";

export const userTable = sqliteTable("user", {
  id: text("id").primaryKey(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  email: text("email").notNull().unique(),
  password: text("password"),
  role: text("role", { enum: ["user", "admin"] })
    .notNull()
    .default("user"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const sessionTable = sqliteTable("user_session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id),
  expiresAt: integer("expires_at").notNull(),
});

export const oauthAccountTable = sqliteTable(
  "oauth_account",
  {
    providerId: text("provider_id").notNull(),
    providerUserId: text("provider_user_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.providerId, table.providerUserId] }),
    };
  },
);

export const oauthRelations = relations(oauthAccountTable, ({ one }) => ({
  user: one(userTable, {
    fields: [oauthAccountTable.userId],
    references: [userTable.id],
  }),
}));

export const insertUserSchema = omit(
  createInsertSchema(userTable, {
    firstName: string([
      toTrimmed(),
      minLength(1, "Please enter your first name"),
    ]),
    lastName: string([
      toTrimmed(),
      toLowerCase(),
      minLength(1, "Please enter your last name"),
    ]),
    email: string([
      toTrimmed(),
      toLowerCase(),
      minLength(1, "Please enter your email"),
      email("Enter a valid email"),
    ]),
    password: string([
      minLength(1, "Please enter your password"),
      minLength(6, "Your password must have 6 characters or more"),
    ]),
  }),
  ["id", "role", "createdAt"],
);

export const selectUserSchema = omit(
  createSelectSchema(userTable, {
    email: string([
      toTrimmed(),
      toLowerCase(),
      minLength(1, "Please enter your email"),
      email("Enter a valid email"),
    ]),
    password: string([
      minLength(1, "Please enter your password"),
      minLength(6, "Your password must have 6 characters or more"),
    ]),
  }),
  ["id", "firstName", "lastName", "role", "createdAt"],
);
