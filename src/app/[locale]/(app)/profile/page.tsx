import { Suspense } from 'react'
import { auth } from '@/lib/auth'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { SignOutButton } from '@/features/auth/components/SignOutButton'
import ProfileSkeleton from './ProfileSkeleton'

type Props = { params: Promise<{ locale: string }> }

export default async function ProfilePage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('Profile')

  return (
    <div className='max-w-lg mx-auto p-6 space-y-8'>
      <h1 className='text-2xl font-bold'>{t('title')}</h1>

      {/* Dynamic hole — streams at request time */}
      <Suspense fallback={<ProfileSkeleton label={t('email')} />}>
        <ProfileData locale={locale} emailLabel={t('email')} />
      </Suspense>

      <SignOutButton />
    </div>
  )
}

async function ProfileData({
  locale,
  emailLabel,
}: {
  locale: string
  emailLabel: string
}) {
  const session = await auth()  
  if (!session?.user) redirect(`/${locale}/auth/login`)

  return (
    <section className='space-y-1'>
      <p className='text-sm text-foreground/60'>{emailLabel}</p>
      <p className='font-medium'>{session.user.email}</p>
    </section>
  )
}

