import { Suspense } from 'react'
import { TourneeDetail } from '@/features/tournee/components/tourneeDetail/TourneeDetail'

type Props = {
  params: Promise<{ locale: string; id: string }>
}

// plus `async`, plus d'`await` ici : cette coquille est 100 % statique
export default function TourneeDetailPage({ params }: Props) {
  return (
    <main className='mx-auto w-full max-w-3xl space-y-6 p-4'>
      <Suspense fallback={<DetailSkeleton />}>
        <TourneeDetailLoader params={params} />
      </Suspense>
    </main>
  )
}

// l'await se fait ici, à l'intérieur de la frontière Suspense
async function TourneeDetailLoader({ params }: Props) {
  const { id } = await params
  return <TourneeDetail tourneeId={id} />
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
