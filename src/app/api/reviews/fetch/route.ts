import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

async function anonymiseReview(text: string, installerName: string, staffNames: string[], phone: string, website: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return text

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `You are anonymising a review to remove installer identity.

Installer details to redact:
- Company name: ${installerName}
- Any variations/abbreviations of the company name
- Staff names: ${staffNames.join(', ')}
- Phone: ${phone}
- Website: ${website}

Replace any mention of the above with the exact text: [installer name removed]

Return ONLY the anonymised review text, nothing else.

Review to anonymise:
${text}`,
        }],
      }),
    })

    if (res.ok) {
      const data = await res.json()
      return data.content?.[0]?.text || text
    }
  } catch {}
  return text
}

export async function POST(req: NextRequest) {
  try {
    // Auth check: must be logged in to prevent API cost abuse by bots
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { installerId, source } = await req.json()
    const admin = await createAdminClient()

    const { data: installer } = await admin
      .from('installers')
      .select('company_name, contact_name, contact_phone, trustpilot_url, google_place_id')
      .eq('id', installerId)
      .single()

    if (!installer) return NextResponse.json({ error: 'Installer not found' }, { status: 404 })

    let rawReviews: { rating: number; text: string; date: string }[] = []

    if (source === 'google' && installer.google_place_id) {
      const apiKey = process.env.GOOGLE_PLACES_API_KEY
      if (apiKey) {
        const res = await fetch(
          `https://maps.googleapis.com/maps/api/place/details/json?place_id=${installer.google_place_id}&fields=reviews,rating&key=${apiKey}`
        )
        if (res.ok) {
          const data = await res.json()
          rawReviews = (data.result?.reviews || []).slice(0, 5).map((r: { rating: number; text: string; time: number }) => ({
            rating: r.rating,
            text: r.text,
            date: new Date(r.time * 1000).toISOString().split('T')[0],
          }))

          await admin.from('installers').update({ average_rating_google: data.result?.rating }).eq('id', installerId)
        }
      }
    }

    if (source === 'trustpilot' && installer.trustpilot_url) {
      // Trustpilot public API endpoint (business name from URL)
      const domainMatch = installer.trustpilot_url.match(/trustpilot\.com\/review\/([^/?]+)/)
      if (domainMatch) {
        const businessUnit = domainMatch[1]
        const res = await fetch(
          `https://api.trustpilot.com/v1/business-units/find?name=${businessUnit}`,
          { headers: { 'apikey': process.env.TRUSTPILOT_API_KEY || '' } }
        ).catch(() => null)

        if (res?.ok) {
          const bu = await res.json()
          if (bu?.id) {
            const reviewRes = await fetch(
              `https://api.trustpilot.com/v1/business-units/${bu.id}/reviews?perPage=5`,
              { headers: { 'apikey': process.env.TRUSTPILOT_API_KEY || '' } }
            )
            if (reviewRes.ok) {
              const data = await reviewRes.json()
              rawReviews = (data.reviews || []).map((r: { stars: number; text: { review: string }; createdAt: string }) => ({
                rating: r.stars,
                text: r.text?.review || '',
                date: r.createdAt?.split('T')[0] || '',
              }))
              await admin.from('installers').update({ average_rating_trustpilot: bu.score?.trustScore }).eq('id', installerId)
            }
          }
        }
      }
    }

    // Anonymise and store reviews
    const anonymised = await Promise.all(
      rawReviews.map(async r => ({
        installer_id: installerId,
        source,
        rating: r.rating,
        review_text: r.text,
        review_text_anonymised: await anonymiseReview(
          r.text,
          installer.company_name,
          [installer.contact_name],
          installer.contact_phone,
          installer.trustpilot_url || ''
        ),
        reviewer_date: r.date,
        fetched_at: new Date().toISOString(),
      }))
    )

    if (anonymised.length > 0) {
      await admin.from('reviews').upsert(anonymised, { onConflict: 'installer_id,source,reviewer_date' })
    }

    // Return stored reviews
    const { data: reviews } = await admin
      .from('reviews')
      .select('id, source, rating, review_text_anonymised, reviewer_date, product_mentioned')
      .eq('installer_id', installerId)
      .eq('source', source)
      .order('reviewer_date', { ascending: false })
      .limit(5)

    return NextResponse.json({ reviews })
  } catch (err) {
    console.error('Fetch reviews error:', err)
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
  }
}
