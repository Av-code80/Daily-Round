'use client'

import { useMutation } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { useRouter } from '@/i18n/navigation'
import { saveIssuer } from '../services/issuer'

export function useSaveIssuer() {
  const t = useTranslations('Invoicing.issuer')
  const router = useRouter()

  return useMutation({
    mutationFn: saveIssuer,
    onSuccess: () => {
      toast.success(t('saved'))
      // The identity is read by Server Components through a cache tag the
      // route already expired; refresh so the page shows the saved values. 
      //invalidateQueries rafraîchit ce que TanStack Query détient côté client, 
      // router.refresh() rafraîchit ce que les Server Components ont rendu côté serveur.
      router.refresh()
    },
    onError: () => toast.error(t('saveError')),
  })
}
