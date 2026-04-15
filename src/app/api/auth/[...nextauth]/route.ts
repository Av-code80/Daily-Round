import { handlers } from '@/lib/auth'

// Auth routes handle sessions/cookies — never statically generated
export const dynamic = 'force-dynamic'

export const { GET, POST } = handlers
