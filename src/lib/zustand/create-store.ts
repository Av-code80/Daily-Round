import { create, StateCreator } from 'zustand'
import { devtools, persist, createJSONStorage } from 'zustand/middleware'

const IS_DEV = process.env.NODE_ENV === 'development'

/** Ephemeral client UI state. */
export function createStore<T>(
  name: string,
  initializer: StateCreator<T, [['zustand/devtools', never]], []>,
) {
  return create<T>()(devtools(initializer, { name, enabled: IS_DEV }))
}

/** Persisted across refresh (localStorage). Use sparingly. */
export function createPersistedStore<T>(
  name: string,
  initializer: StateCreator<
    T,
    [['zustand/devtools', never], ['zustand/persist', unknown]],
    []
  >,
) {
  return create<T>()(
    devtools(
      persist(initializer, {
        name,
        storage: createJSONStorage(() => localStorage),
      }),
      { name, enabled: IS_DEV },
    ),
  )
}
