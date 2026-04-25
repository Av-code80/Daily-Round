import { getTranslations, setRequestLocale } from 'next-intl/server'
import { DoorCodeForm } from '@/features/door-codes/components/DoorCodeForm'
import BackButton from '@/components/BackButton'

type Props = { params: Promise<{ locale: string }> }

export default async function NewDoorCodePage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('DoorCodes')

  return (
    <div className='mx-auto p-6 space-y-6'>
   <div className='flex items-center  w-screen'>
      <BackButton fallbackHref='/'/>
       <h1 className='text-3xl ml-70 font-bold tracking-tight text-[#1B2838] dark:text-foreground'>
        {t('newTitle')}
      </h1>
   </div>
      <DoorCodeForm />
    </div>
  )
}
