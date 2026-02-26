import { stripeClient } from "@better-auth/stripe/client"
import { createAuthClient } from "better-auth/react"

const stripeClientPlugin = stripeClient({
  subscription: true,
})

// Use current origin for auth requests to avoid www/non-www cross-origin issues.
// Better Auth defaults to window.location.origin when baseURL is omitted.
export const authClient = createAuthClient({
  plugins: [stripeClientPlugin],
})

// Type-safe exports
export const { signIn, signOut, signUp, useSession, getSession } = authClient

// Stripe subscription exports
export const subscription = authClient.subscription
