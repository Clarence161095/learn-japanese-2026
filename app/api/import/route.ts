import { NextRequest, NextResponse } from 'next/server';
import { insertQuestion } from '@/lib/db';
import type { Question } from '@/lib/types';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let questions: Question[] = [];

    // Handle different input formats
    if (Array.isArray(body)) {
      questions = body;
    } else if (body.questions && Array.isArray(body.questions)) {
      questions = body.questions;
    } else if (body.moji_data) {
      questions = body.moji_data;
    } else if (body.goi_data) {
      questions = body.goi_data;
    } else if (body.bunpo_data) {
      questions = body.bunpo_data;
    } else if (body.id && body.question) {
      // Single question
      questions = [body];
    } else {
      return NextResponse.json(
        { error: 'Định dạng JSON không hợp lệ. Vui lòng kiểm tra lại cấu trúc dữ liệu.' },
        { status: 400 }
      );
    }

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const q of questions) {
      try {
        // Validate required fields
        if (!q.id || !q.question?.content?.original || !q.options || !q.correct_answer_id) {
          errors.push(`Câu hỏi thiếu trường bắt buộc: ${q.id || 'unknown'}`);
          skipped++;
          continue;
        }

        // Determine section from chapter or metadata
        const section = q.chapter?.section || q.metadata?.section_type || 'UNKNOWN';

        insertQuestion({
          id: q.id,
          book_level: q.book_level || 'N/A',
          chapter_week: q.chapter?.week || '',
          chapter_day: q.chapter?.day || '',
          chapter_section: section,
          question_number: q.question?.number || 0,
          question_type: q.question?.type || '',
          content_original: q.question.content.original,
          content_with_ruby: q.question.content.with_ruby || q.question.content.original,
          content_with_red_highlight: q.question.content.with_red_highlight || '',
          options: JSON.stringify(q.options),
          correct_answer_id: q.correct_answer_id,
          explanation: JSON.stringify(q.explanation || {}),
          metadata: JSON.stringify(q.metadata || {}),
        });

        imported++;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        errors.push(`Lỗi import câu ${q.id}: ${errorMsg}`);
        skipped++;
      }
    }

    // Save backup to data/imported/
    try {
      const importDir = path.join(process.cwd(), 'data', 'imported');
      if (!fs.existsSync(importDir)) {
        fs.mkdirSync(importDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `import_${timestamp}.json`;
      const filepath = path.join(importDir, filename);

      fs.writeFileSync(filepath, JSON.stringify(questions, null, 2), 'utf-8');

      return NextResponse.json({
        success: true,
        imported,
        skipped,
        errors,
        filename,
      });
    } catch (fileErr) {
      console.error('Failed to save backup file:', fileErr);
      return NextResponse.json({
        success: true,
        imported,
        skipped,
        errors: [...errors, 'Cảnh báo: Không thể lưu file backup'],
      });
    }
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi import dữ liệu. Vui lòng kiểm tra định dạng JSON.' },
      { status: 500 }
    );
  }
}
