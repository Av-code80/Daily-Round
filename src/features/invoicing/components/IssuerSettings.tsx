import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { AlertTriangle } from 'lucide-react'
import { getIssuer } from '../data'
import type { IssuerFormValues } from '../schemas'
import { IssuerForm } from './IssuerForm'

export async function IssuerSettings() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/login')

  const t = await getTranslations('Invoicing.issuer')
  const issuer = await getIssuer(session.user.id)

  // The form works in empty strings; the database works in NULLs.
  const defaultValues: IssuerFormValues | undefined = issuer
    ? {
        company_name: issuer.company_name,
        siret: issuer.siret,
        vat_number: issuer.vat_number ?? '',
        address_line: issuer.address_line,
        postal_code: issuer.postal_code,
        city: issuer.city,
        email: issuer.email ?? '',
        phone: issuer.phone ?? '',
      }
    : undefined

  return (
    <div className='space-y-4'>
      {!issuer && (
        <div
          role='status'
          className='flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-700 dark:text-amber-500'
        >
          <AlertTriangle className='mt-0.5 h-4 w-4 shrink-0' aria-hidden />
          {t('missingWarning')}
        </div>
      )}

      <IssuerForm defaultValues={defaultValues} />
    </div>
  )
}
