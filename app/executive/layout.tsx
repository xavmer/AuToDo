import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { Navbar } from "@/components/Navbar"

export default async function ExecutiveLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user || session.user.role !== "EXECUTIVE") {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#101622]">
      <Navbar
        userName={session.user.name || "Executive"}
        userRole="Executive"
        links={[
          { href: "/executive/projects", label: "Projects" },
        ]}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
