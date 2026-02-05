import { Server as HTTPServer } from "http"
import { Server as SocketIOServer } from "socket.io"
import { parse } from "cookie"
import { getToken } from "next-auth/jwt"

let io: SocketIOServer | null = null

export function initSocketIO(server: HTTPServer) {
  if (io) {
    return io
  }

  io = new SocketIOServer(server, {
    path: "/api/socketio",
    cors: {
      origin: process.env.NEXTAUTH_URL || "http://localhost:3000",
      credentials: true,
    },
  })

  io.use(async (socket, next) => {
    try {
      // Auth middleware
      const cookies = socket.handshake.headers.cookie
      if (!cookies) {
        return next(new Error("Authentication required"))
      }

      const parsedCookies = parse(cookies)
      const sessionToken =
        parsedCookies["next-auth.session-token"] ||
        parsedCookies["__Secure-next-auth.session-token"]

      if (!sessionToken) {
        return next(new Error("No session token"))
      }

      const token = await getToken({
        req: socket.request as any,
        secret: process.env.NEXTAUTH_SECRET,
      })

      if (!token) {
        return next(new Error("Invalid session"))
      }

      socket.data.user = token
      next()
    } catch (error) {
      next(new Error("Authentication failed"))
    }
  })

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.data.user?.email)

    // Join project room
    socket.on("join:project", (projectId: string) => {
      socket.join(`project:${projectId}`)
      console.log(`User ${socket.data.user?.email} joined project:${projectId}`)
    })

    // Leave project room
    socket.on("leave:project", (projectId: string) => {
      socket.leave(`project:${projectId}`)
      console.log(`User ${socket.data.user?.email} left project:${projectId}`)
    })

    // Join task room
    socket.on("join:task", (taskId: string) => {
      socket.join(`task:${taskId}`)
      console.log(`User ${socket.data.user?.email} joined task:${taskId}`)
    })

    // Leave task room
    socket.on("leave:task", (taskId: string) => {
      socket.leave(`task:${taskId}`)
      console.log(`User ${socket.data.user?.email} left task:${taskId}`)
    })

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.data.user?.email)
    })
  })

  return io
}

export function getIO(): SocketIOServer | null {
  return io
}

export function broadcastToProject(projectId: string, event: string, data: any) {
  if (io) {
    io.to(`project:${projectId}`).emit(event, data)
  }
}

export function broadcastToTask(taskId: string, event: string, data: any) {
  if (io) {
    io.to(`task:${taskId}`).emit(event, data)
  }
}
