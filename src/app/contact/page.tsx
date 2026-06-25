import Link from 'next/link'

export const metadata = { title: 'Contact us — WattSmart' }

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-ws-body font-body text-ws-ink">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-ws-border bg-white">
        <Link href="/" className="font-display font-extrabold text-xl text-ws-ink tracking-tight">
          WattSmart
        </Link>
        <div className="flex gap-6 text-sm text-ws-muted">
          <Link href="/how-it-works" className="hover:text-ws-ink transition-colors">How it works</Link>
          <Link href="/contact" className="text-ws-dark-green font-bold">Contact</Link>
          <Link href="/help" className="hover:text-ws-ink transition-colors">Help centre</Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="font-display font-extrabold text-4xl tracking-tight mb-2">Get in touch</h1>
        <p className="text-ws-muted text-base leading-relaxed max-w-xl mb-10">
          WattSmart mostly runs itself — but we're here when you need a human. Most answers are in
          the Help Centre; otherwise drop us a message and we'll reply within one working day.
        </p>

        <div className="flex gap-8 flex-wrap">
          {/* Form */}
          <div className="flex-[1.3] min-w-[300px]">
            <form className="flex flex-col gap-4 max-w-md" action="/api/contact" method="POST">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-ws-muted mb-1.5">Your name</label>
                  <input
                    name="name"
                    type="text"
                    placeholder="Sarah Mills"
                    className="w-full border border-ws-border rounded-btn px-3 py-3 text-sm text-ws-ink placeholder:text-ws-subtle focus:outline-none focus:border-ws-green"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-ws-muted mb-1.5">Email</label>
                  <input
                    name="email"
                    type="email"
                    placeholder="sarah@example.com"
                    className="w-full border border-ws-border rounded-btn px-3 py-3 text-sm text-ws-ink placeholder:text-ws-subtle focus:outline-none focus:border-ws-green"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ws-muted mb-1.5">What's it about?</label>
                <select
                  name="category"
                  className="w-full border border-ws-border rounded-btn px-3 py-3 text-sm text-ws-ink bg-white focus:outline-none focus:border-ws-green appearance-none"
                >
                  <option value="">Select a category</option>
                  <option>My enquiry or quotes</option>
                  <option>My deposit or payment</option>
                  <option>My account</option>
                  <option>Installer support</option>
                  <option>Something else</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ws-muted mb-1.5">Message</label>
                <textarea
                  name="message"
                  rows={5}
                  placeholder="How can we help?"
                  className="w-full border border-ws-border rounded-btn px-3 py-3 text-sm text-ws-ink placeholder:text-ws-subtle focus:outline-none focus:border-ws-green resize-none"
                />
              </div>

              <button
                type="submit"
                className="bg-ws-green text-white rounded-btn py-3.5 font-bold text-sm hover:bg-ws-dark-green transition-colors"
              >
                Send message
              </button>
            </form>
          </div>

          {/* Sidebar */}
          <div className="flex-1 min-w-[220px]">
            <div className="bg-[#F2F6F3] rounded-card p-5">
              <p className="eyebrow mb-4">Other ways to reach us</p>
              <div className="flex flex-col gap-4 text-sm">
                <div>
                  <p className="font-bold text-ws-ink mb-0.5">Email</p>
                  <a href="mailto:hello@wattsmart.co.uk" className="text-ws-dark-green">
                    hello@wattsmart.co.uk
                  </a>
                </div>
                <div>
                  <p className="font-bold text-ws-ink mb-0.5">Reply time</p>
                  <p className="text-ws-muted">Within 1 working day</p>
                </div>
                <div>
                  <p className="font-bold text-ws-ink mb-0.5">Help centre</p>
                  <p className="text-ws-muted">Answers to common questions →</p>
                </div>
                <div>
                  <p className="font-bold text-ws-ink mb-0.5">Installers</p>
                  <p className="text-ws-muted">Use the installer portal for vendor support.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
