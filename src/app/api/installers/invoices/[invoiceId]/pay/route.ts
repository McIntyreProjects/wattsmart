import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import * as Sentry from '@sentry/nextjs'

// Installer pays a WattSmart fee invoice by card via Stripe Checkout.
// This is a platform charge (money goes to WattSmart), not a Connect transfer.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const { invoiceId } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Resolve installer ID — team members via installer_users, then installers.user_id
    let installerId: string | null = null

    const { data: membership } = await supabase
      .from('installer_users')
      .select('installer_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle()

    if (membership) {
      installerId = membership.installer_id
    } else {
      const { data: installer } = await supabase
        .from('installers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()
      if (!installer) return NextResponse.json({ error: 'Installer not found' }, { status: 403 })
      installerId = installer.id
    }

    const admin = await createAdminClient()
    const { data: invoice } = await admin
      .from('fee_invoices')
      .select('id, installer_id, amount, status, invoice_number')
      .eq('id', invoiceId)
      .maybeSingle()

    if (!invoice || invoice.installer_id !== installerId) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }
    if (invoice.status === 'paid') {
      return NextResponse.json({ error: 'This invoice has already been paid' }, { status: 400 })
    }
    if (!invoice.amount || invoice.amount <= 0) {
      return NextResponse.json({ error: 'Nothing to pay on this invoice' }, { status: 400 })
    }

    const ref = invoice.invoice_number || `FI-${invoice.id.slice(0, 6).toUpperCase()}`
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://wattsmart.co.uk'
    const invoiceUrl = `${siteUrl}/installer/invoices/${invoice.id}`

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' })
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            unit_amount: invoice.amount,
            product_data: { name: `WattSmart fee — invoice ${ref}` },
          },
          quantity: 1,
        },
      ],
      metadata: { fee_invoice_id: invoice.id },
      success_url: `${invoiceUrl}?paid=1`,
      cancel_url: invoiceUrl,
    })

    if (!session.url) {
      throw new Error(`Checkout session ${session.id} has no URL`)
    }

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Fee invoice pay error:', err)
    Sentry.captureException(err)
    return NextResponse.json({ error: 'Payment setup failed' }, { status: 500 })
  }
}
