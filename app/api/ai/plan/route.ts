import { NextResponse } from "next/server"
import { requireRole, withErrorHandling } from "@/lib/rbac"
import { UserRole } from "@prisma/client"
import { generateProjectPlan } from "@/lib/ai/plan"
import { z } from "zod"

const GeneratePlanSchema = z.object({
  prompt: z.string().min(10),
})

async function handlePOST(req: Request) {
  const user = await requireRole([UserRole.EXECUTIVE, UserRole.MANAGER])
  
  const body = await req.json()
  const validated = GeneratePlanSchema.parse(body)

  const plan = await generateProjectPlan(validated.prompt)

  return NextResponse.json({ plan })
}

export const POST = withErrorHandling(handlePOST)
