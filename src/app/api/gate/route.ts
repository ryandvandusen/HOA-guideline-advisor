import { NextRequest, NextResponse } from 'next/server';

// Must produce the same token as middleware.ts
async function computeToken(passcode: string): Promise<string> {
  const secret = process.env.JWT_SECRET ?? 'fallback-secret';
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

export async function POST(req: NextRequest) {
  const { passcode, from } = await req.json();

  if (!passcode || passcode !== process.env.HOMEOWNER_PASSCODE) {
    return NextResponse.json({ error: 'Incorrect passcode.' }, { status: 401 });
  }

  const token = await computeToken(passcode);
  const redirectTo = typeof from === 'string' && from.startsWith('/') ? from : '/';

  const res = NextResponse.json({ ok: true, redirectTo });

  // httpOnly prevents JS from reading the cookie (XSS hardening)
  res.cookies.set('hoa_access', token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    // Session cookie — cleared when browser closes
  });

  return res;
}
