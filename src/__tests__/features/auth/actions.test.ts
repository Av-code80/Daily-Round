import { describe, it, expect, vi, beforeEach } from 'vitest'
import { loginWithEmail, signinWithGoogle, signOutUser } from '@/features/auth/actions'

const mocks = vi.hoisted(() => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
  redirect: vi.fn(),
  getLocale: vi.fn().mockResolvedValue('fr'),
}))

vi.mock('@/lib/auth', () => ({ signIn: mocks.signIn, signOut: mocks.signOut }))
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }))
vi.mock('next-intl/server', () => ({ getLocale: mocks.getLocale }))

// Auth.js signals redirects by throwing an error whose digest starts with NEXT_REDIRECT
const NEXT_REDIRECT = { digest: 'NEXT_REDIRECT;replace;/fr/;303;' }

describe('loginWithEmail', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls redirect to /auth/verify when Auth.js throws NEXT_REDIRECT', async () => {
    mocks.signIn.mockRejectedValue(NEXT_REDIRECT)
    await loginWithEmail('user@example.com')
    expect(mocks.redirect).toHaveBeenCalledWith('/fr/auth/verify')
  })

  it('returns auth_error when signIn throws a real error', async () => {
    mocks.signIn.mockRejectedValue(new Error('smtp failure'))
    const result = await loginWithEmail('user@example.com')
    expect(result).toEqual({ error: 'auth_error' })
  })
})

describe('signinWithGoogle', () => {
  beforeEach(() => vi.clearAllMocks())

  it('re-throws NEXT_REDIRECT so Next.js can perform the browser redirect to Google', async () => {
    mocks.signIn.mockRejectedValue(NEXT_REDIRECT)
    await expect(signinWithGoogle()).rejects.toMatchObject(NEXT_REDIRECT)
  })

  it('returns auth_error on a real OAuth failure', async () => {
    mocks.signIn.mockRejectedValue(new Error('oauth error'))
    const result = await signinWithGoogle()
    expect(result).toEqual({ error: 'auth_error' })
  })
})

describe('signOutUser', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls redirect to /auth/login when Auth.js throws NEXT_REDIRECT', async () => {
    mocks.signOut.mockRejectedValue(NEXT_REDIRECT)
    await signOutUser()
    expect(mocks.redirect).toHaveBeenCalledWith('/fr/auth/login')
  })

  it('returns auth_error when signOut throws a real error', async () => {
    mocks.signOut.mockRejectedValue(new Error('session expired'))
    const result = await signOutUser()
    expect(result).toEqual({ error: 'auth_error' })
  })
})
