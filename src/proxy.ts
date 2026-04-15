import createMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'

export default createMiddleware(routing)

export const config = {
  matcher: [
    // Run on all paths except: API routes, Next.js internals, static files
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
}
