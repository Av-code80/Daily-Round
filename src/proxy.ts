import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth.config'
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'
import { NextResponse } from 'next/server'

const { auth } = NextAuth(authConfig)

const handleI18n = createIntlMiddleware(routing)

const AUTH_ROUTES = ['/auth/login', '/auth/verify', '/auth/error']
const LOGIN_ROUTES = ['/auth/login', '/auth/verify']

export default auth((req) => {
  const { nextUrl } = req
  const session = req.auth
  const locale = nextUrl.pathname.split('/')[1] || 'fr'

  const bare = nextUrl.pathname.replace(/^\/(fr|en)/, '') || '/'

  const isAuthRoute =
    AUTH_ROUTES.some((p) => bare.startsWith(p)) ||
    nextUrl.pathname.startsWith('/api/auth')
  const isLoginRoute = LOGIN_ROUTES.some((p) => bare.startsWith(p))

  if (!session && !isAuthRoute) {
    return NextResponse.redirect(new URL(`/${locale}/auth/login`, req.url))
  }

  if (session && isLoginRoute) {
    return NextResponse.redirect(new URL(`/${locale}/`, req.url))
  }

  return handleI18n(req)
})

export const config = {
  matcher: ['/((?!_next|_vercel|api|.*\\..*).*)'],
}
