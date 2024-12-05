import { Request, Response, NextFunction } from "express";
import { decodeToken } from "./auth";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import User from "../types/User";

export const checkAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authorizationHeader = req.headers.authorization;
  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    res.status(401).send({ message: "No token provided" });
    return;
  }

  const token = authorizationHeader.replace("Bearer ", "");
  try {
    const userId = (await decodeToken(token)).id;
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .execute();

    if (!user) {
      res.status(401).send({ message: "Invalid token" });
      return;
    }

    if (!user.isVerified) {
      res.status(401).send({ message: "Phone Number not verified" });
      return;
    }

    // Attach user to `res.locals` for downstream handlers
    res.locals.user = user;
    next();
  } catch (error) {
    console.error("Authorization error:", error);
    res.status(401).send({ message: "Unauthorized" });
  }
};


export const checkNonVerified = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authorizationHeader = req.headers.authorization;
  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    res.status(401).send({ message: "No token provided" });
    return;
  }

  const token = authorizationHeader.replace("Bearer ", "");
  try {
    const userId = (await decodeToken(token)).id;
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .execute();

    if (!user) {
      res.status(401).send({ message: "Invalid token" });
      return;
    }

    res.locals.user = user;

    if (res.locals.user.isVerified) {
      res.status(401).send({ message: "Phone Number already verified" });
      return;
    }

    next();
  } catch (error) {
    console.error("Authorization error:", error);
    res.status(401).send({ message: "Unauthorized" });
  }
};

export function omitPassword(user: User): Omit<User, 'password'> {
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}