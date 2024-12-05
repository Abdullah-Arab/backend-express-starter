import express from "express";
import { z } from "zod";
import { validateRequest } from "../utils/zod-express-middleware";
import {
  comparePassword,
  decodeToken,
  generateToken,
  hashPassword,
} from "../utils/auth";
import { db } from "../db";
import { otps, users } from "../db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { checkAuth, checkNonVerified, omitPassword } from "../utils/checkAuth";
import { sendOTP } from "../utils/sendOTP";
import { v4 as uuidv4 } from "uuid";

const OTP_EXPIRY = 5 * 60 * 1000; // 5 minutes
const RESEND_WAIT = 2 * 60 * 1000; // 2 minutes
const OTP_LENGTH = 6;

const userRouter = express.Router();
const signupSchema = z.object({
  phone: z.string().min(10),
  password: z.string().min(6),
  name: z.string(),
  type: z.number(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});
const loginSchema = z.object({
  phone: z.string(),
  password: z.string(),
});
const updateLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  street: z.string(),
});
const otpSchema = z.object({
  otp: z.string().length(OTP_LENGTH),
});

userRouter.post(
  "/signup",
  validateRequest({ body: signupSchema }),
  async (req, res) => {
    const { phone, password, name, type, latitude, longitude } = req.body;

    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.phone, phone))
      .execute();
    if (existingUser.length > 0) {
      res.status(400).send({ message: "Phone number already exists" });
    }

    const hashedPassword = await hashPassword(password);
    const userId = uuidv4();
    const [newUser] = await db
      .insert(users)
      .values({
        id:userId,
        phone,
        password: hashedPassword,
        name,
        type: type.toString(),
        latitude,
        longitude,
      })
      .returning();
    const token = generateToken(newUser, "365d");
    const sanitizedUser = omitPassword(newUser);
    res.status(201).json({ user: sanitizedUser, token });
  }
);
userRouter.post(
  "/login",
  validateRequest({ body: loginSchema }),
  async (req, res) => {
    const { phone, password } = req.body;
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    if (!user) {
      res.status(401).send({ message: "Invalid phone number or password" });
    }
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      res.status(401).send({ message: "Invalid phone number or password" });
    }
    const token = generateToken(user, "365d");
    const newUser = omitPassword(user);
    res.status(200).send({ user:newUser, token });
  }
);

const sendOTPToUser = async (userId: string, phone: string) => {
  const otp = await sendOTP(phone);

  await db.insert(otps).values({
    userId,
    otp,
    timestamp: new Date(),
    verified: false,
  });
};

userRouter.post(
  "/request-otp",
  checkNonVerified,
  async (req, res) => {
    const currentTime = Date.now();
    const [otpData] = await db
      .select()
      .from(otps)
      .where(eq(otps.userId, res.locals.user!.id))
      .execute();

    if (
      otpData &&
      currentTime - new Date(otpData.timestamp).getTime() < RESEND_WAIT
    ) {
      const waitTime = Math.ceil(
        (RESEND_WAIT - (currentTime - new Date(otpData.timestamp).getTime())) /
          1000
      );
      res.status(429).send({
        message: `Please wait ${waitTime} seconds before requesting a new OTP.`,
      });
    } else {
      sendOTPToUser(res.locals.user!.id, res.locals.user!.phone);
      res.send({ message: "OTP has been sent." });
    }
  }
);

userRouter.post(
  "/verify-otp",
  checkNonVerified,
  validateRequest({ body: otpSchema }),
  async (req, res) => {
    const { otp } = req.body;
    const [otpData] = await db
      .select()
      .from(otps)
      .where(eq(otps.userId, res.locals.user!.id))
      .orderBy(desc(otps.timestamp))
      .execute();

    if (!otpData) {
      res.status(400).send({ message: "OTP not found", is_verified: false });
      return;
    }

    if (Date.now() - new Date(otpData.timestamp).getTime() > OTP_EXPIRY) {
      await db
        .update(otps)
        .set({ verified: true })
        .where(eq(otps.id, otpData.id));
      res.status(400).send({ message: "OTP has expired", is_verified: false });
      return;
    }
    if (otpData.otp !== otp) {
      res.status(400).send({ message: "Invalid OTP", is_verified: false });
      return;
    } else {
      await db
        .update(otps)
        .set({ verified: true })
        .where(eq(otps.id, otpData.id));
      await db
        .update(users)
        .set({ isVerified: true })
        .where(eq(users.id, res.locals.user!.id));
      res.send({ message: "OTP verified successfully", is_verified: true });
    }
  }
);

userRouter.get(
  "/me",
  checkAuth,
  async (req, res) => {
    res.send(res.locals.user);
  }
);
userRouter.post(
  "/request-reset-otp",
  validateRequest({ body: z.object({ phone: z.string().min(10) }) }),
  async (req, res) => {
    const { phone } = req.body;
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    if (!user) {
      res.status(404).send({ message: "Phone number not found" });
      return;
    }
    await sendOTPToUser(user.id, phone);
    res.send({
      message: "OTP has been sent if the phone number is registered.",
    });
  }
);
userRouter.post(
  "/verify-reset-otp",
  validateRequest({
    body: z.object({
      phone: z.string().min(10),
      otp: z.string().length(OTP_LENGTH),
    }),
  }),
  async (req, res) => {
    const { phone, otp } = req.body;
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    if (!user) {
      res.status(404).send({ message: "Phone number not found" });
      return;
    }
    const [otpData] = await db
      .select()
      .from(otps)
      .where(eq(otps.userId, user.id))
      .orderBy(desc(otps.timestamp))
      .execute();
    if (!otpData) {
      res.status(400).send({ message: "OTP not found" });
      return;
    }
    if (Date.now() - new Date(otpData.timestamp).getTime() > OTP_EXPIRY) {
      await db
        .update(otps)
        .set({ verified: true })
        .where(eq(otps.id, otpData.id))
        .execute();
      res.status(400).send({ message: "OTP has expired" });
      return;
    }
    if (otpData.otp !== otp) {
      res.status(400).send({ message: "Invalid OTP" });
      return;
    }
    await db
      .update(otps)
      .set({ verified: true })
      .where(eq(otps.id, otpData.id))
      .execute();
    const resetToken = generateToken(user, "5m");
    res.send({ resetToken });
  }
);
userRouter.post(
  "/reset-password",
  validateRequest({
    body: z.object({ resetToken: z.string(), newPassword: z.string().min(6) }),
  }),
  async (req, res) => {
    const { resetToken, newPassword } = req.body;
    try {
      const decoded = await decodeToken(resetToken);
      const userId = decoded.id;
      const hashedPassword = await hashPassword(newPassword);

      await db
        .update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, userId))
        .execute();

      res.send({ message: "Password has been reset successfully." });
    } catch (error) {
      res.status(400).send({ message: "Invalid or expired token" });
    }
  }
);

export default userRouter;
