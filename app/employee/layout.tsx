import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { Navbar } from "@/components/Navbar"
import { MessageSidebar } from "@/components/MessageSidebar"
import { SidebarProvider, SidebarLayoutFlex } from "@/components/SidebarLayout"

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
    <SidebarProvider>
      <MessageSidebar />
      <SidebarLayoutFlex>
        <Navbar
          userId={session.user.id}
          userName={session.user.name || "Employee"}
          userRole="Employee"
          avatarUrl={session.user.avatarUrl}
          links={[{ href: "/employee/tasks", label: "My Tasks" }]}
        />
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </SidebarLayoutFlex>
    </SidebarProvider>
  )
}
