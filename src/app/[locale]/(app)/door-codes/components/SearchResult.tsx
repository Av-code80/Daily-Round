import { listDoorCodes } from '@/features/door-codes/data'
import { DoorCodeCard } from './DoorCodeCard'
import { getTranslations } from 'next-intl/server'

type SearchParamsProps = {
  searchParams: Promise<{ q?: string; postal?: string }>
}

export async function SearchResult({ searchParams }: SearchParamsProps) {
  const { q: search, postal } = await searchParams

  const codes = await listDoorCodes({ search, postal })

  if (!codes.length) {
    return <EmptyState />
  }

  return (
    <ul className='flex flex-col gap-2.5'>
      {codes.map((c) => (
        <li key={c.id}>
          <DoorCodeCard code={c} />
        </li>
      ))}
    </ul>
  )
}

async function EmptyState() {
  const t = await getTranslations('DoorCodes')

  return (
    <p className='rounded-lg border border-dashed border-[#1B2838]/20 p-8 text-center text-sm text-muted-foreground'>
      {t('empty')}
    </p>
  )
}
