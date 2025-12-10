import { createAuthClient } from "better-auth/react"
import { polarClient } from "@polar-sh/better-auth/client"

// Type assertion to handle version mismatch between better-auth and @polar-sh/better-auth
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const polarClientPlugin = polarClient() as any

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  plugins: [polarClientPlugin],
})

// Type-safe exports with checkout and customer methods
export const { signIn, signOut, signUp, useSession, getSession } = authClient

// Polar-specific exports - these methods exist after adding the polar plugin
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const checkout = (authClient as any).checkout
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const customer = (authClient as any).customer
