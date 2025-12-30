import { stripeClient } from "@better-auth/stripe/client"
import { createAuthClient } from "better-auth/react"

const stripeClientPlugin = stripeClient({
  subscription: true,
})

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  plugins: [stripeClientPlugin],
})

// Type-safe exports
export const { signIn, signOut, signUp, useSession, getSession } = authClient

// Stripe subscription exports
export const subscription = authClient.subscription
