import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendNewInstallerApplication } from '@/lib/email'
import { rateLimit } from '@/lib/rateLimit'

// Mirrors the client-side rule in InstallerRegisterForm: only certifications
// that are MANDATORY for a selected product are required at registration.
// Solar / battery / heat pumps → MCS. EV chargers → OZEV authorisation.
// Consumer codes (RECC/HIES) and trade bodies are optional.
const MANDATORY_CERTS: Record<string, { id: string; label: string }[]> = {
  solar:    [{ id: 'mcs', label: 'MCS' }],
  battery:  [{ id: 'mcs', label: 'MCS' }],
  heatpump: [{ id: 'mcs', label: 'MCS' }],
  ev:       [{ id: 'ozev', label: 'OZEV' }],
}

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

    // ── CCR disclosure fields ─────────────────────────────────────────
    // UK Consumer Contracts Regulations: the installer's geographical
    // address and terms must be shown to customers before payment, so both
    // are mandatory at registration.
    const businessAddress = typeof body.businessAddress === 'string' ? body.businessAddress.trim() : ''
    if (!businessAddress) {
      return NextResponse.json({ error: 'Business address is required' }, { status: 400 })
    }
    if (businessAddress.length > 500) {
      return NextResponse.json({ error: 'Business address must be 500 characters or fewer' }, { status: 400 })
    }

    const termsUrl = typeof body.termsUrl === 'string' ? body.termsUrl.trim() : ''
    const termsPdfBase64 = typeof body.termsPdfBase64 === 'string' ? body.termsPdfBase64 : ''

    // Exactly one of the two terms sources must be provided
    if (!termsUrl && !termsPdfBase64) {
      return NextResponse.json({ error: 'Terms & conditions are required — upload a PDF or link to your terms page' }, { status: 400 })
    }
    if (termsUrl && termsPdfBase64) {
      return NextResponse.json({ error: 'Provide either a terms PDF or a terms URL, not both' }, { status: 400 })
    }

    if (termsUrl) {
      if (!/^https:\/\/.+/i.test(termsUrl)) {
        return NextResponse.json({ error: 'Terms URL must start with https://' }, { status: 400 })
      }
      if (termsUrl.length > 500) {
        return NextResponse.json({ error: 'Terms URL must be 500 characters or fewer' }, { status: 400 })
      }
    }

    let termsPdfBuffer: Buffer | null = null
    if (termsPdfBase64) {
      // The client sends a data URL (data:application/pdf;base64,...) —
      // strip the prefix, decode, and verify it really is a PDF.
      const commaIdx = termsPdfBase64.indexOf(',')
      const rawBase64 = termsPdfBase64.startsWith('data:') && commaIdx !== -1
        ? termsPdfBase64.slice(commaIdx + 1)
        : termsPdfBase64
      try {
        termsPdfBuffer = Buffer.from(rawBase64, 'base64')
      } catch {
        termsPdfBuffer = null
      }
      if (!termsPdfBuffer || termsPdfBuffer.length === 0) {
        return NextResponse.json({ error: 'Could not read the terms PDF — please try uploading it again' }, { status: 400 })
      }
      if (termsPdfBuffer.length > 5 * 1024 * 1024) {
        return NextResponse.json({ error: 'Terms PDF must be 5MB or smaller' }, { status: 400 })
      }
      // %PDF magic bytes
      if (termsPdfBuffer.subarray(0, 4).toString('latin1') !== '%PDF') {
        return NextResponse.json({ error: 'The uploaded terms file is not a valid PDF' }, { status: 400 })
      }
    }

    // Require only the mandatory certification(s) for the selected products
    const missingCerts = new Set<string>()
    for (const product of products as string[]) {
      for (const cert of MANDATORY_CERTS[product] || []) {
        const number = certifications?.[cert.id]?.number
        if (typeof number !== 'string' || !number.trim()) missingCerts.add(cert.label)
      }
    }
    if (missingCerts.size > 0) {
      return NextResponse.json(
        { error: `Missing required certification number(s): ${[...missingCerts].join(', ')}` },
        { status: 400 }
      )
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
        business_address: businessAddress,
        terms_url: termsUrl || null,
      })
      .select()
      .single()

    if (instError) {
      await rollback()
      throw instError
    }

    // Upload terms PDF to the private installer-terms bucket. A missing
    // terms reference blocks customer payments (CCR), so a failure here
    // rolls back the whole registration rather than leaving a half-set-up
    // installer.
    if (termsPdfBuffer) {
      const termsPath = `${installer.id}.pdf`
      const { error: uploadError } = await supabase.storage
        .from('installer-terms')
        .upload(termsPath, termsPdfBuffer, { contentType: 'application/pdf', upsert: true })

      if (uploadError) {
        await supabase.from('installers').delete().eq('id', installer.id)
        await rollback()
        throw uploadError
      }

      const { error: pathError } = await supabase
        .from('installers')
        .update({ terms_storage_path: termsPath })
        .eq('id', installer.id)

      if (pathError) {
        await supabase.storage.from('installer-terms').remove([termsPath]).catch(console.error)
        await supabase.from('installers').delete().eq('id', installer.id)
        await rollback()
        throw pathError
      }
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
