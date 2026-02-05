import OpenAI from "openai"
import { z } from "zod"

// Define the schema for a single task in the plan
export const TaskPlanSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  acceptanceCriteria: z.array(z.string()).min(1),
  skills: z.array(z.string()).min(1),
  estimatedEffortHours: z.number().max(8).min(0.5),
  dependencies: z.array(z.string()).default([]),
  suggestedAssigneeType: z.enum(["employee", "ai"]),
  suggestedReviewerRole: z.string().default("manager"),
})

export const ProjectPlanSchema = z.object({
  projectTitle: z.string().min(1),
  overview: z.string().min(1),
  tasks: z.array(TaskPlanSchema).min(1),
})

export type ProjectPlan = z.infer<typeof ProjectPlanSchema>
export type TaskPlan = z.infer<typeof TaskPlanSchema>

const SYSTEM_PROMPT = `You are an expert project manager and technical architect. Your job is to decompose project requests into actionable tasks.

CRITICAL RULES:
1. Each task MUST have estimatedEffortHours <= 8 hours. If a task is larger, split it into multiple smaller tasks.
2. Each task MUST include:
   - title: Clear, actionable title
   - description: Detailed description of what needs to be done
   - acceptanceCriteria: Array of specific, testable criteria (minimum 1)
   - skills: Array of required skills (minimum 1)
   - estimatedEffortHours: Number <= 8
   - dependencies: Array of task titles that must be completed first (can be empty)
   - suggestedAssigneeType: "employee" or "ai" (use "ai" for automated tasks like data processing, testing, monitoring)
   - suggestedReviewerRole: Usually "manager"
3. Consider dependencies carefully - tasks should be ordered logically.
4. Be specific about skills needed (e.g., "React", "PostgreSQL", "Python", "UX Design").
5. Acceptance criteria should be testable and specific.

You must respond ONLY with valid JSON matching the schema. No markdown, no explanation, just JSON.`

let openaiClient: OpenAI | null = null

const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5-mini"

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is not set")
    }
    openaiClient = new OpenAI({ apiKey })
  }
  return openaiClient
}

export async function generateProjectPlan(prompt: string): Promise<ProjectPlan> {
  try {
    const client = getOpenAIClient()

    const responseText = await generatePlanJsonText(
      client,
      [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Generate a project plan for: ${prompt}` },
      ]
    )

    const parsed = JSON.parse(responseText)

    // Validate with Zod
    try {
      const validated = ProjectPlanSchema.parse(parsed)
      return validated
    } catch (validationError) {
      console.error("Validation error on first attempt:", validationError)
      
      // Retry once with a fix prompt
      return await retryWithFixPrompt(client, prompt, responseText, validationError)
    }
  } catch (error) {
    console.error("Error generating project plan:", error)
    
    // If OpenAI is not available, return a stub response
    if (error instanceof Error && error.message.includes("OPENAI_API_KEY")) {
      return getStubProjectPlan(prompt)
    }
    
    throw error
  }
}

async function retryWithFixPrompt(
  client: OpenAI,
  originalPrompt: string,
  previousResponse: string,
  validationError: any
): Promise<ProjectPlan> {
  const fixPrompt = `The previous response failed validation. Error: ${JSON.stringify(validationError, null, 2)}

Previous response:
${previousResponse}

Please fix the response to match the exact schema requirements:
- Each task must have estimatedEffortHours <= 8
- acceptanceCriteria must be an array with at least 1 item
- skills must be an array with at least 1 item
- suggestedAssigneeType must be exactly "employee" or "ai"
- All required fields must be present

Original prompt was: ${originalPrompt}

Respond with corrected JSON only.`

  const responseText = await generatePlanJsonText(
    client,
    [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: fixPrompt },
    ],
    "Empty response from OpenAI on retry"
  )

  const parsed = JSON.parse(responseText)
  return ProjectPlanSchema.parse(parsed)
}

async function generatePlanJsonText(
  client: OpenAI,
  messages: Array<{ role: "system" | "user"; content: string }>,
  emptyErrorMessage = "Empty response from OpenAI"
): Promise<string> {
  const response = await client.responses.create({
    model: OPENAI_MODEL,
    input: messages,
    // Keep the "JSON only" contract.
    // In the Responses API, JSON formatting is configured via `text.format`.
    text: {
      format: { type: "json_object" },
    },
  } as any)

  const outputText = extractResponseOutputText(response)
  if (!outputText) {
    throw new Error(emptyErrorMessage)
  }

  return outputText
}

function extractResponseOutputText(response: any): string {
  if (typeof response?.output_text === "string") return response.output_text

  const output = response?.output
  if (!Array.isArray(output)) return ""

  let text = ""
  for (const item of output) {
    const content = item?.content
    if (!Array.isArray(content)) continue
    for (const part of content) {
      if (part?.type === "output_text" && typeof part?.text === "string") {
        text += part.text
      }
    }
  }
  return text
}

function getStubProjectPlan(prompt: string): ProjectPlan {
  return {
    projectTitle: `Project: ${prompt.slice(0, 50)}`,
    overview: `This is a stub project plan because OpenAI API is not configured. Prompt was: ${prompt}`,
    tasks: [
      {
        title: "Setup project structure",
        description: "Initialize the project repository and basic structure",
        acceptanceCriteria: [
          "Repository created",
          "Basic folder structure in place",
          "README with initial documentation",
        ],
        skills: ["Git", "Project Management"],
        estimatedEffortHours: 2,
        dependencies: [],
        suggestedAssigneeType: "employee",
        suggestedReviewerRole: "manager",
      },
      {
        title: "Implement core functionality",
        description: "Build the main features as described in the project prompt",
        acceptanceCriteria: [
          "Core features implemented",
          "Unit tests passing",
          "Code reviewed",
        ],
        skills: ["Programming", "Testing"],
        estimatedEffortHours: 8,
        dependencies: ["Setup project structure"],
        suggestedAssigneeType: "employee",
        suggestedReviewerRole: "manager",
      },
      {
        title: "Setup automated testing",
        description: "Configure CI/CD pipeline and automated test suite",
        acceptanceCriteria: [
          "CI/CD pipeline configured",
          "Automated tests running on every commit",
        ],
        skills: ["DevOps", "Testing"],
        estimatedEffortHours: 4,
        dependencies: ["Implement core functionality"],
        suggestedAssigneeType: "ai",
        suggestedReviewerRole: "manager",
      },
    ],
  }
}
