import { handlers } from '@/lib/auth'

// NextAuth reads cookies/headers internally → automatically dynamic.
// Route segment config exports are incompatible with cacheComponents.
export const { GET, POST } = handlers
