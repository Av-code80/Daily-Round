import { Suspense } from 'react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Plus } from 'lucide-react'

import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { SearchBar } from './components/SearchBar'
import { ListSkeleton } from './components/ListSkeleton'
import { SearchResult } from './components/SearchResult'

type PageProps = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ q?: string; postal?: string }>
}

export default async function DoorCodesPage({
  params,
  searchParams,
}: PageProps) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('DoorCodes')

  return (
    <main className='mx-auto w-full max-w-2xl p-4 space-y-4'>
      <header className='space-y-1 pt-2'>
        <div className='flex items-center justify-between gap-3'>
          <h1 className='text-3xl font-bold tracking-tight text-[#1B2838] dark:text-foreground'>
            {t('browseTitle')}
          </h1>
          <Link href='/door-codes/new'>
            <Button className='h-10 bg-[#FF6B35] text-white shadow-md shadow-[#FF6B35]/20 hover:bg-[#FF6B35]/90'>
              <Plus className='h-4 w-4' aria-hidden />
              {t('contribute')}
            </Button>
          </Link>
        </div>
        <p className='text-sm text-[#1B2838]/60 dark:text-foreground/60'>
          {t('browseSubtitle')}
        </p>
      </header>
      <SearchBar />
      <Suspense fallback={<ListSkeleton />}>
        <SearchResult searchParams={searchParams} />
      </Suspense>
    </main>
  )
}
