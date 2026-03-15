import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Registration is locked. Only admin can create users via /api/admin/create-user
  void request;
  return NextResponse.json(
    { error: 'Đăng ký đã bị khóa. Liên hệ admin để tạo tài khoản.' },
    { status: 403 }
  );
}
