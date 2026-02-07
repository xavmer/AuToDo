"use client"

import { createContext, useContext, useState, ReactNode } from "react"

interface SidebarContextType {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  openMessageWith: (userId: string) => void
  selectedUserId: string | null
}

const SidebarContext = createContext<SidebarContextType>({
  isOpen: true,
  setIsOpen: () => {},
  openMessageWith: () => {},
  selectedUserId: null,
})

export const useSidebar = () => useContext(SidebarContext)

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(true)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  const openMessageWith = (userId: string) => {
    setSelectedUserId(userId)
    setIsOpen(true)
  }

  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen, openMessageWith, selectedUserId }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function SidebarLayout({ children }: { children: ReactNode }) {
  const { isOpen } = useSidebar()

  return (
    <div
      className={`min-h-screen bg-gray-50 dark:bg-[#101622] transition-all duration-300 ${
        isOpen ? "ml-80" : "ml-16"
      }`}
    >
      {children}
    </div>
  )
}

export function SidebarLayoutFlex({ children }: { children: ReactNode }) {
  const { isOpen } = useSidebar()

  return (
    <div
      className={`flex flex-col h-screen bg-gray-50 dark:bg-[#101622] transition-all duration-300 ${
        isOpen ? "ml-80" : "ml-16"
      }`}
    >
      {children}
    </div>
  )
}
