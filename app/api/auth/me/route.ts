import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { ensureAdminUser } from '@/lib/db';

export async function GET() {
  // Ensure admin user exists
  ensureAdminUser();
  
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  return NextResponse.json({ user });
}
