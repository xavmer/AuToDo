import { PrismaClient, UserRole, Seniority } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding database...")

  // Create team
  const team = await prisma.team.create({
    data: {
      name: "Engineering Team Alpha",
    },
  })
  console.log("✅ Created team:", team.name)

  // Create Executive
  const executive = await prisma.user.create({
    data: {
      email: "exec@workplace.com",
      name: "Sarah Executive",
      passwordHash: await bcrypt.hash("password123", 10),
      role: UserRole.EXECUTIVE,
      teamId: null,
    },
  })
  console.log("✅ Created executive:", executive.email)

  // Create Manager
  const manager = await prisma.user.create({
    data: {
      email: "manager@workplace.com",
      name: "Mike Manager",
      passwordHash: await bcrypt.hash("password123", 10),
      role: UserRole.MANAGER,
      teamId: team.id,
    },
  })
  console.log("✅ Created manager:", manager.email)

  // Create Employees
  const employee1 = await prisma.user.create({
    data: {
      email: "alice@workplace.com",
      name: "Alice Engineer",
      passwordHash: await bcrypt.hash("password123", 10),
      role: UserRole.EMPLOYEE,
      teamId: team.id,
    },
  })

  await prisma.employeeProfile.create({
    data: {
      userId: employee1.id,
      skills: ["React", "TypeScript", "Node.js", "PostgreSQL"],
      weaknesses: ["DevOps", "Mobile Development"],
      capacityHoursPerWeek: 40,
      seniority: Seniority.SENIOR,
      preferences: {
        preferredTaskTypes: ["frontend", "fullstack"],
        workingHours: "flexible",
      },
    },
  })
  console.log("✅ Created employee:", employee1.email)

  const employee2 = await prisma.user.create({
    data: {
      email: "bob@workplace.com",
      name: "Bob Developer",
      passwordHash: await bcrypt.hash("password123", 10),
      role: UserRole.EMPLOYEE,
      teamId: team.id,
    },
  })

  await prisma.employeeProfile.create({
    data: {
      userId: employee2.id,
      skills: ["Python", "FastAPI", "Docker", "Kubernetes", "AWS"],
      weaknesses: ["Frontend", "Design"],
      capacityHoursPerWeek: 35,
      seniority: Seniority.MID,
      preferences: {
        preferredTaskTypes: ["backend", "devops"],
        workingHours: "standard",
      },
    },
  })
  console.log("✅ Created employee:", employee2.email)

  const employee3 = await prisma.user.create({
    data: {
      email: "charlie@workplace.com",
      name: "Charlie Junior",
      passwordHash: await bcrypt.hash("password123", 10),
      role: UserRole.EMPLOYEE,
      teamId: team.id,
    },
  })

  await prisma.employeeProfile.create({
    data: {
      userId: employee3.id,
      skills: ["JavaScript", "HTML", "CSS", "React"],
      weaknesses: ["Backend", "Database Design", "System Architecture"],
      capacityHoursPerWeek: 40,
      seniority: Seniority.JUNIOR,
      preferences: {
        preferredTaskTypes: ["frontend", "ui"],
        workingHours: "standard",
      },
    },
  })
  console.log("✅ Created employee:", employee3.email)

  console.log("\n🎉 Seed completed successfully!")
  console.log("\n📧 Login credentials (all use password: password123):")
  console.log("Executive:", executive.email)
  console.log("Manager:", manager.email)
  console.log("Employee 1:", employee1.email)
  console.log("Employee 2:", employee2.email)
  console.log("Employee 3:", employee3.email)
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
