import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { AlertTriangle, Users } from 'lucide-react'
import { listAllClients } from '../data'
import { sirenFromSiret } from '../utils'

export async function ClientList() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/login')

  const t = await getTranslations('Invoicing.clients')
  const clients = await listAllClients(session.user.id)

  if (clients.length === 0) {
    return (
      <div className='rounded-xl border border-dashed border-foreground/20 px-6 py-12 text-center'>
        <div className='mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[#FF6B35]/10'>
          <Users className='h-7 w-7 text-[#FF6B35]' aria-hidden />
        </div>
        <p className='text-xl font-semibold'>{t('empty')}</p>
        <p className='mx-auto mt-2 max-w-sm text-sm text-foreground/60'>
          {t('emptyHint')}
        </p>
      </div>
    )
  }

  const incomplete = clients.filter((client) => !client.siret).length

  return (
    <div className='space-y-3'>
      {/* Makes the warning shown at finalisation actionable: it says a
          client has no SIREN, this says which ones. */}
      {incomplete > 0 && (
        <p
          role='status'
          className='flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-700 dark:text-amber-500'
        >
          <AlertTriangle className='mt-0.5 h-4 w-4 shrink-0' aria-hidden />
          {t('incompleteCount', { count: incomplete })}
        </p>
      )}

      <ul className='space-y-3'>
        {clients.map((client) => {
          const siren = sirenFromSiret(client.siret)

          return (
            <li
              key={client.id}
              className='rounded-xl border border-foreground/10 bg-background p-4'
            >
              <div className='flex items-start justify-between gap-3'>
                <div className='min-w-0'>
                  <p className='truncate font-semibold text-[#1B2838] dark:text-foreground'>
                    {client.name}
                  </p>
                  <p className='mt-1 text-sm text-foreground/60'>
                    {client.city ?? t('cityUnknown')}
                    <span className='mx-1.5'>·</span>
                    {t('paymentTerms', { days: client.payment_terms_days })}
                  </p>
                </div>

                {siren ? (
                  <p className='shrink-0 font-mono text-xs text-foreground/60'>
                    {t('siren')} {siren}
                  </p>
                ) : (
                  <p className='shrink-0 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs text-amber-700 dark:text-amber-500'>
                    {t('siretMissing')}
                  </p>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
