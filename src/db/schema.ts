import { relations, sql } from "drizzle-orm";
import {
  uuid,
  pgTable,
  varchar,
  timestamp,
  pgTableCreator,
  real,
  boolean,
  serial,
  jsonb,
  text,
} from "drizzle-orm/pg-core";


// get project name from .env file
const projectName = process.env.PROJECT_NAME! as string;

export const createTable = pgTableCreator((name) => `${projectName}_${name}`);

export const users = createTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    phone: varchar().unique().notNull(),
    name: varchar().notNull(),
    password: varchar().notNull(),
    latitude: real(),
    longitude: real(),
    street: varchar(),
    type: varchar().notNull(),
    isVerified: boolean().default(false).notNull(),
    createdAt: timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp({ withTimezone: true }),
  }
);
export const userRoles = pgTable("user_roles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  roleId: uuid("role_id")
    .notNull()
    .references(() => roles.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
})

export const usersRelations = relations(users, ({ many }) => ({
  roles: many(userRoles),
}))

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id],
  }),
}))

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type UserRole = typeof userRoles.$inferSelect
export type NewUserRole = typeof userRoles.$inferInsert



export const roles = pgTable("roles", {
  id: uuid().defaultRandom().primaryKey(),
  name: text().notNull().unique(),
  description: text(),
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp().defaultNow(),
})

export const permissions = pgTable("permissions", {
  id: uuid().defaultRandom().primaryKey(),
  resource: text().notNull(),  // 'comments' or 'todos'
  action: text().notNull(),      // 'view', 'create', 'update', 'delete'
  description: text(),
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp().defaultNow(),
})

export const rolePermissions = pgTable("role_permissions", {
  id: uuid().defaultRandom().primaryKey(),
  roleId: uuid()
    .notNull()
    .references(() => roles.id, { onDelete: "cascade" }),
  permissionId: uuid()
    .notNull()
    .references(() => permissions.id, { onDelete: "cascade" }),
  isAlwaysAllowed: boolean().default(false),
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp().defaultNow(),
})

export type Role = typeof roles.$inferSelect
export type NewRole = typeof roles.$inferInsert

export type Permission = typeof permissions.$inferSelect
export type NewPermission = typeof permissions.$inferInsert

export type RolePermission = typeof rolePermissions.$inferSelect
export type NewRolePermission = typeof rolePermissions.$inferInsert

