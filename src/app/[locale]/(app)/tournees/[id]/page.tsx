import { Suspense } from 'react'
import { setRequestLocale } from 'next-intl/server'
import { TourneeDetail } from '@/features/tournee/components/TourneeDetail'

type Props = {
  params: Promise<{ locale: string; id: string }>
  children: React.ReactNode
}

export default async function TourneeDetailPage({ params }: Props) {
  const { locale, id } = await params
  setRequestLocale(locale)

  return (
    <main className='mx-auto w-full max-w-2xl space-y-6 p-4'>
      <Suspense fallback={<DetailSkeleton />}>
        <TourneeDetail tourneeId={id} />
      </Suspense>
    </main>
  )
}

function DetailSkeleton() {
  return (
    <div className='animate-pulse space-y-6 pt-2'>
      <div className='h-20 rounded-xl bg-foreground/5' />
      <div className='h-24 rounded-xl bg-foreground/5' />
      <div className='h-32 rounded-xl bg-foreground/5' />
    </div>
  )
}
