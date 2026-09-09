import { Suspense } from 'react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { InvoiceEditor } from '@/features/invoicing/components/InvoiceEditor'

type Params = Promise<{ locale: string; id: string }>

// `params` is never awaited here: doing so would block the whole shell on
// runtime data and cost the instant navigation. Each Suspense child awaits
// it on its own instead.
export default function EditInvoicePage({ params }: { params: Params }) {
  return (
    <main className='mx-auto w-full max-w-2xl space-y-6 mt-6'>
      <Suspense fallback={<HeaderSkeleton />}>
        <EditorHeader params={params} />
      </Suspense>

      <Suspense fallback={<EditorSkeleton />}>
        <EditorSlot params={params} />
      </Suspense>
    </main>
  )
}

async function EditorHeader({ params }: { params: Params }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('Invoicing.form')

  return (
    <header className='space-y-1 pt-2'>
      <h1 className='text-3xl font-bold tracking-tight text-[#1B2838] dark:text-foreground'>
        {t('editTitle')}
      </h1>
      <p className='text-sm text-foreground/60'>{t('editHint')}</p>
    </header>
  )
}

async function EditorSlot({ params }: { params: Params }) {
  const { locale, id } = await params
  setRequestLocale(locale)

  return <InvoiceEditor invoiceId={id} locale={locale} />
}

function HeaderSkeleton() {
  return (
    <div className='animate-pulse space-y-2 pt-2'>
      <div className='h-9 w-64 rounded-lg bg-foreground/5' />
      <div className='h-4 w-80 rounded bg-foreground/5' />
    </div>
  )
}

function EditorSkeleton() {
  return (
    <div className='animate-pulse space-y-4'>
      <div className='h-12 rounded-lg bg-foreground/5' />
      <div className='h-12 rounded-lg bg-foreground/5' />
      <div className='h-28 rounded-xl bg-foreground/5' />
      <div className='h-14 rounded-lg bg-foreground/5' />
    </div>
  )
}
