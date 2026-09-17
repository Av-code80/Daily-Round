import { Suspense } from 'react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { ArrowLeft } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { IssuerSettings } from '@/features/invoicing/components/IssuerSettings'

type Params = Promise<{ locale: string }>

// `params` is never awaited here: doing so would block the whole shell on
// runtime data and cost the instant navigation.
export default function IssuerSettingsPage({ params }: { params: Params }) {
  return (
    <main className='mx-auto w-full max-w-2xl space-y-6 mt-6'>
      <Suspense fallback={<HeaderSkeleton />}>
        <SettingsHeader params={params} />
      </Suspense>

      <Suspense fallback={<FormSkeleton />}>
        <SettingsSlot params={params} />
      </Suspense>
    </main>
  )
}

async function SettingsHeader({ params }: { params: Params }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('Invoicing.issuer')

  return (
    <header className='space-y-1 pt-2'>
      <Link
        href='/facturation'
        className='inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground'
      >
        <ArrowLeft className='h-4 w-4' aria-hidden />
        {t('backToList')}
      </Link>
      <h1 className='text-3xl font-bold tracking-tight text-[#1B2838] dark:text-foreground'>
        {t('title')}
      </h1>
      <p className='text-sm text-foreground/60'>{t('hint')}</p>
    </header>
  )
}

async function SettingsSlot({ params }: { params: Params }) {
  const { locale } = await params
  setRequestLocale(locale)

  return <IssuerSettings />
}

function HeaderSkeleton() {
  return (
    <div className='animate-pulse space-y-2 pt-2'>
      <div className='h-9 w-72 rounded-lg bg-foreground/5' />
      <div className='h-4 w-96 rounded bg-foreground/5' />
    </div>
  )
}

function FormSkeleton() {
  return (
    <div className='animate-pulse space-y-4'>
      <div className='h-12 rounded-lg bg-foreground/5' />
      <div className='h-12 rounded-lg bg-foreground/5' />
      <div className='h-12 rounded-lg bg-foreground/5' />
      <div className='h-14 rounded-lg bg-foreground/5' />
    </div>
  )
}
