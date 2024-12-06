import { NextFunction, Request, Response } from "express"
import { and, eq } from "drizzle-orm"
import { db } from "../db" // Adjust this import based on your db setup
import { comments, todos, users } from "../db/schema" // Adjust based on your schema
import User from "../types/User"

// Types from your permission system
type Comment = {
  id: string
  body: string
  authorId: string
  createdAt: Date
}

type Todo = {
  id: string
  title: string
  userId: string
  completed: boolean
  invitedUsers: string[]
}

type Role = "admin" | "moderator" | "user"

type PermissionCheck<Key extends keyof Permissions> =
  | boolean
  | ((user: User, data: Permissions[Key]["dataType"]) => boolean)

type RolesWithPermissions = {
  [R in Role]: Partial<{
    [Key in keyof Permissions]: Partial<{
      [Action in Permissions[Key]["action"]]: PermissionCheck<Key>
    }>
  }>
}

type Permissions = {
  comments: {
    dataType: Comment
    action: "view" | "create" | "update"
  }
  todos: {
    dataType: Todo
    action: "view" | "create" | "update" | "delete"
  }
}

const ROLES = {
  admin: {
    comments: {
      view: true,
      create: true,
      update: true,
    },
    todos: {
      view: true,
      create: true,
      update: true,
      delete: true,
    },
  },
  moderator: {
    comments: {
      view: true,
      create: true,
      update: true,
    },
    todos: {
      view: true,
      create: true,
      update: true,
      delete: (user, todo) => todo.completed,
    },
  },
  user: {
    comments: {
      view: (user, comment) => !user.blockedBy.includes(comment.authorId),
      create: true,
      update: (user, comment) => comment.authorId === user.id,
    },
    todos: {
      view: (user, todo) => !user.blockedBy.includes(todo.userId),
      create: true,
      update: (user, todo) =>
        todo.userId === user.id || todo.invitedUsers.includes(user.id),
      delete: (user, todo) =>
        (todo.userId === user.id || todo.invitedUsers.includes(user.id)) &&
        todo.completed,
    },
  },
} as const satisfies RolesWithPermissions

export function hasPermission<Resource extends keyof Permissions>(
  user: User,
  resource: Resource,
  action: Permissions[Resource]["action"],
  data?: Permissions[Resource]["dataType"]
) {
  return user.roles.some((role) => {
    const permission = (ROLES as RolesWithPermissions)[role][resource]?.[action]
    if (permission == null) return false
    if (typeof permission === "boolean") return permission
    return data != null && permission(user, data)
  })
}

export function requirePermission<Resource extends keyof Permissions>(
  resource: Resource,
  action: Permissions[Resource]["action"]
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = res.locals.user;
    
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    // For create operations, we can check without loading data
    if (action === "create") {
      if (!hasPermission(user, resource, action)) {
        return res.status(403).json({ error: "Forbidden" })
      }
      return next()
    }

    // Load the relevant data based on the resource type
    let data: Permissions[Resource]["dataType"] | undefined

    try {
      if (resource === "todos") {
        const todoId = req.params.id
        const todoData = await db.query.todos.findFirst({
          where: eq(todos.id, todoId),
        })
        if (!todoData) {
          return res.status(404).json({ error: "Todo not found" })
        }
        data = todoData as Permissions[Resource]["dataType"]
      } else if (resource === "comments") {
        const commentId = req.params.id
        const commentData = await db.query.comments.findFirst({
          where: eq(comments.id, commentId),
        })
        if (!commentData) {
          return res.status(404).json({ error: "Comment not found" })
        }
        data = commentData as Permissions[Resource]["dataType"]
      }

      if (!hasPermission(user, resource, action, data)) {
        return res.status(403).json({ error: "Forbidden" })
      }

      // Attach the loaded data to the request for use in route handlers
    //   req.resourceData = data
      next()
    } catch (error) {
      console.error("Error in permission middleware:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  }
}

// Example usage in routes:
/*
// Todos routes
router.get(
  "/todos/:id",
  requirePermission("todos", "view"),
  async (req, res) => {
    // The todo is already loaded and permission-checked in req.resourceData
    res.json(req.resourceData)
  }
)

router.post(
  "/todos",
  requirePermission("todos", "create"),
  async (req, res) => {
    // User is already permission-checked for creation
    const newTodo = await db.insert(todos).values({
      ...req.body,
      userId: res.locals.user.id,
    })
    res.json(newTodo)
  }
)

router.put(
  "/todos/:id",
  requirePermission("todos", "update"),
  async (req, res) => {
    // Todo is already loaded and permission-checked in req.resourceData
    const updatedTodo = await db
      .update(todos)
      .set(req.body)
      .where(eq(todos.id, req.params.id))
    res.json(updatedTodo)
  }
)

router.delete(
  "/todos/:id",
  requirePermission("todos", "delete"),
  async (req, res) => {
    // Todo is already loaded and permission-checked in req.resourceData
    await db.delete(todos).where(eq(todos.id, req.params.id))
    res.status(204).end()
  }
)

// Comments routes
router.get(
  "/comments/:id",
  requirePermission("comments", "view"),
  async (req, res) => {
    res.json(req.resourceData)
  }
)

router.post(
  "/comments",
  requirePermission("comments", "create"),
  async (req, res) => {
    const newComment = await db.insert(comments).values({
      ...req.body,
      authorId: res.locals.user.id,
    })
    res.json(newComment)
  }
)

router.put(
  "/comments/:id",
  requirePermission("comments", "update"),
  async (req, res) => {
    const updatedComment = await db
      .update(comments)
      .set(req.body)
      .where(eq(comments.id, req.params.id))
    res.json(updatedComment)
  }
)
*/