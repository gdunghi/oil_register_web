import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT, COOKIE_NAME } from '@/lib/auth'

const PUBLIC_PATHS = ['/login', '/api/auth/login']
const ADMIN_ONLY_API = ['/api/users', '/api/ships']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const token = request.cookies.get(COOKIE_NAME)?.value
  const payload = token ? await verifyJWT(token) : null

  if (!payload) {
    // API routes return 401; pages redirect to login
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Admin-only API routes
  if (
    payload.role !== 'admin' &&
    ADMIN_ONLY_API.some((p) => pathname.startsWith(p)) &&
    !pathname.startsWith('/api/ships/search')
  ) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Inject user info into headers for API routes
  const headers = new Headers(request.headers)
  headers.set('x-user-id', payload.sub)
  headers.set('x-user-role', payload.role)
  headers.set('x-username', payload.username)

  return NextResponse.next({ request: { headers } })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
