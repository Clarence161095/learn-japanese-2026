import { NextRequest, NextResponse } from 'next/server';
import { getUserByUsername, ensureAdminUser } from '@/lib/db';
import { verifyPassword, createToken, setSessionCookie } from '@/lib/auth';
import { isLoginBlocked, recordLoginFailure, clearLoginFailures } from '@/lib/rate-limit';
import type { UserRole } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    // Ensure admin user exists on first login attempt
    ensureAdminUser();

    // Get client IP from middleware header
    const clientIP = request.headers.get('x-client-ip') || '127.0.0.1';

    // Check if IP is blocked due to too many failed attempts
    const blockStatus = isLoginBlocked(clientIP);
    if (blockStatus.blocked) {
      const minutes = Math.ceil(blockStatus.retryAfterSec / 60);
      return NextResponse.json(
        { error: `Quá nhiều lần đăng nhập sai. Vui lòng thử lại sau ${minutes} phút.` },
        {
          status: 429,
          headers: { 'Retry-After': String(blockStatus.retryAfterSec) },
        }
      );
    }

    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Tên đăng nhập và mật khẩu là bắt buộc' },
        { status: 400 }
      );
    }

    const user = getUserByUsername(username);
    if (!user) {
      // Record failed attempt
      const failResult = recordLoginFailure(clientIP);
      const msg = failResult.blocked
        ? `Quá nhiều lần đăng nhập sai. Vui lòng thử lại sau ${Math.ceil(failResult.retryAfterSec / 60)} phút.`
        : `Tên đăng nhập hoặc mật khẩu không đúng (còn ${failResult.attemptsLeft} lần thử)`;
      return NextResponse.json(
        { error: msg },
        { status: failResult.blocked ? 429 : 401 }
      );
    }

    const isValid = verifyPassword(password, user.password_hash);
    if (!isValid) {
      // Record failed attempt
      const failResult = recordLoginFailure(clientIP);
      const msg = failResult.blocked
        ? `Quá nhiều lần đăng nhập sai. Vui lòng thử lại sau ${Math.ceil(failResult.retryAfterSec / 60)} phút.`
        : `Tên đăng nhập hoặc mật khẩu không đúng (còn ${failResult.attemptsLeft} lần thử)`;
      return NextResponse.json(
        { error: msg },
        { status: failResult.blocked ? 429 : 401 }
      );
    }

    // Successful login — clear failed attempts for this IP
    clearLoginFailures(clientIP);

    const userPayload = {
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      role: (user.role || 'user') as UserRole,
    };
    const token = await createToken(userPayload);
    const cookie = setSessionCookie(token);

    const response = NextResponse.json({
      success: true,
      user: userPayload,
    });

    response.cookies.set(cookie.name, cookie.value, cookie.options as Record<string, unknown>);
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi đăng nhập' },
      { status: 500 }
    );
  }
}
