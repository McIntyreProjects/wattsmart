import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendNewInstallerApplication } from '@/lib/email'
import { rateLimit } from '@/lib/rateLimit'

export async function POST(req: NextRequest) {
  const ip = (req.headers.get('x-forwarded-for') ?? '127.0.0.1').split(',')[0].trim()
  if (!rateLimit(ip, 3, 60_000)) {
    return NextResponse.json({ error: 'Too many requests. Please wait a moment and try again.' }, { status: 429, headers: { 'Retry-After': '60' } })
  }

  try {
    const body = await req.json()
    const {
      companyName, tradingName, companiesHouseNumber, contactName, contactEmail, contactPhone,
      yearsTrading, products, coveragePostcodes, certifications,
      googleBusinessName, trustpilotUrl, password, basePostcode,
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

    // Resolve base postcode to lat/lng using postcodes.io (free, UK-specific, no key needed)
    let base_lat: number | null = null
    let base_lng: number | null = null
    if (basePostcode) {
      try {
        const geo = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(basePostcode)}`)
        const geoJson = await geo.json()
        if (geoJson.status === 200) {
          base_lat = geoJson.result.latitude
          base_lng = geoJson.result.longitude
        }
      } catch {
        // Non-fatal — matching will fall back to postcode district only
      }
    }

    // Create installer record — if this or anything after fails, roll back the auth user
    const userId = authData.user.id
    const rollback = async () => {
      await supabase.auth.admin.deleteUser(userId).catch(console.error)
    }

    const { data: installer, error: instError } = await supabase
      .from('installers')
      .insert({
        user_id: userId,
        company_name: companyName,
        trading_name: tradingName || null,
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
        base_lat,
        base_lng,
        base_postcode: basePostcode ? basePostcode.trim().toUpperCase() : null,
        status: 'pending',
        trustpilot_url: trustpilotUrl || null,
      })
      .select()
      .single()

    if (instError) {
      await rollback()
      throw instError
    }

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
      const { error: certError } = await supabase.from('certifications').insert(certRows)
      if (certError) {
        await rollback()
        throw certError
      }
    }

    // Notify admin (non-fatal — don't roll back if email fails)
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
