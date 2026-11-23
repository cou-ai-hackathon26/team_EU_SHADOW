export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-2xl bg-[#E3E8DC]/70 ${className}`}
    />
  )
}
