import { getTranslations, setRequestLocale } from 'next-intl/server'
import { DoorCodeForm } from '@/features/door-codes/components/DoorCodeForm'

type Props = { params: Promise<{ locale: string }> }

export default async function NewDoorCodePage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('DoorCodes')

  return (
    <div className='max-w-lg mx-auto p-6 space-y-6'>
      <h1 className='text-3xl font-bold tracking-tight text-[#1B2838] dark:text-foreground'>
        {t('newTitle')}
      </h1>
      <DoorCodeForm />
    </div>
  )
}
