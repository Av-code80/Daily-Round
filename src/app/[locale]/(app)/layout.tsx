import { SideNav } from '@/components/SideNav'
import { Suspense } from 'react'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className='min-h-screen'>
      <SideNav />
      <main className='ml-16 md:ml-56'>
        <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>{' '}
      </main>
    </div>
  )
}
