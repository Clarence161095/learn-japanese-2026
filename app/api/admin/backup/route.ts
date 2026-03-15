import { NextRequest, NextResponse } from 'next/server';
import { exportAllData } from '@/lib/db';
import fs from 'fs';
import path from 'path';

// GET: Export all data as JSON backup
export async function GET(request: NextRequest) {
  try {
    const userRole = request.headers.get('x-user-role');
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = exportAllData();

    // Also save to backup folder
    try {
      const backupDir = path.join(process.cwd(), 'data', 'backup');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `backup_${timestamp}.json`;
      const filepath = path.join(backupDir, filename);

      // Remove password_hash from users before backup
      const safeData = {
        ...data,
        users: data.users.map(u => ({
          id: u.id,
          username: u.username,
          display_name: u.display_name,
          role: u.role,
          created_at: u.created_at,
        })),
        exported_at: new Date().toISOString(),
        stats: {
          users: data.users.length,
          questions: data.questions.length,
          user_progress: data.user_progress.length,
          kanji_progress: data.kanji_progress.length,
        },
      };

      fs.writeFileSync(filepath, JSON.stringify(safeData, null, 2), 'utf-8');

      return NextResponse.json({
        success: true,
        filename,
        stats: safeData.stats,
        message: `Backup saved to data/backup/${filename}`,
      });
    } catch (fileErr) {
      console.error('Backup file error:', fileErr);
      return NextResponse.json({
        success: true,
        stats: {
          users: data.users.length,
          questions: data.questions.length,
          user_progress: data.user_progress.length,
          kanji_progress: data.kanji_progress.length,
        },
        message: 'Data exported but could not save backup file',
      });
    }
  } catch (error) {
    console.error('Backup error:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
