"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronLeft, MessageSquare, Send, Users, Plus } from "lucide-react"
import { useSidebar } from "./SidebarLayout"
import Link from "next/link"

interface User {
  id: string
  name: string
  email: string
  role: string
  unreadCount: number
  avatarUrl?: string | null
  lastMessage: {
    body: string
    createdAt: string
    isSentByMe: boolean
  } | null
}

interface GroupChat {
  id: string
  name: string
  description?: string
  memberCount: number
  members: Array<{
    user: {
      id: string
      name: string
      email: string
      avatarUrl?: string | null
    }
  }>
  lastMessage: {
    body: string
    createdAt: string
    sender: { name: string }
  } | null
}

interface Message {
  id: string
  body: string
  senderId: string
  receiverId?: string
  groupChatId?: string
  createdAt: string
  sender: { id: string; name: string; avatarUrl?: string | null }
  receiver?: { id: string; name: string }
}

type ViewMode = "dm" | "group"

export function MessageSidebar() {
  const { isOpen, setIsOpen, selectedUserId } = useSidebar()
  const [viewMode, setViewMode] = useState<ViewMode>("dm")
  const [users, setUsers] = useState<User[]>([])
  const [groupChats, setGroupChats] = useState<GroupChat[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<GroupChat | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showNewGroupModal, setShowNewGroupModal] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const totalUnread = users.reduce((sum, user) => sum + user.unreadCount, 0)

  useEffect(() => {
    loadCurrentUser()
    loadConversations()
    loadGroupChats()
    const interval = setInterval(() => {
      loadConversations()
      loadGroupChats()
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  async function loadCurrentUser() {
    try {
      const res = await fetch("/api/auth/session")
      if (res.ok) {
        const session = await res.json()
        setCurrentUserId(session.user.id)
      }
    } catch (err) {
      console.error("Failed to load current user:", err)
    }
  }

  useEffect(() => {
    if (selectedUserId) {
      console.log("[MessageSidebar] selectedUserId changed:", selectedUserId)
      console.log("[MessageSidebar] users array length:", users.length)
      const user = users.find((u) => u.id === selectedUserId)
      if (user) {
        console.log("[MessageSidebar] Found user in list:", user.name)
        setSelectedUser(user)
        setSelectedGroup(null)
        setViewMode("dm")
        setIsOpen(true)
      } else {
        console.log("[MessageSidebar] User not in list, fetching by ID:", selectedUserId)
        // User not in conversation list, fetch their details
        loadUserById(selectedUserId)
      }
    }
  }, [selectedUserId, users])

  async function loadUserById(userId: string) {
    console.log("[MessageSidebar] loadUserById called:", userId)
    try {
      const res = await fetch(`/api/users/${userId}`)
      console.log("[MessageSidebar] API response status:", res.status)
      if (res.ok) {
        const userData = await res.json()
        console.log("[MessageSidebar] User data received:", userData)
        const user: User = {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          avatarUrl: userData.avatarUrl,
          unreadCount: 0,
          lastMessage: null,
        }
        console.log("[MessageSidebar] Setting selected user:", user.name)
        setSelectedUser(user)
        setSelectedGroup(null)
        setViewMode("dm")
        setIsOpen(true)
      } else {
        console.error("[MessageSidebar] API response not ok:", res.status)
      }
    } catch (err) {
      console.error("[MessageSidebar] Failed to load user:", err)
    }
  }

  useEffect(() => {
    if (selectedUser) {
      loadMessages(selectedUser.id)
      const interval = setInterval(() => loadMessages(selectedUser.id), 3000)
      return () => clearInterval(interval)
    } else if (selectedGroup) {
      loadGroupMessages(selectedGroup.id)
      const interval = setInterval(() => loadGroupMessages(selectedGroup.id), 3000)
      return () => clearInterval(interval)
    }
  }, [selectedUser, selectedGroup])

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  async function loadConversations() {
    try {
      const res = await fetch("/api/messages/users")
      if (res.ok) {
        setUsers(await res.json())
      }
    } catch (err) {
      console.error("Failed to load conversations:", err)
    }
  }

  async function loadGroupChats() {
    try {
      const res = await fetch("/api/groupchats")
      if (res.ok) {
        const data = await res.json()
        setGroupChats(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      console.error("Failed to load group chats:", err)
      setGroupChats([])
    }
  }

  async function loadMessages(userId: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/messages/user/${userId}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      console.error("Failed to load messages:", err)
      setMessages([])
    } finally {
      setLoading(false)
    }
  }

  async function loadGroupMessages(groupId: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/groupchats/${groupId}/messages`)
      if (res.ok) {
        const data = await res.json()
        setMessages(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      console.error("Failed to load group messages:", err)
      setMessages([])
    } finally {
      setLoading(false)
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim()) return

    setSending(true)
    try {
      if (viewMode === "dm" && selectedUser) {
        const res = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ receiverId: selectedUser.id, body: newMessage }),
        })
        if (res.ok) {
          setNewMessage("")
          loadMessages(selectedUser.id)
          loadConversations()
        }
      } else if (viewMode === "group" && selectedGroup) {
        const res = await fetch(`/api/groupchats/${selectedGroup.id}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: newMessage }),
        })
        if (res.ok) {
          setNewMessage("")
          loadGroupMessages(selectedGroup.id)
          loadGroupChats()
        }
      }
    } catch (err) {
      console.error("Failed to send message:", err)
    } finally {
      setSending(false)
    }
  }

  function formatTime(timestamp: string) {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "just now"
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  function getRoleBadge(role: string) {
    switch (role) {
      case "EXECUTIVE":
        return "bg-purple-500/20 text-purple-300"
      case "MANAGER":
        return "bg-blue-500/20 text-blue-300"
      case "EMPLOYEE":
        return "bg-emerald-500/20 text-emerald-300"
      default:
        return "bg-slate-500/20 text-slate-300"
    }
  }

  return (
    <div
      className={`fixed left-0 top-0 h-full bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 z-40 flex flex-col ${
        isOpen ? "w-80" : "w-16"
      }`}
    >
      {/* Header */}
      <div className="h-16 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4">
        {isOpen ? (
          <>
            {selectedUser ? (
              <div className="flex items-center gap-3">
                {selectedUser.avatarUrl ? (
                  <img
                    src={selectedUser.avatarUrl}
                    alt={selectedUser.name}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    onError={(e) => {
                      e.currentTarget.style.display = "none"
                    }}
                  />
                ) : null}
                <div className={selectedUser.avatarUrl ? 'hidden' : 'w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white font-semibold text-sm'}>
                  {selectedUser.name.charAt(0)}
                </div>
                <Link 
                  href={`/users/${selectedUser.id}`}
                  className="hover:underline"
                >
                  {selectedUser.name}
                </Link>
              </div>
            ) : selectedGroup ? (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-medium">{selectedGroup.name}</div>
                  <div className="text-xs text-slate-500">{selectedGroup.memberCount} members</div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <span className="font-semibold">Messages</span>
                {totalUnread > 0 && (
                  <span className="bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {totalUnread}
                  </span>
                )}
              </div>
            )}
            <button
              onClick={() => {
                if (selectedUser || selectedGroup) {
                  setSelectedUser(null)
                  setSelectedGroup(null)
                  setMessages([])
                } else {
                  setIsOpen(false)
                }
              }}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          </>
        ) : (
          <button
            onClick={() => setIsOpen(true)}
            className="relative w-full flex items-center justify-center"
          >
            <MessageSquare className="h-6 w-6 text-slate-600 dark:text-slate-400" />
            {totalUnread > 0 && (
              <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                {totalUnread > 9 ? "9+" : totalUnread}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Content */}
      {!selectedUser && !selectedGroup ? (
        <div className="flex-1 overflow-y-auto">
          {isOpen ? (
            <>
              {/* Tabs */}
              <div className="flex border-b border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setViewMode("dm")}
                  className={`flex-1 px-4 py-2 text-sm font-medium ${
                    viewMode === "dm"
                      ? "text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  Direct
                </button>
                <button
                  onClick={() => setViewMode("group")}
                  className={`flex-1 px-4 py-2 text-sm font-medium ${
                    viewMode === "group"
                      ? "text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  Groups
                </button>
              </div>

              {/* List View */}
              {viewMode === "dm" ? (
                <>
                  {users.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                      <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No conversations yet</p>
                    </div>
                  ) : (
                    users.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => {
                          setSelectedUser(user)
                          setSelectedGroup(null)
                        }}
                        className="w-full p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700 text-left transition"
                      >
                        <div className="flex items-start gap-3">
                          <div className="relative flex-shrink-0">
                            {user.avatarUrl ? (
                              <img
                                src={user.avatarUrl}
                                alt={user.name}
                                className="w-12 h-12 rounded-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none"
                                }}
                              />
                            ) : null}
                            <div className={user.avatarUrl ? 'hidden' : 'w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white font-semibold'}>
                              {user.name.charAt(0)}
                            </div>
                            {user.unreadCount > 0 && (
                              <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                                {user.unreadCount > 9 ? "9+" : user.unreadCount}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium truncate">{user.name}</span>
                              <span
                                className={`text-xs px-2 py-0.5 rounded ${getRoleBadge(
                                  user.role
                                )}`}
                              >
                                {user.role}
                              </span>
                            </div>
                            {user.lastMessage && (
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-600 dark:text-slate-400 truncate flex-1">
                                  {user.lastMessage.isSentByMe ? "You: " : ""}
                                  {user.lastMessage.body}
                                </span>
                                <span className="text-slate-500 ml-2 whitespace-nowrap">
                                  {formatTime(user.lastMessage.createdAt)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </>
              ) : (
                <>
                  <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                    <button
                      onClick={() => setShowNewGroupModal(true)}
                      className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center justify-center gap-2 transition"
                    >
                      <Plus className="h-4 w-4" />
                      New Group
                    </button>
                  </div>
                  {!Array.isArray(groupChats) || groupChats.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                      <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No group chats yet</p>
                    </div>
                  ) : (
                    groupChats.map((group) => (
                      <button
                        key={group.id}
                        onClick={() => {
                          setSelectedGroup(group)
                          setSelectedUser(null)
                        }}
                        className="w-full p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700 text-left transition"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white flex-shrink-0">
                            <Users className="h-6 w-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium truncate">{group.name}</span>
                              <span className="text-xs text-slate-500">
                                {group.memberCount} members
                              </span>
                            </div>
                            {group.lastMessage && (
                              <div className="text-xs text-slate-600 dark:text-slate-400 truncate">
                                <span className="font-medium">{group.lastMessage.sender.name}: </span>
                                {group.lastMessage.body}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </>
              )}
            </>
          ) : (
            <div className="space-y-2 p-2">
              {users.slice(0, 5).map((user) => (
                <button
                  key={user.id}
                  onClick={() => {
                    setIsOpen(true)
                    setSelectedUser(user)
                    setViewMode("dm")
                  }}
                  className="relative w-full flex items-center justify-center p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                  title={user.name}
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none"
                      }}
                    />
                  ) : null}
                  <div className={user.avatarUrl ? 'hidden' : 'w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white text-sm font-semibold'}>
                    {user.name.charAt(0)}
                  </div>
                  {user.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                      {user.unreadCount > 9 ? "9+" : user.unreadCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Messages Thread */
        isOpen ? (
          <div className="flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loading && messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                </div>
              ) : !Array.isArray(messages) || messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-500">
                  <p className="text-sm">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = viewMode === "dm" 
                    ? msg.sender.id !== selectedUser?.id
                    : msg.sender.id === currentUserId
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`max-w-[75%] ${isMe ? "order-2" : "order-1"}`}>
                        {viewMode === "group" && !isMe && (
                          <div className="text-xs text-slate-500 mb-1 ml-2">
                            {msg.sender.name}
                          </div>
                        )}
                        <div
                          className={`px-4 py-2 rounded-lg ${
                            isMe
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                          }`}
                        >
                          <p className="text-sm break-words">{msg.body}</p>
                          <p className="text-xs mt-1 opacity-70">
                            {formatTime(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form
              onSubmit={sendMessage}
              className="border-t border-slate-200 dark:border-slate-700 p-4"
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-800"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 text-white rounded-lg transition flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Collapsed with thread open */
          <div className="flex-1 flex items-center justify-center p-2">
            <button
              onClick={() => setIsOpen(true)}
              className="w-10 h-10 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition"
              title={selectedUser?.name || selectedGroup?.name}
            >
              {selectedUser?.avatarUrl ? (
                <img
                  src={selectedUser.avatarUrl}
                  alt={selectedUser.name}
                  className="w-10 h-10 rounded-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none"
                  }}
                />
              ) : selectedGroup ? (
                <Users className="h-5 w-5" />
              ) : (
                <MessageSquare className="h-5 w-5" />
              )}
            </button>
          </div>
        )
      )}

      {/* New Group Modal */}
      {showNewGroupModal && (
        <NewGroupModal
          users={users}
          onClose={() => setShowNewGroupModal(false)}
          onCreated={() => {
            setShowNewGroupModal(false)
            loadGroupChats()
          }}
        />
      )}
    </div>
  )
}

function NewGroupModal({
  users,
  onClose,
  onCreated,
}: {
  users: User[]
  onClose: () => void
  onCreated: () => void
}) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [creating, setCreating] = useState(false)
  const [allUsers, setAllUsers] = useState<User[]>(users)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAllUsers()
  }, [])

  async function loadAllUsers() {
    setLoading(true)
    try {
      const res = await fetch("/api/users")
      if (res.ok) {
        const data = await res.json()
        setAllUsers(Array.isArray(data) ? data : [])
      } else {
        // Fallback to users from DM list
        setAllUsers(users)
      }
    } catch (err) {
      console.error("Failed to load users:", err)
      setAllUsers(users)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || selectedUserIds.length === 0) return

    setCreating(true)
    setError(null)
    try {
      const res = await fetch("/api/groupchats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || undefined,
          memberIds: selectedUserIds,
        }),
      })
      if (res.ok) {
        onCreated()
      } else {
        const errorData = await res.json().catch(() => ({ error: "Failed to create group" }))
        setError(errorData.error || "Failed to create group")
      }
    } catch (err) {
      console.error("Failed to create group:", err)
      setError("Failed to create group. Please try again.")
    } finally {
      setCreating(false)
    }
  }

  function toggleUser(userId: string) {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg max-w-md w-full max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold">Create Group Chat</h2>
        </div>
        <form onSubmit={handleCreate} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Group Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Project Team"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-900"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description (optional)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Team collaboration chat"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Add Members * {allUsers.length > 0 && `(${allUsers.length} available)`}
              </label>
              {error && (
                <div className="mb-2 p-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded">
                  {error}
                </div>
              )}
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                </div>
              ) : allUsers.length === 0 ? (
                <div className="p-4 text-center text-slate-500 text-sm">
                  No users available
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {allUsers.map((user) => (
                  <label
                    key={user.id}
                    className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUserIds.includes(user.id)}
                      onChange={() => toggleUser(user.id)}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.name}
                        className="w-8 h-8 rounded-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none"
                        }}
                      />
                    ) : null}
                    <div className={user.avatarUrl ? 'hidden' : 'w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white text-sm font-semibold'}>
                      {user.name.charAt(0)}
                    </div>
                    <span className="text-sm">{user.name}</span>
                  </label>
                  ))}
                </div>
              )}
            </div>
            {selectedUserIds.length > 0 && (
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {selectedUserIds.length} member{selectedUserIds.length !== 1 ? 's' : ''} selected
              </div>
            )}
          </div>
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition"
              disabled={creating}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || !name.trim() || selectedUserIds.length === 0}
              className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 text-white rounded-lg transition"
            >
              {creating ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
