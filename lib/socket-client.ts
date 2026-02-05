"use client"

import { useEffect, useState } from "react"
import { io, Socket } from "socket.io-client"

let socket: Socket | null = null

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!socket) {
      socket = io({
        path: "/api/socketio",
        transports: ["websocket", "polling"],
      })

      socket.on("connect", () => {
        console.log("Socket connected")
        setIsConnected(true)
      })

      socket.on("disconnect", () => {
        console.log("Socket disconnected")
        setIsConnected(false)
      })
    }

    return () => {
      // Don't disconnect on unmount, keep persistent connection
    }
  }, [])

  return { socket, isConnected }
}

export function joinProject(projectId: string) {
  if (socket) {
    socket.emit("join:project", projectId)
  }
}

export function leaveProject(projectId: string) {
  if (socket) {
    socket.emit("leave:project", projectId)
  }
}

export function joinTask(taskId: string) {
  if (socket) {
    socket.emit("join:task", taskId)
  }
}

export function leaveTask(taskId: string) {
  if (socket) {
    socket.emit("leave:task", taskId)
  }
}
