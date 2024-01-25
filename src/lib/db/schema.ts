import { relations } from "drizzle-orm";
import { text, sqliteTable, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-valibot";
import {
  email,
  minLength,
  string,
  toLowerCase,
  toTrimmed,
  omit,
} from "valibot";

export const roleTable = sqliteTable("role", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").unique().notNull(),
});

export const userTable = sqliteTable("user", {
  id: text("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").unique().notNull(),
  password: text("password").notNull(),
  roleId: integer("role_id")
    .notNull()
    .references(() => roleTable.id),
});

export const sessionTable = sqliteTable("user_session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id),
  expiresAt: integer("expires_at").notNull(),
});

export const userRelations = relations(userTable, ({ one }) => ({
  role: one(roleTable, {
    fields: [userTable.roleId],
    references: [roleTable.id],
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
  ["id", "roleId"],
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
  ["id", "firstName", "lastName", "roleId"],
);
