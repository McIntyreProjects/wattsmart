import { InstallerRegisterForm } from '@/components/forms/InstallerRegisterForm'
import { Logo } from '@/components/ui/Logo'

export default function InstallerRegisterPage() {
  return (
    <div className="min-h-screen" style={{ background: '#E7EAE7' }}>
      <nav className="max-w-content mx-auto px-5 py-5">
        <Logo />
      </nav>
      <main className="max-w-content mx-auto px-5 pb-24">
        <InstallerRegisterForm />
      </main>
    </div>
  )
}
