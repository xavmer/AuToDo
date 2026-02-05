import { prisma } from "@/lib/db"

interface LogActivityParams {
  actorId: string
  entityType: string
  entityId: string
  action: string
  payload?: Record<string, any>
}

export async function logActivity(params: LogActivityParams) {
  return prisma.activityLog.create({
    data: {
      actorId: params.actorId,
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      payload: params.payload || {},
    },
  })
}

export async function getActivityLogs(filters: {
  entityType?: string
  entityId?: string
  actorId?: string
  limit?: number
}) {
  return prisma.activityLog.findMany({
    where: {
      ...(filters.entityType && { entityType: filters.entityType }),
      ...(filters.entityId && { entityId: filters.entityId }),
      ...(filters.actorId && { actorId: filters.actorId }),
    },
    orderBy: { createdAt: "desc" },
    take: filters.limit || 50,
    include: {
      actor: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  })
}
