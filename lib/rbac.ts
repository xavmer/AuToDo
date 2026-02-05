import { auth } from "@/lib/auth"
import { UserRole } from "@prisma/client"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export class UnauthorizedError extends Error {
  constructor(message: string = "Unauthorized") {
    super(message)
    this.name = "UnauthorizedError"
  }
}

export class ForbiddenError extends Error {
  constructor(message: string = "Forbidden") {
    super(message)
    this.name = "ForbiddenError"
  }
}

/**
 * Require user to be authenticated and have one of the specified roles
 */
export async function requireRole(allowedRoles: UserRole[]) {
  const session = await auth()
  
  if (!session?.user) {
    throw new UnauthorizedError("Authentication required")
  }

  if (!allowedRoles.includes(session.user.role)) {
    throw new ForbiddenError(`Requires one of roles: ${allowedRoles.join(", ")}`)
  }

  return session.user
}

/**
 * Assert that a user has access to a specific project
 * Rules:
 * - Executive: access to all projects
 * - Manager: access to projects where managerId = user.id OR team projects
 * - Employee: only via tasks assigned to them (read-only)
 */
export async function assertProjectAccess(
  userId: string,
  userRole: UserRole,
  projectId: string,
  userTeamId: string | null
): Promise<void> {
  // Executives have access to all projects
  if (userRole === UserRole.EXECUTIVE) {
    return
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      manager: true,
      tasks: {
        where: { assigneeUserId: userId },
        select: { id: true },
      },
    },
  })

  if (!project) {
    throw new ForbiddenError("Project not found")
  }

  // Manager: must be the project manager OR on same team
  if (userRole === UserRole.MANAGER) {
    if (project.managerId === userId) {
      return
    }
    if (userTeamId && project.manager.teamId === userTeamId) {
      return
    }
    throw new ForbiddenError("No access to this project")
  }

  // Employee: must have at least one task assigned in this project
  if (userRole === UserRole.EMPLOYEE) {
    if (project.tasks.length > 0) {
      return
    }
    throw new ForbiddenError("No access to this project")
  }

  throw new ForbiddenError("No access to this project")
}

/**
 * Assert that a user has access to a specific task
 */
export async function assertTaskAccess(
  userId: string,
  userRole: UserRole,
  taskId: string
): Promise<void> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: {
        include: { manager: true },
      },
    },
  })

  if (!task) {
    throw new ForbiddenError("Task not found")
  }

  // Use project access rules
  await assertProjectAccess(
    userId,
    userRole,
    task.projectId,
    task.project.manager.teamId
  )
}

/**
 * Wrapper to handle RBAC errors in API routes
 */
export function withErrorHandling(
  handler: (req: Request, ...args: any[]) => Promise<Response>
) {
  return async (req: Request, ...args: any[]) => {
    try {
      return await handler(req, ...args)
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        return NextResponse.json(
          { error: error.message },
          { status: 401 }
        )
      }
      if (error instanceof ForbiddenError) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        )
      }
      console.error("API Error:", error)
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      )
    }
  }
}
