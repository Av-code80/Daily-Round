import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { listMyTournees } from '../data'
import { TourneeCard } from './TourneeCard'
import { Plus } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'

export async function TourneeList() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/login')

  const t = await getTranslations('Tournee')
  const tournees = await listMyTournees(session.user.id)

  if (tournees.length === 0) {
    return (
      <div className='rounded-xl border border-dashed border-foreground/15 py-12 text-center'>
        <p className='text-2xl font-semibold'>{t('empty.title')}</p>
        <p className='mt-2 text-sm text-foreground/60'>{t('empty.message')}</p>
        <Link href='/tournees/new' className='mt-6 inline-block'>
          <Button className='h-12 bg-[#FF6B35] px-6 text-white hover:bg-[#FF6B35]/90'>
            <Plus className='mr-2 h-4 w-4' aria-hidden />
            {t('empty.cta')}
          </Button>
        </Link>
      </div>
    )
  }

  const todayIso = new Date().toISOString().slice(0, 10)

  const today = tournees.filter((x) => x.date === todayIso)
  const earlier = tournees.filter((x) => x.date !== todayIso)

  return (
    <div className='space-y-8'>
      {today.length > 0 && (
        <section>
          <h2 className='mb-3 text-xs font-semibold uppercase tracking-wider text-foreground/60'>
            {t('today')}
          </h2>
          <ul className='space-y-3'>
            {today.map((item) => (
              <li key={item.id}>
                <TourneeCard tournee={item} highlight />
              </li>
            ))}
          </ul>
        </section>
      )}

      {earlier.length > 0 && (
        <section>
          <h2 className='mb-3 text-xs font-semibold uppercase tracking-wider text-foreground/60'>
            {t('earlier')}
          </h2>
          <ul className='space-y-3'>
            {earlier.map((item) => (
              <li key={item.id}>
                <TourneeCard tournee={item} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
