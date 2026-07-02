import Link from 'next/link'

const ITEMS = [
  { key: 'overview',   label: 'Overview',   href: '/admin/dashboard' },
  { key: 'customers',  label: 'Customers',  href: '/admin/customers' },
  { key: 'installers', label: 'Installers', href: '/admin/installers' },
  { key: 'pipeline',   label: 'Pipeline',   href: '/admin/pipeline' },
  { key: 'fees',       label: 'Fees',       href: '/admin/fees' },
] as const

export type AdminNavItem = (typeof ITEMS)[number]['key']

export default function AdminNav({ active }: { active?: AdminNavItem }) {
  return (
    <nav className="flex items-center gap-8 px-6 py-4 bg-white border-b border-ws-border">
      <span className="font-display font-extrabold text-lg tracking-tight">WattSmart</span>
      <div className="flex gap-6 text-sm text-ws-muted">
        {ITEMS.map((item) =>
          item.key === active ? (
            <span key={item.key} className="text-ws-dark-green font-bold border-b-2 border-ws-green pb-1">
              {item.label}
            </span>
          ) : (
            <Link key={item.key} href={item.href} className="hover:text-ws-ink">
              {item.label}
            </Link>
          )
        )}
      </div>
    </nav>
  )
}
