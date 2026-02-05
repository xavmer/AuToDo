import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { Navbar } from "@/components/Navbar"

export default async function EmployeeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user || session.user.role !== "EMPLOYEE") {
    redirect("/login")
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-[#101622]">
      <Navbar
        userName={session.user.name || "Employee"}
        userRole="Employee"
        links={[{ href: "/employee/tasks", label: "My Tasks" }]}
      />
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  )
}
