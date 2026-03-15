import { NextRequest, NextResponse } from 'next/server';
import { getUserStats } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const userId = parseInt(request.headers.get('x-user-id') || '0');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stats = getUserStats(userId);
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
