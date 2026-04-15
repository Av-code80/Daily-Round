import { NextIntlClientProvider } from 'next-intl'
import { routing } from '@/i18n/routing'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function localLayout({ children, params }: Props) {
  const { locale } = await params

  if (!routing.locales.includes(locale as 'fr' | 'en')) {
    notFound()
  }

  setRequestLocale(locale)
  const message = await getMessages()

  return (
    <NextIntlClientProvider locale={locale} messages={message}>
      {children}
    </NextIntlClientProvider>
  )
}
