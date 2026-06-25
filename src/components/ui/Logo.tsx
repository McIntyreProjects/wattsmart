import Link from 'next/link'
import Image from 'next/image'

export function Logo({ href = '/', className = '' }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={`inline-flex items-center ${className}`} aria-label="WattSmart home">
      <Image
        src="/logo-daylight.png"
        alt="WattSmart"
        width={140}
        height={36}
        priority
        className="h-8 w-auto"
      />
    </Link>
  )
}
