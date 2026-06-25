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
        setAll(cookiesToSet) {
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

  // Protected customer routes
  if (path.startsWith('/customer') && !user) {
    return NextResponse.redirect(new URL('/auth/login?type=customer', request.url))
  }

  // Protected installer routes (register is public)
  const installerPublicPaths = ['/installer/register']
  if (path.startsWith('/installer') && !installerPublicPaths.includes(path) && !user) {
    return NextResponse.redirect(new URL('/auth/login?type=installer', request.url))
  }

  // Protected admin routes
  if (path.startsWith('/admin') && !user) {
    return NextResponse.redirect(new URL('/auth/login?type=admin', request.url))
  }

  return supabaseResponse
}
