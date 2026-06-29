import { Suspense } from 'react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { TourneeList } from '@/features/tournee/components/TourneeList'
import { Plus } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
type Props = { params: Promise<{ locale: string }> }

export default async function HomePage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('Tournee')

  return (
    <main className='mx-auto w-full max-w-3xl space-y-6 p-4'>
      <header className='space-y-1 pt-2'>
        <div className='flex items-center justify-between gap-3'>
          <h1 className='text-3xl font-bold tracking-tight text-[#1B2838] dark:text-foreground'>
            {t('title')}
          </h1>
          <Link href='/tournees/new'>
            <Button className='h-10 bg-[#FF6B35] text-white shadow-md shadow-[#FF6B35]/20 hover:bg-[#FF6B35]/90'>
              <Plus className='h-4 w-4' aria-hidden />
              {t('new.cta')}
            </Button>
          </Link>
        </div>
        <p className='text-sm text-foreground/60'>{t('subtitle')}</p>
      </header>
      <Suspense fallback={<TourneeListSkeleton />}>
        <TourneeList />
      </Suspense>
    </main>
  )
}

function TourneeListSkeleton() {
  return (
    <div className='animate-pulse space-y-3'>
      {[0, 1, 2].map((i) => (
        <div key={i} className='h-20 rounded-xl bg-foreground/5' />
      ))}
    </div>
  )
}
