import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }))

  const path = request.nextUrl.pathname
  const role = user?.user_metadata?.role as string | undefined
  const loginUrl = new URL('/auth/login', request.url)

  // Protected customer routes — must be authenticated with role 'customer' (or no role, for backwards compat)
  if (path.startsWith('/customer')) {
    if (!user) return NextResponse.redirect(new URL('/auth/login?type=customer', request.url))
    if (role && role !== 'customer') return NextResponse.redirect(loginUrl)
  }

  // Protected installer routes — register and accept-invite are public
  const installerPublicPaths = ['/installer/register', '/installer/accept-invite']
  if (path.startsWith('/installer') && !installerPublicPaths.some(p => path.startsWith(p))) {
    if (!user) return NextResponse.redirect(new URL('/auth/login?type=installer', request.url))
    if (role && role !== 'installer') return NextResponse.redirect(loginUrl)
  }

  // Protected admin routes — must be authenticated with role 'admin'.
  // Uses app_metadata (server-controlled, only settable via the service role)
  // rather than user_metadata, which any user can write to themselves.
  if (path.startsWith('/admin')) {
    if (!user) return NextResponse.redirect(new URL('/auth/login?type=admin', request.url))
    if (user.app_metadata?.role !== 'admin') return NextResponse.redirect(loginUrl)
  }

  return supabaseResponse
}
