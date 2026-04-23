import { createPersistedStore } from '@/lib/zustand/create-store'
import { DoorCodeFormValues } from '../schemas'

type DraftState = {
  draft: Partial<DoorCodeFormValues>
  setDraft: (values: Partial<DoorCodeFormValues>) => void
  clearDraft: () => void
}

export const useDoorCodeDraftStore = createPersistedStore<DraftState>(
  'door-code-draft',
  (set) => ({
    draft: {},
    setDraft: (values) => set({ draft: values }, false, 'draft/set'),
    clearDraft: () => set({ draft: {} }, false, 'draft/clear'),
  }),
)
