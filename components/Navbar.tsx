"use client"

import { signOut } from "next-auth/react"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface NavbarProps {
  userName: string
  userRole: string
  links: { href: string; label: string }[]
}

export function Navbar({ userName, userRole, links }: NavbarProps) {
  const pathname = usePathname()

  return (
    <nav className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              AuToDo
            </Link>
            <div className="flex space-x-4">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === link.href
                      ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                      : "text-gray-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm">
              <div className="font-medium text-slate-900 dark:text-white">{userName}</div>
              <div className="text-slate-500 dark:text-slate-400 text-xs">{userRole}</div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="px-4 py-2 rounded-md text-sm font-medium bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
