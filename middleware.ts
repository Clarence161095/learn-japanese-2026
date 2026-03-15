import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { checkRateLimit } from '@/lib/rate-limit';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'nihongo-master-2026-default-secret'
);

// Only login-related paths are public (no register)
const publicPaths = ['/login', '/api/auth/login', '/api/auth/register'];

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    request.ip ||
    '127.0.0.1'
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static files and Next.js internals (no rate limit)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // --- Rate Limiting (all non-static requests) ---
  const clientIP = getClientIP(request);
  const rateResult = checkRateLimit(clientIP, 120, 60_000); // 120 req/min per IP

  if (!rateResult.allowed) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Quá nhiều request. Vui lòng thử lại sau.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateResult.retryAfterSec),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }
    // For page requests, show a simple redirect to login with error
    return new NextResponse(
      '<html><body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;"><div style="text-align:center"><h1>⏳ Too Many Requests</h1><p>Vui lòng đợi một lát rồi thử lại.</p></div></body></html>',
      { status: 429, headers: { 'Content-Type': 'text/html', 'Retry-After': String(rateResult.retryAfterSec) } }
    );
  }

  // --- Public paths (login page + login API) ---
  if (publicPaths.some(p => pathname.startsWith(p))) {
    // Add rate-limit headers
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Remaining', String(rateResult.remaining));
    // Pass client IP to login API for brute force tracking
    if (pathname === '/api/auth/login') {
      response.headers.set('x-client-ip', clientIP);
    }
    return response;
  }

  // --- Everything below requires authentication ---
  const token = request.cookies.get('nihongo_session')?.value;

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  let payload: { userId: number; username: string; role: string } | null = null;
  try {
    const { payload: jwtPayload } = await jwtVerify(token, JWT_SECRET);
    payload = jwtPayload as unknown as { userId: number; username: string; role: string };
  } catch {
    payload = null;
  }

  if (!payload) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Phiên đăng nhập hết hạn' }, { status: 401 });
    }
    // Clear invalid cookie and redirect to login
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('nihongo_session');
    return response;
  }

  // Lock /register — redirect to login (only admin creates users)
  if (pathname === '/register') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Root path → dashboard
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Admin-only routes
  if (pathname.startsWith('/admin') && payload.role !== 'admin') {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Forbidden: admin only' }, { status: 403 });
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Add user info to headers for API routes
  const response = NextResponse.next();
  response.headers.set('x-user-id', String(payload.userId));
  response.headers.set('x-username', payload.username);
  response.headers.set('x-user-role', payload.role || 'user');
  response.headers.set('x-client-ip', clientIP);
  response.headers.set('X-RateLimit-Remaining', String(rateResult.remaining));
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
