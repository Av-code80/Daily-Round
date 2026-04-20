export default function ProfileSkeleton({ label }: { label: string }) {
  return (
    <section className='space-y-1 animate-pulse'>
      <p className='text-sm text-foreground/60'>{label}</p>
      <div className='h-5 w-48 rounded bg-foreground/10' />
    </section>
  )
}
