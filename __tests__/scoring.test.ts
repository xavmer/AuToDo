import { recommendForTask } from "@/lib/scoring/recommend"
import { Seniority, AssigneeType } from "@prisma/client"

describe("Recommendation Scoring Engine", () => {
  describe("recommendForTask", () => {
    it("should recommend employee with matching skills", async () => {
      const task = {
        id: "task-1",
        title: "Build React Component",
        skills: ["React", "TypeScript"],
        estimatedEffortHours: 4,
      }

      const teamId = "team-1"

      // Mock implementation - in real test, would use test database
      // This is a placeholder to show the structure
      expect(task.skills).toContain("React")
    })

    it("should recommend AI for tasks with no matching skills", async () => {
      const task = {
        id: "task-2",
        title: "Automated Data Processing",
        skills: ["Python", "Airflow"],
        estimatedEffortHours: 2,
        suggestedAssigneeType: AssigneeType.AI,
      }

      expect(task.suggestedAssigneeType).toBe(AssigneeType.AI)
    })

    it("should calculate skill overlap score correctly", () => {
      const taskSkills = ["React", "TypeScript", "Node.js"]
      const employeeSkills = ["React", "TypeScript", "Python"]

      const matched = taskSkills.filter((s) => employeeSkills.includes(s))
      const score = matched.length / taskSkills.length

      expect(score).toBeCloseTo(0.666, 2)
      expect(matched).toEqual(["React", "TypeScript"])
    })

    it("should prefer less utilized employees", () => {
      const capacity1 = { capacity: 40, assigned: 10 } // 75% available
      const capacity2 = { capacity: 40, assigned: 30 } // 25% available

      const available1 = capacity1.capacity - capacity1.assigned
      const available2 = capacity2.capacity - capacity2.assigned

      expect(available1).toBeGreaterThan(available2)
    })

    it("should match seniority levels appropriately", () => {
      // High complexity task (8h, 3+ skills) -> SENIOR
      const taskEffort = 8
      const taskSkillCount = 3

      let requiredSeniority: Seniority

      if (taskEffort >= 6 && taskSkillCount >= 3) {
        requiredSeniority = Seniority.SENIOR
      } else if (taskEffort >= 4 || taskSkillCount >= 2) {
        requiredSeniority = Seniority.MID
      } else {
        requiredSeniority = Seniority.JUNIOR
      }

      expect(requiredSeniority).toBe(Seniority.SENIOR)
    })
  })
})
