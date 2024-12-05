import { users } from "../db/schema";

type User = typeof users.$inferSelect;

declare global {
  namespace Express {
    interface Locals {
      user: User;
    }
  }
}

export default User;
