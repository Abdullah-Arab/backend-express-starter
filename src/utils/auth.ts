import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../types/User";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
const JWT_SECRET = process.env.JWT_SECRET!;

export const generateToken = (
  user: User,
  expiresIn: string | number | undefined = undefined
) => {
  return jwt.sign(
    {
      id: user.id,
      phone: user.phone,
    },
    JWT_SECRET,
    {
      expiresIn,
    }
  );
};

export const hashPassword = async (password: string) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

export const comparePassword = async (
  password: string,
  hashedPassword: string
) => {
  return await bcrypt.compare(password, hashedPassword);
};

export const getUserByToken = async (token: string) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      phone: string;
    };
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, decoded.id))
      .execute();
    return user;
  } catch (error) {
    throw new Error("Invalid token");
  }
};
export const decodeToken = async (token: string) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      phone: string;
    };
    return decoded;
  } catch (error) {
    throw new Error("Invalid token");
  }
};
