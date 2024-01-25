import { relations } from "drizzle-orm";
import { text, sqliteTable, integer } from "drizzle-orm/sqlite-core";

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
