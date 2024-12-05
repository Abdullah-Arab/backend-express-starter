import { sql } from "drizzle-orm";
import {
  uuid,
  pgTable,
  varchar,
  timestamp,
  pgTableCreator,
  integer,
  real,
  boolean,
  serial,
  index,
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
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  }
);

export const otps = createTable(
  "otps",
  {
    id: serial().primaryKey(),
    userId: uuid()
      .notNull()
      .references(() => users.id),
    otp: varchar().notNull(),
    timestamp: timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    verified: boolean().default(false).notNull(),
  }
);
