import { SideNav } from '@/components/SideNav'
import { QueryProvider } from '@/components/providers/query-provider'
import { Suspense } from 'react'
import { Toaster } from 'sonner'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <div className='min-h-screen'>
        <Suspense fallback={null}>
          <SideNav />
        </Suspense>
        <main className='ml-16 md:ml-56'>
          <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
          <Toaster richColors position='top-center' />
        </main>
      </div>
    </QueryProvider>
  )
}
