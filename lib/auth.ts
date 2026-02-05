import NextAuth, { NextAuthOptions, DefaultSession } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"
import { UserRole } from "@prisma/client"
import { getServerSession } from "next-auth/next"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: UserRole
      teamId: string | null
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    role: UserRole
    teamId: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: UserRole
    teamId: string | null
  }
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          teamId: user.teamId,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.teamId = user.teamId
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.teamId = token.teamId
      }
      return session
    },
  },
}

export const auth = () => getServerSession(authOptions)
