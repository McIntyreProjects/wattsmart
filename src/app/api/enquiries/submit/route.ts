import { NextRequest, NextResponse, after } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { generateRoofDesign } from '@/lib/solar'
import { sendEnquiryConfirmation, sendAdminAlert } from '@/lib/email'
import { isLaunchPostcode, getPostcodeArea } from '@/lib/utils'
import { rateLimit } from '@/lib/rateLimit'
import * as Sentry from '@sentry/nextjs'

export async function POST(req: NextRequest) {
  const ip = (req.headers.get('x-forwarded-for') ?? '127.0.0.1').split(',')[0].trim()
  if (!rateLimit(ip, 5, 60_000)) {
    return NextResponse.json({ error: 'Too many requests. Please wait a moment and try again.' }, { status: 429, headers: { 'Retry-After': '60' } })
  }

  try {
    const body = await req.json()
    const {
      products, postcode, addressLine1, addressLine2, city,
      propertyType, propertyAge, ownership,
      roofType, roofOrientation, shading,
      monthlyKwh, monthlyBill, electricitySupplier,
      goal, notes, firstName, lastName, email, phone, preferredContact,
      recommendation,
    } = body

    if (!products?.length || !postcode || !propertyType || !propertyAge || !ownership || !goal || !firstName || !lastName || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (typeof addressLine1 !== 'string' || !addressLine1.trim() || addressLine1.trim().length > 200) {
      return NextResponse.json({ error: 'Please provide the first line of your address' }, { status: 400 })
    }
    if ((addressLine2 && (typeof addressLine2 !== 'string' || addressLine2.length > 200)) ||
        (city && (typeof city !== 'string' || city.length > 100))) {
      return NextResponse.json({ error: 'Address details are too long' }, { status: 400 })
    }

    if (!isLaunchPostcode(postcode)) {
      return NextResponse.json(
        { error: 'Sorry, we currently only serve North East England and Yorkshire. We\'re expanding soon.' },
        { status: 400 }
      )
    }

    const supabase = await createAdminClient()

    // Create or find auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { role: 'customer', first_name: firstName, last_name: lastName },
    })

    let userId: string

    if (authError && authError.message.includes('already been registered')) {
      // Supabase JS v2 has no getUserByEmail, and listUsers() defaults to 50
      // per page — paginate until the user is found or pages are exhausted.
      const targetEmail = String(email).toLowerCase()
      const perPage = 1000
      let foundId: string | null = null
      for (let page = 1; ; page++) {
        const { data: listData, error: lookupError } = await supabase.auth.admin.listUsers({ page, perPage })
        if (lookupError) throw new Error('User lookup failed')
        const found = listData?.users.find(u => u.email?.toLowerCase() === targetEmail)
        if (found) {
          foundId = found.id
          break
        }
        if (!listData || listData.users.length < perPage) break
      }
      if (!foundId) throw new Error('User lookup failed')
      userId = foundId
    } else if (authError) {
      throw authError
    } else {
      userId = authData.user.id
    }

    // Upsert customer record
    const { data: customer, error: custError } = await supabase
      .from('customers')
      .upsert(
        { user_id: userId, first_name: firstName, last_name: lastName, phone, preferred_contact: preferredContact },
        { onConflict: 'user_id' }
      )
      .select()
      .single()

    if (custError) throw custError

    // Create enquiry
    const { data: enquiry, error: enqError } = await supabase
      .from('enquiries')
      .insert({
        customer_id: customer.id,
        products,
        postcode: postcode.trim().toUpperCase(),
        property_type: propertyType,
        property_age: propertyAge,
        ownership,
        roof_type: roofType || null,
        roof_orientation: roofOrientation || null,
        shading: shading || null,
        monthly_elec_kwh: parseInt(monthlyKwh),
        monthly_bill: parseInt(monthlyBill),
        electricity_supplier: electricitySupplier || null,
        goal,
        notes: notes || null,
        recommended_panels: recommendation?.panels || null,
        recommended_system_kwp: recommendation?.systemKwp || null,
        recommended_battery_kwh: recommendation?.batteryKwh || null,
        status: 'quotes_requested',
      })
      .select()
      .single()

    if (enqError) throw enqError

    // Store the full address in the PII-isolated enquiry_addresses table.
    // Installers have no RLS policy on this table and must never see it —
    // they only get the postcode district via the API layer.
    // Geocode via postcodes.io (free, UK-specific, no key needed) as a
    // postcode-centroid baseline for the roof-layout feature.
    // TODO Phase 1b: rooftop-precision geocoding (Google Geocoding API)
    let lat: number | null = null
    let lng: number | null = null
    try {
      const geo = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode.trim())}`)
      const geoJson = await geo.json()
      if (geoJson.status === 200) {
        lat = geoJson.result.latitude
        lng = geoJson.result.longitude
      }
    } catch {
      // Non-fatal — store null lat/lng; Phase 1b can backfill
    }

    const { error: addrError } = await supabase
      .from('enquiry_addresses')
      .insert({
        enquiry_id: enquiry.id,
        address_line1: addressLine1.trim(),
        address_line2: addressLine2?.trim() || null,
        city: city?.trim() || null,
        postcode: postcode.trim().toUpperCase(),
        lat,
        lng,
      })

    if (addrError) {
      // Don't fail the enquiry — the address powers a later-phase feature.
      // Capture so it can be backfilled from the raw enquiry if needed.
      console.error('enquiry_addresses insert failed:', addrError)
      Sentry.captureException(new Error(`enquiry_addresses insert failed: ${addrError.message}`), {
        extra: { enquiryId: enquiry.id, reference: enquiry.reference },
      })
    } else {
      // Roof-layout Phase 1b: generate the panel layout from the address.
      // Insert a 'pending' row now so the UI can show generation state, then
      // schedule the pipeline with after() so it runs once the response has
      // been sent (a bare fire-and-forget promise can be killed on Vercel).
      // Must never affect the enquiry response.
      try {
        const { error: designError } = await supabase
          .from('roof_designs')
          .insert({ enquiry_id: enquiry.id, source: 'google_solar', status: 'pending' })
        if (designError) {
          console.error('roof_designs pending insert failed:', designError.message)
        } else {
          after(async () => {
            try {
              await generateRoofDesign(enquiry.id)
            } catch (err) {
              // generateRoofDesign handles its own errors; this is a backstop.
              Sentry.captureException(err, { extra: { enquiryId: enquiry.id } })
            }
          })
        }
      } catch (err) {
        Sentry.captureException(err, { extra: { enquiryId: enquiry.id } })
      }
    }

    // Match installers
    const postcodeArea = getPostcodeArea(postcode)
    const { data: installers } = await supabase
      .from('installers')
      .select('id, contact_email, company_name, coverage_postcodes, products, average_rating_google, average_rating_trustpilot')
      .eq('status', 'active')

    const matched = (installers || [])
      .filter(inst => {
        const coversPostcode = inst.coverage_postcodes.some((p: string) =>
          postcodeArea.startsWith(p.trim().toUpperCase())
        )
        const hasProducts = products.every((pr: string) => inst.products.includes(pr))
        return coversPostcode && hasProducts
      })
      .sort((a, b) => {
        const ratingA = ((a.average_rating_google || 0) + (a.average_rating_trustpilot || 0)) / 2
        const ratingB = ((b.average_rating_google || 0) + (b.average_rating_trustpilot || 0)) / 2
        return ratingB - ratingA
      })
      .slice(0, 3)

    // Create job briefs
    for (const installer of matched) {
      const { data: job } = await supabase
        .from('jobs')
        .insert({
          enquiry_id: enquiry.id,
          installer_id: installer.id,
          status: 'brief_sent',
        })
        .select()
        .single()

      if (job) {
        // Email installer with anonymised brief
        const brief = `
          <h3 style="font-family:'Fraunces',Georgia,serif;color:#1B3A2D;">New job brief — ${enquiry.reference}</h3>
          <p>A new enquiry has been matched to your coverage area.</p>
          <table style="border-collapse:collapse;width:100%">
            <tr><td style="padding:6px 0;color:#6B7E74;font-size:13px;">Products</td><td style="padding:6px 0;font-size:13px;">${products.join(', ')}</td></tr>
            <tr><td style="padding:6px 0;color:#6B7E74;font-size:13px;">Postcode area</td><td style="padding:6px 0;font-size:13px;">${postcodeArea}</td></tr>
            <tr><td style="padding:6px 0;color:#6B7E74;font-size:13px;">Property</td><td style="padding:6px 0;font-size:13px;">${propertyType}, ${propertyAge}</td></tr>
            <tr><td style="padding:6px 0;color:#6B7E74;font-size:13px;">Monthly usage</td><td style="padding:6px 0;font-size:13px;">${monthlyKwh} kWh</td></tr>
            <tr><td style="padding:6px 0;color:#6B7E74;font-size:13px;">Goal</td><td style="padding:6px 0;font-size:13px;">${goal === 'export' ? 'Cover and earn (export)' : 'Cover what I use'}</td></tr>
            <tr><td style="padding:6px 0;color:#6B7E74;font-size:13px;">Roof analysis</td><td style="padding:6px 0;font-size:13px;">View in your portal — we generate a satellite roof layout for most properties.</td></tr>
          </table>
          <p style="margin-top:16px;"><a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://wattsmart.co.uk'}/installer/jobs/${job.id}" style="background:#1B3A2D;color:#4AFFA0;text-decoration:none;border-radius:8px;padding:12px 24px;display:inline-block;font-family:Inter,sans-serif;font-weight:500;">Submit your quote →</a></p>
          <p style="font-size:12px;color:#6B7E74;margin-top:12px;">Quote deadline: ${new Date(Date.now() + 5 * 86400000).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        `

        // Send via nodemailer directly to avoid HTML wrapping issues
        const { default: nodemailer } = await import('nodemailer')
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT),
          secure: false,
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        })
        await transporter.sendMail({
          from: `"WattSmart" <${process.env.SMTP_FROM}>`,
          to: installer.contact_email,
          subject: `New job brief — ${enquiry.reference}`,
          html: brief,
        }).catch(console.error) // don't fail on email error
      }
    }

    if (matched.length === 0) {
      const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_FROM
      if (adminEmail) {
        await sendAdminAlert(
          adminEmail,
          `No installers matched — enquiry ${enquiry.reference} (${postcodeArea})`,
          `
          <p>Enquiry <strong>${enquiry.reference}</strong> (postcode area <strong>${postcodeArea}</strong>) matched zero active installers, so no job briefs were sent.</p>
          <p>Please review coverage and match installers manually.</p>
          <p><a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://wattsmart.co.uk'}/admin" style="color:#1B3A2D;">Open admin dashboard →</a></p>
          `
        ).catch(console.error)
      }
    }

    // Confirm to customer
    await sendEnquiryConfirmation(email, enquiry.reference, firstName).catch(console.error)

    return NextResponse.json({ reference: enquiry.reference, id: enquiry.id })
  } catch (err) {
    console.error('Enquiry submit error:', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
