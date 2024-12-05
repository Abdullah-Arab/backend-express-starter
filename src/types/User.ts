import { users } from "../db/schema";

type User = typeof users.$inferSelect;

export default User;
