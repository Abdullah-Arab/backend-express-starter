import { NextFunction, Request, Response } from "express"
import { eq } from "drizzle-orm"
import { db } from "../db"
import { PermissionService } from "../services/permission-service"

const permissionService = new PermissionService()

export function requirePermission(resource: string, action: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = res.locals.user
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" })
    }
    try {
        const hasPermission = await permissionService.evaluatePermission(
          user.id,
          resource,
          action
        )
        if (!hasPermission) {
          return res.status(403).json({ error: "Forbidden" })
        }
        return next()
    } catch (error) {
      console.error("Error in permission middleware:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  }
}