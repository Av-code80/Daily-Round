'use server'
import { redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { signIn } from '@/lib/auth'

export async function loginWithEmail(email: string): Promise<{ error: string } | void> {
  const locale = await getLocale()

  try {
    await signIn('resend', {
      email,
      redirectTo: `/${locale}/`,
    })
  } catch (error) {
    // Auth.js throws NEXT_REDIRECT after sending the magic link email.
    // It would go to /api/auth/verify-request by default — we override it
    // so the user stays in the correct locale flow.
    if ((error as { digest?: string }).digest?.startsWith('NEXT_REDIRECT')) {
      redirect(`/${locale}/auth/verify`)
    }
    return { error: 'auth_error' }
  }
}