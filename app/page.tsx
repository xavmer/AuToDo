import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"

export default async function Home() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  // Redirect based on role
  switch (session.user.role) {
    case "EXECUTIVE":
      redirect("/executive/projects")
    case "MANAGER":
      redirect("/manager/projects")
    case "EMPLOYEE":
      redirect("/employee/tasks")
    default:
      redirect("/login")
  }
}
