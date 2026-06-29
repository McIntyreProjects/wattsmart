import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendEnquiryConfirmation, sendNewInstallerApplication } from '@/lib/email'
import { isLaunchPostcode, getPostcodeArea } from '@/lib/utils'
import { rateLimit } from '@/lib/rateLimit'

export async function POST(req: NextRequest) {
  const ip = (req.headers.get('x-forwarded-for') ?? '127.0.0.1').split(',')[0].trim()
  if (!rateLimit(ip, 5, 60_000)) {
    return NextResponse.json({ error: 'Too many requests. Please wait a moment and try again.' }, { status: 429, headers: { 'Retry-After': '60' } })
  }

  try {
    const body = await req.json()
    const {
      products, postcode, propertyType, propertyAge, ownership,
      roofType, roofOrientation, shading,
      monthlyKwh, monthlyBill, electricitySupplier,
      goal, notes, firstName, lastName, email, phone, preferredContact,
      recommendation,
    } = body

    if (!products?.length || !postcode || !propertyType || !propertyAge || !ownership || !goal || !firstName || !lastName || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
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
      const { data: listData, error: lookupError } = await supabase.auth.admin.listUsers()
      const found = listData?.users.find(u => u.email === email)
      if (!found || lookupError) throw new Error('User lookup failed')
      userId = found.id
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
      const adminEmail = process.env.ADMIN_EMAIL
      if (adminEmail) {
        await sendNewInstallerApplication(
          adminEmail,
          `No installers matched for enquiry ${enquiry.reference} (${postcodeArea})`,
          `${process.env.NEXT_PUBLIC_SITE_URL || 'https://wattsmart.co.uk'}/admin`
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
