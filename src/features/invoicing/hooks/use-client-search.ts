'use client'

import { useQuery } from '@tanstack/react-query'
import { listRecentClients, searchClients } from '../services/clients'
import { useDebouncedValue } from '@/lib/hooks/use-debounce-value'


const MIN_CHARS = 2
const DEBOUNCE_MS = 300

/**
 * Two data sources behind one list:
 *   - under 2 characters: the recently billed clients (no request)
 *   - from 2 characters: a debounced server search, capped at 8 rows
 *
 * Debouncing protects the NETWORK. Never debounce a local computation —
 * it only adds perceived latency.
 */
export function useClientSearch(term: string) {
  const debounced = useDebouncedValue(term.trim(), DEBOUNCE_MS)
  const isSearching = debounced.length >= MIN_CHARS

  const recent = useQuery({
    queryKey: ['clients', 'recent'],
    queryFn: listRecentClients,
    staleTime: 5 * 60_000, // rarely changes; no need to refetch on every open
  })

  const results = useQuery({
    queryKey: ['clients', 'search', debounced],
    queryFn: () => searchClients(debounced),
    enabled: isSearching,
    // Keeps the previous list visible while the next one loads, instead
    // of flashing an empty dropdown between keystrokes.
    placeholderData: (previous) => previous,
  })

  return {
    options: isSearching ? (results.data ?? []) : (recent.data ?? []),
    isSearching,
    // Only a genuine first load counts as "loading" — a background
    // refetch must not blank the list.
    isLoading: isSearching ? results.isPending : recent.isPending,
    isEmpty: isSearching && results.isSuccess && results.data.length === 0,
  }
}