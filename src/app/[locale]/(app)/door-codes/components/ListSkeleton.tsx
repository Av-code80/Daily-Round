export function ListSkeleton() {
  return (
    <ul className='space-y-3' aria-hidden>
      {[...Array(3)].map((_, i) => (
        <li
          key={i}
          className='h-32 animate-pulse rounded-lg bg-[#1B2838]/5'
        />
      ))}
    </ul>
  )
}