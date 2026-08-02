import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { FileText, Plus } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { listMyInvoices, getInvoiceSummary } from '../data'
import { InvoiceSummaryBar } from './InvoiceSummaryBar'
import { InvoiceRow } from './InvoiceRow'

export async function InvoiceList() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/login')
  const userId = session.user.id

  const t = await getTranslations('Invoicing.list')

  // Independent queries -> run them in parallel, not in a waterfall.
  const [invoices, summary] = await Promise.all([
    listMyInvoices(userId),
    getInvoiceSummary(userId),
  ])

  if (invoices.length === 0) {
    return (
      <div className='rounded-xl border border-dashed border-foreground/20 px-6 py-12 text-center'>
        <div className='mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[#FF6B35]/10'>
          <FileText className='h-7 w-7 text-[#FF6B35]' aria-hidden />
        </div>
        <p className='text-xl font-semibold'>{t('empty')}</p>
        <p className='mx-auto mt-2 max-w-sm text-sm text-foreground/60'>
          {t('emptyHint')}
        </p>
        <Link href='/facturation/new' className='mt-6 inline-block'>
          <Button className='h-14 bg-[#FF6B35] px-6 text-white hover:bg-[#FF6B35]/90'>
            <Plus className='mr-2 h-4 w-4' aria-hidden />
            {t('emptyCta')}
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className='space-y-5'>
      <InvoiceSummaryBar summary={summary} />
      <ul className='space-y-3'>
        {invoices.map((invoice) => (
          <li key={invoice.id}>
            <InvoiceRow invoice={invoice} />
          </li>
        ))}
      </ul>
    </div>
  )
}