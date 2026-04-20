'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,          
        gcTime: 5 * 60_000,         
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,   
        retry: 1,
      },
      mutations: {
        retry: 0, 
      },
    },
  })

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(createQueryClient)
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
