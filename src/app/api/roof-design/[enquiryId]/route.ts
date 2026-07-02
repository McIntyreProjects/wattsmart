import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// Roof-layout Phase 1c: return the roof design for an enquiry, with a
// short-lived signed URL for the layout image.
//
// PRIVACY: the roof_designs table contains no address or coordinate data
// (see migration 011), so every field here is safe to show installers.
// The signed URL is issued only AFTER the caller's relationship to the
// enquiry has been verified, and expires after 5 minutes.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ enquiryId: string }> }
) {
  try {
    const { enquiryId } = await params
    if (typeof enquiryId !== 'string' || !/^[0-9a-f-]{36}$/i.test(enquiryId)) {
      return NextResponse.json({ error: 'Invalid enquiryId' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = await createAdminClient()

    // Determine the caller's relationship to this enquiry.
    let authorised = false

    // (a) Customer who owns the enquiry (enquiry -> customer -> user_id)
    const { data: enquiry } = await admin
      .from('enquiries')
      .select('customer_id')
      .eq('id', enquiryId)
      .maybeSingle()

    if (enquiry?.customer_id) {
      const { data: customer } = await admin
        .from('customers')
        .select('user_id')
        .eq('id', enquiry.customer_id)
        .maybeSingle()
      if (customer?.user_id === user.id) authorised = true
    }

    // (b) Installer with a job on this enquiry
    if (!authorised) {
      const { data: installer } = await admin
        .from('installers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()
      if (installer) {
        const { data: jobs } = await admin
          .from('jobs')
          .select('id')
          .eq('enquiry_id', enquiryId)
          .eq('installer_id', installer.id)
          .limit(1)
        if (jobs && jobs.length > 0) authorised = true
      }
    }

    // (c) Admin — established app_metadata.role pattern
    if (!authorised) {
      const { data: { user: fullUser } } = await admin.auth.admin.getUserById(user.id)
      authorised = fullUser?.app_metadata?.role === 'admin'
    }

    if (!authorised) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: design } = await admin
      .from('roof_designs')
      .select('status, panel_count, system_kwp, est_annual_kwh, roof_segments, image_path, imagery_quality')
      .eq('enquiry_id', enquiryId)
      .maybeSingle()

    if (!design) {
      return NextResponse.json({ status: 'none' }, { status: 404 })
    }

    // Short-lived signed URL (5 min) — only after the ownership check above.
    let imageUrl: string | null = null
    if (design.image_path) {
      const { data: signed } = await admin.storage
        .from('roof-designs')
        .createSignedUrl(design.image_path, 300)
      imageUrl = signed?.signedUrl ?? null
    }

    return NextResponse.json({
      status: design.status,
      panel_count: design.panel_count,
      system_kwp: design.system_kwp,
      est_annual_kwh: design.est_annual_kwh,
      roof_segments: design.roof_segments,
      imagery_quality: design.imagery_quality,
      imageUrl,
    })
  } catch (err) {
    console.error('Roof design fetch error:', err)
    return NextResponse.json({ error: 'Failed to load roof design' }, { status: 500 })
  }
}
