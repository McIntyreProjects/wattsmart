import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendNewInstallerApplication } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      companyName, companiesHouseNumber, contactName, contactEmail, contactPhone,
      yearsTrading, products, coveragePostcodes, certifications,
      googleBusinessName, trustpilotUrl, password,
    } = body

    if (!companyName || !contactName || !contactEmail || !contactPhone || !products?.length || !certifications || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: contactEmail,
      password,
      email_confirm: true,
      user_metadata: { role: 'installer', company_name: companyName },
    })

    if (authError) {
      if (authError.message.includes('already been registered')) {
        return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 400 })
      }
      throw authError
    }

    // Create installer record
    const { data: installer, error: instError } = await supabase
      .from('installers')
      .insert({
        user_id: authData.user.id,
        company_name: companyName,
        companies_house_number: companiesHouseNumber || null,
        contact_name: contactName,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        years_trading: parseInt(yearsTrading) || null,
        products,
        coverage_postcodes: (coveragePostcodes as string)
          .split(',')
          .map((p: string) => p.trim().toUpperCase())
          .filter(Boolean),
        status: 'pending',
        trustpilot_url: trustpilotUrl || null,
      })
      .select()
      .single()

    if (instError) throw instError

    // Store certifications
    const certRows = Object.entries(certifications as Record<string, { number: string; status: string }>)
      .filter(([, v]) => v.number)
      .map(([type, v]) => ({
        installer_id: installer.id,
        type,
        certification_number: v.number,
        status: v.status || 'pending',
      }))

    if (certRows.length > 0) {
      await supabase.from('certifications').insert(certRows)
    }

    // Notify admin
    const adminEmail = process.env.ADMIN_EMAIL
    if (adminEmail) {
      await sendNewInstallerApplication(
        adminEmail,
        companyName,
        `${process.env.NEXT_PUBLIC_SITE_URL || 'https://wattsmart.co.uk'}/admin/installers/${installer.id}`
      ).catch(console.error)
    }

    return NextResponse.json({ id: installer.id })
  } catch (err) {
    console.error('Installer register error:', err)
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 })
  }
}
