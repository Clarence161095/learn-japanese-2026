import { NextRequest, NextResponse } from 'next/server';
import { getUserStats, getUserStatsByLevel } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const userId = parseInt(request.headers.get('x-user-id') || '0');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level') || undefined;

    let stats;
    if (level && level !== 'ALL') {
      stats = getUserStatsByLevel(userId, level);
    } else {
      stats = getUserStats(userId);
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
