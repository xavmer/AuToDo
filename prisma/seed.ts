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

  const employee4 = await prisma.user.create({
    data: {
      email: "lawyer@workplace.com",
      name: "Laura Lawyer",
      passwordHash: await bcrypt.hash("password123", 10),
      role: UserRole.EMPLOYEE,
      teamId: team.id,
    },
  })

  await prisma.employeeProfile.create({
    data: {
      userId: employee4.id,
      skills: ["Copyright Law", "PowerPoint", "Contract Drafting", "Legal Research"],
      weaknesses: ["Programming", "Technical Skills", "DevOps", "Database Design", "React", "Python", "TypeScript", "Backend Development"],
      capacityHoursPerWeek: 40,
      seniority: Seniority.SENIOR,
      preferences: {
        preferredTaskTypes: ["legal", "documentation", "presentation"],
        workingHours: "standard",
      },
    },
  })
  console.log("✅ Created employee:", employee4.email)

  const employee5 = await prisma.user.create({
    data: {
      email: "diana@workplace.com",
      name: "Diana Designer",
      passwordHash: await bcrypt.hash("password123", 10),
      role: UserRole.EMPLOYEE,
      teamId: team.id,
    },
  })

  await prisma.employeeProfile.create({
    data: {
      userId: employee5.id,
      skills: ["Figma", "UI/UX Design", "PowerPoint", "Adobe Creative Suite", "Prototyping"],
      weaknesses: ["Backend", "Database", "DevOps"],
      capacityHoursPerWeek: 35,
      seniority: Seniority.MID,
      preferences: {
        preferredTaskTypes: ["design", "ui", "prototyping"],
        workingHours: "flexible",
      },
    },
  })
  console.log("✅ Created employee:", employee5.email)

  const employee6 = await prisma.user.create({
    data: {
      email: "ethan@workplace.com",
      name: "Ethan DataScientist",
      passwordHash: await bcrypt.hash("password123", 10),
      role: UserRole.EMPLOYEE,
      teamId: team.id,
    },
  })

  await prisma.employeeProfile.create({
    data: {
      userId: employee6.id,
      skills: ["Python", "Machine Learning", "Data Analysis", "SQL", "Jupyter"],
      weaknesses: ["Frontend", "Mobile", "DevOps"],
      capacityHoursPerWeek: 40,
      seniority: Seniority.SENIOR,
      preferences: {
        preferredTaskTypes: ["data", "analytics", "ml"],
        workingHours: "standard",
      },
    },
  })
  console.log("✅ Created employee:", employee6.email)

  const employee7 = await prisma.user.create({
    data: {
      email: "frank@workplace.com",
      name: "Frank QA",
      passwordHash: await bcrypt.hash("password123", 10),
      role: UserRole.EMPLOYEE,
      teamId: team.id,
    },
  })

  await prisma.employeeProfile.create({
    data: {
      userId: employee7.id,
      skills: ["Test Automation", "Selenium", "Jest", "Cypress", "QA Testing"],
      weaknesses: ["System Architecture", "Database Design"],
      capacityHoursPerWeek: 40,
      seniority: Seniority.MID,
      preferences: {
        preferredTaskTypes: ["testing", "qa", "automation"],
        workingHours: "standard",
      },
    },
  })
  console.log("✅ Created employee:", employee7.email)

  // Create second manager
  const manager2 = await prisma.user.create({
    data: {
      email: "grace@workplace.com",
      name: "Grace Manager",
      passwordHash: await bcrypt.hash("password123", 10),
      role: UserRole.MANAGER,
      teamId: team.id,
    },
  })
  console.log("✅ Created manager:", manager2.email)

  // Create sample projects
  const project1 = await prisma.project.create({
    data: {
      title: "E-commerce Platform Redesign",
      description: "Modernize the UI/UX of our e-commerce platform with React and TypeScript",
      status: "ACTIVE",
      createdById: manager.id,
      managerId: manager.id,
      tasks: {
        create: [
          {
            title: "Design new product listing page",
            description: "Create mockups and prototypes for the product listing page",
            status: "NOT_STARTED",
            priority: 2,
            estimatedEffortHours: 8,
            skills: ["Figma", "UI/UX Design", "Prototyping"],
            acceptanceCriteria: ["Mockups approved by stakeholders", "Responsive design"],
            dependencies: [],
          },
          {
            title: "Implement frontend components",
            description: "Build React components for the new product listing page",
            status: "NOT_STARTED",
            priority: 2,
            estimatedEffortHours: 16,
            skills: ["React", "TypeScript", "CSS"],
            acceptanceCriteria: ["Components match design", "All tests passing"],
            dependencies: [],
          },
          {
            title: "Write E2E tests",
            description: "Create comprehensive end-to-end tests for the new pages",
            status: "NOT_STARTED",
            priority: 1,
            estimatedEffortHours: 6,
            skills: ["Cypress", "Test Automation", "JavaScript"],
            acceptanceCriteria: ["All user flows covered", "Tests passing"],
            dependencies: [],
          },
        ],
      },
    },
  })
  console.log("✅ Created project:", project1.title)

  const project2 = await prisma.project.create({
    data: {
      title: "Data Analytics Dashboard",
      description: "Build an internal dashboard for analyzing customer behavior and sales data",
      status: "PLANNING",
      createdById: executive.id,
      managerId: manager2.id,
      tasks: {
        create: [
          {
            title: "Data pipeline setup",
            description: "Set up ETL pipeline for customer and sales data",
            status: "NOT_STARTED",
            priority: 2,
            estimatedEffortHours: 12,
            skills: ["Python", "SQL", "Data Analysis"],
            acceptanceCriteria: ["Data pipeline running", "Data quality validated"],
            dependencies: [],
          },
          {
            title: "ML model for predictions",
            description: "Create machine learning model to predict customer churn",
            status: "NOT_STARTED",
            priority: 1,
            estimatedEffortHours: 20,
            skills: ["Python", "Machine Learning", "Jupyter"],
            acceptanceCriteria: ["Model accuracy >85%", "Documentation complete"],
            dependencies: [],
          },
          {
            title: "Backend API for dashboard",
            description: "Build REST API to serve analytics data",
            status: "NOT_STARTED",
            priority: 2,
            estimatedEffortHours: 10,
            skills: ["Python", "FastAPI", "PostgreSQL"],
            acceptanceCriteria: ["API endpoints documented", "Performance optimized"],
            dependencies: [],
          },
        ],
      },
    },
  })
  console.log("✅ Created project:", project2.title)

  const project3 = await prisma.project.create({
    data: {
      title: "Legal Compliance Documentation",
      description: "Update all legal documents and create compliance presentation for board",
      status: "PLANNING",
      createdById: executive.id,
      managerId: manager.id,
      tasks: {
        create: [
          {
            title: "Review copyright agreements",
            description: "Audit and update all copyright agreements for software products",
            status: "NOT_STARTED",
            priority: 2,
            estimatedEffortHours: 15,
            skills: ["Copyright Law", "Legal Research", "Contract Drafting"],
            acceptanceCriteria: ["All agreements reviewed", "Recommendations documented"],
            dependencies: [],
          },
          {
            title: "Board presentation",
            description: "Create PowerPoint presentation on compliance status",
            status: "NOT_STARTED",
            priority: 1,
            estimatedEffortHours: 6,
            skills: ["PowerPoint", "Legal Research"],
            acceptanceCriteria: ["Presentation approved", "Data visualizations clear"],
            dependencies: [],
          },
        ],
      },
    },
  })
  console.log("✅ Created project:", project3.title)

  console.log("\n🎉 Seed completed successfully!")
  console.log("\n📧 Login credentials (all use password: password123):")
  console.log("Executive:", executive.email)
  console.log("Manager 1:", manager.email)
  console.log("Manager 2:", manager2.email)
  console.log("Employee 1:", employee1.email)
  console.log("Employee 2:", employee2.email)
  console.log("Employee 3:", employee3.email)
  console.log("Employee 4:", employee4.email)
  console.log("Employee 5:", employee5.email)
  console.log("Employee 6:", employee6.email)
  console.log("Employee 7:", employee7.email)
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
