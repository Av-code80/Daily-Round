import { Suspense } from 'react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { ArrowLeft } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { ClientList } from '@/features/invoicing/components/ClientList'

type Params = Promise<{ locale: string }>

// `params` is never awaited here: doing so would block the whole shell on
// runtime data and cost the instant navigation.
export default function ClientsPage({ params }: { params: Params }) {
  return (
    <main className='mx-auto w-full max-w-2xl space-y-6 mt-6'>
      <Suspense fallback={<HeaderSkeleton />}>
        <ClientsHeader params={params} />
      </Suspense>

      <Suspense fallback={<ListSkeleton />}>
        <ListSlot params={params} />
      </Suspense>
    </main>
  )
}

async function ClientsHeader({ params }: { params: Params }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('Invoicing.clients')
  const tList = await getTranslations('Invoicing.list')

  return (
    <header className='space-y-1 pt-2'>
      <Link
        href='/facturation'
        className='inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground'
      >
        <ArrowLeft className='h-4 w-4' aria-hidden />
        {tList('backToList')}
      </Link>
      <h1 className='text-3xl font-bold tracking-tight text-[#1B2838] dark:text-foreground'>
        {t('title')}
      </h1>
      <p className='text-sm text-foreground/60'>{t('hint')}</p>
    </header>
  )
}

async function ListSlot({ params }: { params: Params }) {
  const { locale } = await params
  setRequestLocale(locale)

  return <ClientList />
}

function HeaderSkeleton() {
  return (
    <div className='animate-pulse space-y-2 pt-2'>
      <div className='h-9 w-56 rounded-lg bg-foreground/5' />
      <div className='h-4 w-80 rounded bg-foreground/5' />
    </div>
  )
}

function ListSkeleton() {
  return (
    <div className='animate-pulse space-y-3'>
      {[0, 1, 2].map((i) => (
        <div key={i} className='h-[76px] rounded-xl bg-foreground/5' />
      ))}
    </div>
  )
}
