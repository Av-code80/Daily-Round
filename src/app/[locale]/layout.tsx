// src/app/[locale]/layout.tsx
import { NextIntlClientProvider } from 'next-intl'
import { routing } from '@/i18n/routing'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { cacheLife, cacheTag } from 'next/cache'

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

async function getLocaleMessages(locale: string) {
  'use cache'
  cacheLife('max')          // messages only change on deploy
  cacheTag(`i18n:${locale}`) 
  return getMessages({ locale })
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params

  if (!routing.locales.includes(locale as 'fr' | 'en')) notFound()

  setRequestLocale(locale)
  const messages = await getLocaleMessages(locale)

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
}
