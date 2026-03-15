import { NextRequest, NextResponse } from 'next/server';
import { getQuestions, getQuestionCount, getQuestionsByMastery } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section') || undefined;
    const level = searchParams.get('level') || undefined;
    const starred = searchParams.get('starred') === 'true';
    const wrong = searchParams.get('wrong') === 'true';
    const random = searchParams.get('random') === 'true';
    const mastery = searchParams.get('mastery') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const userId = parseInt(request.headers.get('x-user-id') || '0');

    if (searchParams.get('count') === 'true') {
      const counts = getQuestionCount();
      return NextResponse.json(counts);
    }

    let rows;

    // Use mastery-based filter if specified
    if (mastery && userId) {
      rows = getQuestionsByMastery(userId, mastery, section?.toUpperCase());
    } else {
      rows = getQuestions({
        section: section?.toUpperCase(),
        level,
        starred,
        wrong,
        userId,
        limit,
        random,
      });
    }

    // Shuffle if random and using mastery filter
    if (random && mastery) {
      rows = [...rows].sort(() => Math.random() - 0.5);
    }

    if (limit && mastery) {
      rows = rows.slice(0, limit);
    }

    // Parse JSON fields
    const questions = rows.map(row => ({
      id: row.id,
      book_level: row.book_level,
      chapter: {
        week: row.chapter_week,
        day: row.chapter_day,
        section: row.chapter_section,
      },
      question: {
        number: row.question_number,
        type: row.question_type,
        content: {
          original: row.content_original,
          with_ruby: row.content_with_ruby,
          with_red_highlight: row.content_with_red_highlight || '',
        },
      },
      options: JSON.parse(row.options),
      correct_answer_id: row.correct_answer_id,
      explanation: JSON.parse(row.explanation),
      metadata: JSON.parse(row.metadata || '{}'),
    }));

    return NextResponse.json({ questions, total: questions.length });
  } catch (error) {
    console.error('Questions API error:', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi lấy danh sách câu hỏi' },
      { status: 500 }
    );
  }
}
