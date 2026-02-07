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
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const totalUnread = users.reduce((sum, user) => sum + user.unreadCount, 0)

  useEffect(() => {
    loadConversations()
    loadGroupChats()
    const interval = setInterval(() => {
      loadConversations()
      loadGroupChats()
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  // Handle opening a conversation from outside (e.g., from user profile)
  useEffect(() => {
    if (selectedUserId && users.length > 0) {
      const user = users.find((u) => u.id === selectedUserId)
      if (user) {
        setSelectedUser(user)
      }
    }
  }, [selectedUserId, users])

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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const loadConversations = async () => {
    try {
      const res = await fetch("/api/messages/conversations")
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      }
    } catch (err) {
      console.error("Failed to load conversations:", err)
    }
  }

  const loadGroupChats = async () => {
    try {
      const res = await fetch("/api/groupchats")
      if (res.ok) {
        const data = await res.json()
        setGroupChats(
          data.groupChats.map((gc: any) => ({
            id: gc.id,
            name: gc.name,
            description: gc.description,
            memberCount: gc._count?.members || gc.members.length,
            members: gc.members || [],
            lastMessage: gc.messages?.[0]
              ? {
                  body: gc.messages[0].body,
                  createdAt: gc.messages[0].createdAt,
                  sender: gc.messages[0].sender,
                }
              : null,
          }))
        )
      }
    } catch (err) {
      console.error("Failed to load group chats:", err)
    }
  }

  const loadGroupMessages = async (groupId: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/groupchats/${groupId}/messages`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
      }
    } catch (err) {
      console.error("Failed to load group messages:", err)
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (userId: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/messages?userId=${userId}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, unreadCount: 0 } : u))
        )
      }
    } catch (err) {
      console.error("Failed to load messages:", err)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || (!selectedUser && !selectedGroup)) return

    setSending(true)
    try {
      const res = await fetch(
        selectedGroup
          ? `/api/groupchats/${selectedGroup.id}/messages`
          : "/api/messages",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            selectedGroup
              ? { body: newMessage }
              : { receiverId: selectedUser!.id, body: newMessage }
          ),
        }
      )

      if (res.ok) {
        setNewMessage("")
        if (selectedGroup) {
          await loadGroupMessages(selectedGroup.id)
          await loadGroupChats()
        } else if (selectedUser) {
          await loadMessages(selectedUser.id)
          await loadConversations()
        }
      } else {
        alert("Failed to send message")
      }
    } catch (err) {
      console.error("Failed to send message:", err)
      alert("Failed to send message")
    } finally {
      setSending(false)
    }
  }

  const getRoleBadge = (role: string) => {
    const colors = {
      EXECUTIVE: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      MANAGER: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      EMPLOYEE: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
    }
    return colors[role as keyof typeof colors] || colors.EMPLOYEE
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div
      className={`fixed left-0 top-0 h-full bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 z-40 flex flex-col ${
        isOpen ? "w-80" : "w-16"
      }`}
    >
      {/* Header */}
      <div className="bg-emerald-600 dark:bg-emerald-700 text-white p-4 flex justify-between items-center min-h-[64px] shrink-0">
        {isOpen ? (
          <>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {selectedUser ? (
                <>
                  {selectedUser.avatarUrl ? (
                    <img
                      src={selectedUser.avatarUrl}
                      alt={selectedUser.name}
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        e.currentTarget.nextElementSibling?.classList.remove('hidden')
                      }}
                    />
                  ) : null}
                  <div className={selectedUser.avatarUrl ? 'hidden' : 'w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0'}>
                    {selectedUser.name.charAt(0)}
                  </div>
                  <Link
                    href={`/users/${selectedUser.id}`}
                    className="font-semibold hover:underline truncate"
                  >
                    {selectedUser.name}
                  </Link>
                </>
              ) : selectedGroup ? (
                <>
                  <Users size={20} className="flex-shrink-0" />
                  <h2 className="font-semibold truncate">{selectedGroup.name}</h2>
                </>
              ) : (
                <>
                  <MessageSquare size={20} className="flex-shrink-0" />
                  <h2 className="font-semibold truncate">
                    {viewMode === "dm" ? "Direct Messages" : "Group Chats"}
                  </h2>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {(selectedUser || selectedGroup) && (
                <button
                  onClick={() => {
                    setSelectedUser(null)
                    setSelectedGroup(null)
                  }}
                  className="hover:bg-emerald-700 dark:hover:bg-emerald-800 p-1 rounded"
                  title="Back to list"
                >
                  <ChevronLeft size={20} />
                </button>
              )}
              {!selectedUser && !selectedGroup && (
                <button
                  onClick={() => setIsOpen(false)}
                  className="hover:bg-emerald-700 dark:hover:bg-emerald-800 p-1 rounded"
                  title="Collapse sidebar"
                >
                  <ChevronLeft size={20} />
                </button>
              )}
            </div>
          </>
        ) : (
          <button
            onClick={() => setIsOpen(true)}
            className="w-full flex justify-center hover:bg-emerald-700 dark:hover:bg-emerald-800 p-2 rounded"
            title="Expand sidebar"
          >
            <div className="relative">
              <MessageSquare size={20} />
              {totalUnread > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                  {totalUnread > 9 ? "9" : totalUnread}
                </span>
              )}
            </div>
          </button>
        )}
      </div>

      {/* Tabs (only shown when open and no conversation selected) */}
      {isOpen && !selectedUser && !selectedGroup && (
        <div className="flex border-b border-slate-200 dark:border-slate-700 shrink-0">
          <button
            onClick={() => setViewMode("dm")}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              viewMode === "dm"
                ? "text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <MessageSquare size={16} />
              <span>Direct</span>
            </div>
          </button>
          <button
            onClick={() => setViewMode("group")}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              viewMode === "group"
                ? "text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Users size={16} />
              <span>Groups</span>
            </div>
          </button>
        </div>
      )}

      {/* Content */}
      {!selectedUser && !selectedGroup ? (
        /* List view */
        <div className="flex-1 overflow-y-auto">
          {isOpen ? (
            viewMode === "dm" ? (
              /* Direct messages list */
              users.length === 0 ? (
                <div className="p-4 text-center text-slate-500 dark:text-slate-400">
                  No conversations yet
                </div>
              ) : (
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        e.currentTarget.nextElementSibling?.classList.remove('hidden')
                      }}
                    />
                  ) : null}
                  <div className={selectedUser.avatarUrl ? 'hidden' : 'w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0'}>
                    {selectedUser.name.charAt(0)}
                  </div>
                  <Link
                    href={`/users/${selectedUser.id}`}
                    className="font-semibold hover:underline truncate"
                  >
                    {selectedUser.name}
                  </Link>
                </>
              ) : (
                <>
                  <MessageSquare size={20} className="flex-shrink-0" />
                  <h2 className="font-semibold truncate">Direct Messages</h2>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {selectedUser && (
                <button
                  onClick={() => setSelectedUser(null)}
                  className="hover:bg-emerald-700 dark:hover:bg-emerald-800 p-1 rounded"
                  title="Back to list"
                >
                  <ChevronLeft size={20} />
                </button>
              )}
              {!selectedUser && (
                <button
                  onClick={() => setIsOpen(false)}
                  className="hover:bg-emerald-700 dark:hover:bg-emerald-800 p-1 rounded"
                  title="Collapse sidebar"
                >
                  <ChevronLeft size={20} />
                </button>
              )}
            </div>
          </>
        ) : (
          <button
            onClick={() => setIsOpen(true)}
            className="w-full flex justify-center hover:bg-emerald-700 dark:hover:bg-emerald-800 p-2 rounded"
            title="Expand sidebar"
          >
            <div className="relative">
              <MessageSquare size={20} />
              {totalUnread > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                  {totalUnread > 9 ? "9" : totalUnread}
                </span>
              )}
            </div>
          </button>
        )}
      </div>

      {/* Content */}
      {!selectedUser ? (
        /* User list */
        <div className="flex-1 overflow-y-auto">
          {isOpen ? (
            /* Expanded user list */
            users.length === 0 ? (
              <div className="p-4 text-center text-slate-500 dark:text-slate-400">
                No conversations yet
              </div>
            ) : (
              users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className="w-full p-4 border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-left transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.name}
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                              e.currentTarget.nextElementSibling?.classList.remove('hidden')
                            }}
                          />
                        ) : null}
                        <div className={user.avatarUrl ? 'hidden' : 'w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white font-semibold text-sm'}>
                          {user.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-slate-900 dark:text-slate-100 truncate">
                            {user.name}
                          </div>
                          <span
                            className={`text-xs px-2 py-0.5 rounded ${getRoleBadge(
                              user.role
                            )}`}
                          >
                            {user.role}
                          </span>
                        </div>
                      </div>
                      {user.lastMessage && (
                        <div className="text-sm text-slate-600 dark:text-slate-400 truncate mt-1">
                          {user.lastMessage.isSentByMe ? "You: " : ""}
                          {user.lastMessage.body}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {user.lastMessage && (
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {formatTime(user.lastMessage.createdAt)}
                        </span>
                      )}
                      {user.unreadCount > 0 && (
                        <span className="bg-emerald-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                          {user.unreadCount > 9 ? "9+" : user.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )
          ) : (
            /* Collapsed user list - just avatars */
            <div className="flex flex-col items-center gap-3 py-4">
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => {
                    setIsOpen(true)
                    setSelectedUser(user)
                  }}
                  className="relative hover:scale-110 transition-transform"
                  title={user.name}
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover shadow-lg"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        e.currentTarget.nextElementSibling?.classList.remove('hidden')
                      }}
                    />
                  ) : null}
                  <div className={user.avatarUrl ? 'hidden' : 'w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white font-semibold text-sm shadow-lg'}>
                    {user.name.charAt(0)}
                  </div>
                  {user.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white dark:border-slate-800">
                      {user.unreadCount > 9 ? "9" : user.unreadCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Message thread */
        isOpen ? (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loading && messages.length === 0 ? (
                <div className="text-center text-slate-500 dark:text-slate-400 py-8">
                  Loading...
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-slate-500 dark:text-slate-400 py-8">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender.id !== selectedUser?.id
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-lg p-3 ${
                          isMe
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                        }`}
                      >
                        <div className="text-sm break-words">{msg.body}</div>
                        <div
                          className={`text-xs mt-1 ${
                            isMe
                              ? "text-emerald-100"
                              : "text-slate-500 dark:text-slate-400"
                          }`}
                        >
                          {formatTime(msg.createdAt)}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message input */}
            <form
              onSubmit={sendMessage}
              className="p-4 border-t border-slate-200 dark:border-slate-700 shrink-0"
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-600 focus:border-transparent"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
                >
                  <Send size={18} />
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Collapsed - show selected user avatar */
          <div className="flex-1 flex items-center justify-center">
            <button
              onClick={() => setIsOpen(true)}
              className="relative hover:scale-110 transition-transform"
              title={selectedUser?.name}
            >
              {selectedUser?.avatarUrl ? (
                <img
                  src={selectedUser.avatarUrl}
                  alt={selectedUser.name}
                  className="w-10 h-10 rounded-full object-cover shadow-lg"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    e.currentTarget.nextElementSibling?.classList.remove('hidden')
                  }}
                />
              ) : null}
              <div className={selectedUser?.avatarUrl ? 'hidden' : 'w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white font-semibold text-sm shadow-lg'}>
                {selectedUser?.name.charAt(0)}
              </div>
            </button>
          </div>
        )
      )}
    </div>
  )
}
