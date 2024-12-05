import {
  uuid,
  pgTable,
  varchar,
  timestamp,
  pgTableCreator,
} from "drizzle-orm/pg-core";

// get project name from .env file
const projectName = process.env.PROJECT_NAME;

export const createTable = pgTableCreator((name) => `${projectName}_${name}`);

export const users = createTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  phone: varchar({ length: 255 }).notNull().unique(),
});
