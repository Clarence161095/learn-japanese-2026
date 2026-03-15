import { NextRequest, NextResponse } from 'next/server';
import { getUserProgress, upsertProgress } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const userId = parseInt(request.headers.get('x-user-id') || '0');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get('questionId') || undefined;

    const progress = getUserProgress(userId, questionId);

    return NextResponse.json({
      progress: progress.map(p => ({
        question_id: p.question_id,
        is_correct: Boolean(p.is_correct),
        is_starred: Boolean(p.is_starred),
        is_learned: Boolean(p.is_learned),
        attempts: p.attempts,
        consecutive_correct: p.consecutive_correct || 0,
        weight: p.weight || 0,
        last_attempted: p.last_attempted,
      })),
    });
  } catch (error) {
    console.error('Progress GET error:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = parseInt(request.headers.get('x-user-id') || '0');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { questionId, is_correct, is_starred, is_learned } = await request.json();

    if (!questionId) {
      return NextResponse.json({ error: 'questionId là bắt buộc' }, { status: 400 });
    }

    upsertProgress(userId, questionId, {
      is_correct: is_correct !== undefined ? is_correct : undefined,
      is_starred: is_starred !== undefined ? is_starred : undefined,
      is_learned: is_learned !== undefined ? is_learned : undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Progress PUT error:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
