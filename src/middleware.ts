import { NextRequest, NextResponse } from 'next/server';

// Compute the expected cookie token using Web Crypto (available in Edge + Node runtimes).
// The token is HMAC-SHA256(passcode, JWT_SECRET) encoded as hex.
async function expectedToken(): Promise<string> {
  const secret = process.env.JWT_SECRET ?? 'fallback-secret';
  const passcode = process.env.HOMEOWNER_PASSCODE ?? '';
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(passcode));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow: gate page, gate API, admin routes (own auth), Next.js internals
  if (
    pathname.startsWith('/gate') ||
    pathname.startsWith('/api/gate') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api/admin') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get('hoa_access')?.value;
  const expected = await expectedToken();

  if (token !== expected) {
    const url = req.nextUrl.clone();
    url.pathname = '/gate';
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
