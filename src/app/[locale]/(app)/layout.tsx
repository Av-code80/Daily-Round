import { SideNav } from '@/components/SideNav'
import { QueryProvider } from '@/components/providers/query-provider'
import { Suspense } from 'react'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <div className='min-h-screen'>
        <SideNav />
        <main className='ml-16 md:ml-56'>
          <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
        </main>
      </div>
    </QueryProvider>
  )
}
