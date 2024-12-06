import { and, eq } from "drizzle-orm"
import { db } from "../db"
import { users, roles, permissions, rolePermissions, Permission, Role } from "../db/schema"

export class PermissionService {
  async evaluatePermission(
    userId: string,
    resource: string,
    action: string,
  ) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      with: {
        roles: {
          with: {
            role: {
              with: {
                permissions: {
                  with: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!user) return false
    for (const userRole of user.roles) {
      const rolePermissions = userRole.role.permissions
      //@ts-ignore
      const hasPermission = rolePermissions.some(rp => 
        rp.permission.resource === resource && 
        rp.permission.action === action
      )

      if (hasPermission) return true
    }

    return false
  }
  async getRolePermissions(roleId: string) {
    return await db.query.rolePermissions.findMany({
      where: eq(rolePermissions.roleId, roleId),
      with: {
        permission: true
      }
    })
  }
  async assignPermissionToRole(roleId: string, permissionId: string) {
    return await db.insert(rolePermissions)
      .values({
        roleId,
        permissionId
      })
      .returning()
  }
  async initializeDefaultPermissions() {
    const defaultPermissions = [
      { resource: "comments", action: "view" },
      { resource: "comments", action: "create" },
      { resource: "comments", action: "update" },
      { resource: "todos", action: "view" },
      { resource: "todos", action: "create" },
      { resource: "todos", action: "update" },
      { resource: "todos", action: "delete" }
    ]
    for (const perm of defaultPermissions) {
      const existingPerm = await db.query.permissions.findFirst({
        where: and(
          eq(permissions.resource, perm.resource),
          eq(permissions.action, perm.action)
        )
      })
      if (!existingPerm) {
        await db.insert(permissions).values(perm)
      }
    }
    const defaultRoles = ["admin", "moderator", "user"]
    for (const roleName of defaultRoles) {
      const existingRole = await db.query.roles.findFirst({
        where: eq(roles.name, roleName)
      })
      if (!existingRole) {
        await db.insert(roles).values({ name: roleName })
      }
    }
    const adminRole = await db.query.roles.findFirst({
      where: eq(roles.name, "admin")
    })
    if (adminRole) {
      const allPermissions = await db.query.permissions.findMany()
      for (const permission of allPermissions) {
        const existingRolePermission = await db.query.rolePermissions.findFirst({
          where: and(
            eq(rolePermissions.roleId, adminRole.id),
            eq(rolePermissions.permissionId, permission.id)
          )
        })
        if (!existingRolePermission) {
          await this.assignPermissionToRole(adminRole.id, permission.id)
        }
      }
    }
  }
}