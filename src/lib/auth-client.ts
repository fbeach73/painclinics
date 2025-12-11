import { polarClient } from "@polar-sh/better-auth/client"
import { createAuthClient } from "better-auth/react"

// Type assertion to handle version mismatch between better-auth and @polar-sh/better-auth
 
const polarClientPlugin = polarClient() as any

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  plugins: [polarClientPlugin],
})

// Type-safe exports with checkout and customer methods
export const { signIn, signOut, signUp, useSession, getSession } = authClient

// Polar-specific exports - these methods exist after adding the polar plugin
 
export const checkout = (authClient as any).checkout
 
export const customer = (authClient as any).customer
