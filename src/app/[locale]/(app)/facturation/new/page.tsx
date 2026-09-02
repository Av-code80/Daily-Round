import { getTranslations, setRequestLocale } from 'next-intl/server'
import { InvoiceForm } from '@/features/invoicing/components/InvoiceForm'

type Props = { params: Promise<{ locale: string }> }

export default async function NewInvoicePage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('Invoicing')

  return (
    <main className='mx-auto w-full max-w-2xl space-y-6 mt-6'>
      <h1 className='text-3xl font-bold tracking-tight text-[#1B2838] dark:text-foreground'>
        {t('list.newInvoice')}
      </h1>
      <InvoiceForm />
    </main>
  )
}