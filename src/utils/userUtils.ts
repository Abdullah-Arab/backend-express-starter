import User from "../types/User";
import { db } from "../db/index";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export async function getUserByPhone(phone: string): Promise<User | null> {
  // get user from db
  var user = await db.select().from(users).where(eq(users.phone, phone));
  return user.length === 0 ? null : user[0];
}

export async function createUser(phone: string): Promise<User> {
  const userId = uuidv4();
  const newUser = await db
    .insert(users)
    .values({
      id: userId,
      phone: phone,
    })
    .execute();

  // get user from db
  var user = await db.select().from(users).where(eq(users.phone, phone));
  return user[0];
}
