import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { generateRoofDesign } from '@/lib/solar'

// Internal endpoint: (re)generate the roof design for an enquiry.
// Callable with the internal secret (server-to-server) or by an admin user
// (regeneration from the admin dashboard).
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-internal-secret')
  const expected = process.env.INTERNAL_API_SECRET
  // Fail closed if the env var is unset or empty — an empty header must
  // never match an empty/missing secret.
  let authorised = Boolean(expected) && secret === expected

  if (!authorised) {
    // Admin fallback — mirrors the pattern in /api/admin/* routes
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const adminClient = await createAdminClient()
      const { data: { user: fullUser } } = await adminClient.auth.admin.getUserById(user.id)
      authorised = fullUser?.app_metadata?.role === 'admin'
    }
  }

  if (!authorised) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { enquiryId } = await req.json()
    if (typeof enquiryId !== 'string' || !/^[0-9a-f-]{36}$/i.test(enquiryId)) {
      return NextResponse.json({ error: 'Invalid enquiryId' }, { status: 400 })
    }

    // generateRoofDesign never throws — it records failure state itself.
    await generateRoofDesign(enquiryId)

    const admin = await createAdminClient()
    const { data: design } = await admin
      .from('roof_designs')
      .select('status, panel_count, system_kwp, est_annual_kwh, image_path, imagery_quality')
      .eq('enquiry_id', enquiryId)
      .single()

    return NextResponse.json({ ok: true, design: design ?? null })
  } catch (err) {
    console.error('Generate design error:', err)
    return NextResponse.json({ error: 'Failed to generate design' }, { status: 500 })
  }
}
