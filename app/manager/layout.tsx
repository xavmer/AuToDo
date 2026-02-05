import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { Navbar } from "@/components/Navbar"

export default async function ManagerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user || session.user.role !== "MANAGER") {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#101622]">
      <Navbar
        userName={session.user.name || "Manager"}
        userRole="Manager"
        links={[
          { href: "/manager/projects", label: "Projects" },
          { href: "/manager/analytics", label: "Analytics" },
          { href: "/manager/team", label: "Team" },
        ]}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
