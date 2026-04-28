import NextAuth from 'next-auth'
import Resend from 'next-auth/providers/resend'
import Google from 'next-auth/providers/google'
import { SupabaseAdapter } from '@auth/supabase-adapter'
import { authConfig } from './auth.config'

// Guard: SupabaseAdapter throws at module-load time if env vars are missing.
// During CI build, Next.js imports this module even for force-dynamic routes.
const adapter =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? SupabaseAdapter({
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        secret: process.env.SUPABASE_SERVICE_ROLE_KEY,
      })
    : undefined

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter,
  // JWT strategy: sessions encoded in a signed cookie, not stored in DB.
  // Required so Edge middleware can verify the session without a DB call.
  session: { strategy: 'jwt' },
  providers: [
    Resend({
      apiKey: process.env.RESEND_API_KEY!,
      from: process.env.RESEND_FROM_EMAIL!,
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
})
