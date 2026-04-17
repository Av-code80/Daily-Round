import type { NextAuthConfig } from 'next-auth'

// Edge-compatible Auth.js config — no providers, no adapter, no Node.js APIs.
// Used by proxy.ts (middleware) which only needs to verify JWT session tokens.
export const authConfig: NextAuthConfig = {
  providers: [],
  // Must match auth.ts — middleware reads the same JWT cookie the server sets.
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/fr/auth/login',
    verifyRequest: '/fr/auth/verify',
    error: '/fr/auth/error',
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    session({ session, token }) {
      if (token) session.user.id = token.id as string
      return session
    },
  },
}
