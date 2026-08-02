import { Suspense } from 'react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Plus } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { InvoiceList } from '@/features/invoicing/components/InvoiceList'

type Props = { params: Promise<{ locale: string }> }

export default async function InvoicingPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('Invoicing')

  return (
    <main className='mx-auto w-full max-w-4xl space-y-6 mt-6'>
      <header className='space-y-1 pt-2'>
        <div className='flex items-center justify-between gap-3'>
          <h1 className='text-3xl font-bold tracking-tight text-[#1B2838] dark:text-foreground'>
            {t('title')}
          </h1>
          <div className='flex gap-2'>
            <Link href='/facturation/clients'>
              <Button variant='outline' className='h-11'>
                {t('list.clients')}
              </Button>
            </Link>
            <Link href='/facturation/new'>
              <Button className='h-11 bg-[#FF6B35] text-white shadow-md shadow-[#FF6B35]/20 hover:bg-[#FF6B35]/90'>
                <Plus className='h-4 w-4' aria-hidden />
                {t('list.newInvoice')}
              </Button>
            </Link>
          </div>
        </div>
        <p className='text-sm text-foreground/60'>{t('subtitle')}</p>
      </header>

      {/* The shell renders instantly; only this hole waits on the session
          and the database. Keeps the page useful before data arrives. */}
      <Suspense fallback={<InvoiceListSkeleton />}>
        <InvoiceList />
      </Suspense>
    </main>
  )
}

function InvoiceListSkeleton() {
  return (
    <div className='animate-pulse space-y-4'>
      <div className='h-[72px] rounded-xl bg-foreground/5' />
      <div className='space-y-3'>
        {[0, 1, 2].map((i) => (
          <div key={i} className='h-[76px] rounded-xl bg-foreground/5' />
        ))}
      </div>
    </div>
  )
}