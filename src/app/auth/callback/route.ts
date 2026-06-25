import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type') || 'customer'

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  const redirects: Record<string, string> = {
    customer: '/customer/dashboard',
    installer: '/installer/dashboard',
    admin: '/admin/dashboard',
  }

  return NextResponse.redirect(`${origin}${redirects[type] || '/'}`)
}
