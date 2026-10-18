import { Suspense } from 'react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { ArrowLeft } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { InvoiceDocument } from '@/features/invoicing/components/InvoiceDocument'
import { PrintButton } from '@/features/invoicing/components/PrintButton'

type Params = Promise<{ locale: string; id: string }>

// `params` is never awaited here: doing so would block the whole shell on
// runtime data and cost the instant navigation.
export default function InvoiceDocumentPage({
  params,
}: {
  params: Params
}) {
  return (
    <main className='mx-auto w-full max-w-2xl space-y-4 mt-6'>
      <Suspense fallback={<ToolbarSkeleton />}>
        <Toolbar params={params} />
      </Suspense>

      <Suspense fallback={<DocumentSkeleton />}>
        <DocumentSlot params={params} />
      </Suspense>
    </main>
  )
}

async function Toolbar({ params }: { params: Params }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('Invoicing.list')

  return (
    <div className='flex items-center justify-between print:hidden'>
      <Link
        href='/facturation'
        className='inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground'
      >
        <ArrowLeft className='h-4 w-4' aria-hidden />
        {t('backToList')}
      </Link>
      <PrintButton />
    </div>
  )
}

async function DocumentSlot({ params }: { params: Params }) {
  const { locale, id } = await params
  setRequestLocale(locale)

  return <InvoiceDocument invoiceId={id} />
}

function ToolbarSkeleton() {
  return (
    <div className='flex items-center justify-between print:hidden'>
      <div className='h-5 w-28 animate-pulse rounded bg-foreground/5' />
      <div className='h-9 w-24 animate-pulse rounded-lg bg-foreground/5' />
    </div>
  )
}

function DocumentSkeleton() {
  return (
    <div className='animate-pulse space-y-4 rounded-xl border border-foreground/10 p-7'>
      <div className='h-20 rounded-lg bg-foreground/5' />
      <div className='h-24 w-64 rounded-lg bg-foreground/5' />
      <div className='h-40 rounded-lg bg-foreground/5' />
    </div>
  )
}
