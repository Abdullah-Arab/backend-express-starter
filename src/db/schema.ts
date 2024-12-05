
import { uuid, pgTable, varchar, timestamp, pgTableCreator } from "drizzle-orm/pg-core";


export const createTable = pgTableCreator((name) => `wellsync_${name}`);

export const users = createTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  phone: varchar({ length: 255 }).notNull().unique(),
});
