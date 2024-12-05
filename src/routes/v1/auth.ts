import express, { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { z } from "zod";
import { validateData } from "../../middleware/validationMiddleware";

const schemaExample = z.object({
  airportCode: z.string(),
  lang: z.string(),
  isInternational: z.boolean(),
  isArrive: z.boolean(),
});

const authRouter = express.Router();

authRouter.get(
  "/",
  validateData(schemaExample),
  asyncHandler(async (req: Request, res: Response) => {
    
  })
);

export default authRouter;
