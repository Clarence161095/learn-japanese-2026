/**
 * Seed script - Load sample JSON data into SQLite database
 * Usage: npm run seed
 */

import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

const DB_DIR = path.join(process.cwd(), 'data', 'database');
const DB_PATH = path.join(DB_DIR, 'nihongo.db');
const SAMPLE_DIR = path.join(process.cwd(), 'data', 'sample');

// Ensure DB directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY,
    book_level TEXT NOT NULL,
    chapter_week TEXT,
    chapter_day TEXT,
    chapter_section TEXT NOT NULL,
    question_number INTEGER,
    question_type TEXT,
    content_original TEXT NOT NULL,
    content_with_ruby TEXT,
    content_with_red_highlight TEXT,
    options TEXT NOT NULL,
    correct_answer_id INTEGER NOT NULL,
    explanation TEXT NOT NULL,
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS user_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    question_id TEXT NOT NULL,
    is_correct INTEGER DEFAULT 0,
    is_starred INTEGER DEFAULT 0,
    is_learned INTEGER DEFAULT 0,
    attempts INTEGER DEFAULT 0,
    consecutive_correct INTEGER DEFAULT 0,
    weight INTEGER DEFAULT 0,
    last_attempted DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    UNIQUE(user_id, question_id)
  );

  CREATE TABLE IF NOT EXISTS kanji_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    kanji TEXT NOT NULL,
    consecutive_correct INTEGER DEFAULT 0,
    weight INTEGER DEFAULT 0,
    attempts INTEGER DEFAULT 0,
    last_practiced DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, kanji)
  );

  CREATE INDEX IF NOT EXISTS idx_questions_section ON questions(chapter_section);
  CREATE INDEX IF NOT EXISTS idx_questions_level ON questions(book_level);
  CREATE INDEX IF NOT EXISTS idx_progress_user ON user_progress(user_id);
  CREATE INDEX IF NOT EXISTS idx_progress_question ON user_progress(question_id);
  CREATE INDEX IF NOT EXISTS idx_kanji_progress_user ON kanji_progress(user_id);
`);

const insertStmt = db.prepare(`
  INSERT OR REPLACE INTO questions 
  (id, book_level, chapter_week, chapter_day, chapter_section, 
   question_number, question_type, content_original, content_with_ruby,
   content_with_red_highlight, options, correct_answer_id, explanation, metadata)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

interface QuestionData {
  id: string;
  book_level: string;
  chapter?: {
    week?: string;
    day?: string;
    section?: string;
  };
  question?: {
    number?: number;
    type?: string;
    content?: {
      original?: string;
      with_ruby?: string;
      with_red_highlight?: string;
    };
  };
  options?: { id: number; text: string; is_correct: boolean }[];
  correct_answer_id?: number;
  explanation?: Record<string, unknown>;
  metadata?: {
    section_type?: string;
    [key: string]: unknown;
  };
}

function insertQuestion(q: QuestionData): void {
  const section = q.chapter?.section || q.metadata?.section_type || 'UNKNOWN';
  insertStmt.run(
    q.id,
    q.book_level,
    q.chapter?.week || '',
    q.chapter?.day || '',
    section,
    q.question?.number || 0,
    q.question?.type || '',
    q.question?.content?.original || '',
    q.question?.content?.with_ruby || '',
    q.question?.content?.with_red_highlight || '',
    JSON.stringify(q.options || []),
    q.correct_answer_id || 0,
    JSON.stringify(q.explanation || {}),
    JSON.stringify(q.metadata || {})
  );
}

function processFile(filePath: string): number {
  const fileName = path.basename(filePath);
  console.log(`\n📂 Processing: ${fileName}`);

  const raw = fs.readFileSync(filePath, 'utf-8');
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    console.error(`  ❌ Invalid JSON in ${fileName}`);
    return 0;
  }

  let questions: QuestionData[] = [];

  if (Array.isArray(data)) {
    questions = data;
  } else if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>;
    // Check for section-specific keys
    for (const key of ['moji_data', 'goi_data', 'bunpo_data']) {
      if (Array.isArray(obj[key])) {
        questions = questions.concat(obj[key] as QuestionData[]);
      }
    }
    // Check for questions array
    if (Array.isArray(obj['questions'])) {
      questions = questions.concat(obj['questions'] as QuestionData[]);
    }
    // If single question object
    if (obj['id'] && obj['question']) {
      questions = [obj as unknown as QuestionData];
    }
  }

  let count = 0;
  const insertMany = db.transaction((qs: QuestionData[]) => {
    for (const q of qs) {
      try {
        insertQuestion(q);
        count++;
      } catch (err) {
        console.error(`  ⚠️ Failed to insert question ${q.id}: ${(err as Error).message}`);
      }
    }
  });

  insertMany(questions);
  console.log(`  ✅ Inserted ${count}/${questions.length} questions`);
  return count;
}

// Main
console.log('🌱 Seeding database...');
console.log(`📁 Database: ${DB_PATH}`);
console.log(`📁 Sample data: ${SAMPLE_DIR}`);

let totalInserted = 0;

// Process all JSON files in sample directory
if (fs.existsSync(SAMPLE_DIR)) {
  const files = fs.readdirSync(SAMPLE_DIR).filter(f => f.toLowerCase().endsWith('.json'));
  
  for (const file of files) {
    totalInserted += processFile(path.join(SAMPLE_DIR, file));
  }
} else {
  console.error('❌ Sample directory not found:', SAMPLE_DIR);
}

// Also process any files in data/imported/ if they exist
const importedDir = path.join(process.cwd(), 'data', 'imported');
if (fs.existsSync(importedDir)) {
  const importedFiles = fs.readdirSync(importedDir).filter(f => f.toLowerCase().endsWith('.json'));
  for (const file of importedFiles) {
    totalInserted += processFile(path.join(importedDir, file));
  }
}

// Summary
const total = (db.prepare('SELECT COUNT(*) as c FROM questions').get() as { c: number }).c;
const bySection = db.prepare(
  'SELECT chapter_section, COUNT(*) as c FROM questions GROUP BY chapter_section'
).all() as { chapter_section: string; c: number }[];

// Create admin user if not exists
try {
  const bcrypt = require('bcryptjs');
  const adminUser = 'admin';
  const adminPass = bcrypt.hashSync('admin2026', 10);
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(adminUser);
  if (!existing) {
    db.prepare(
      'INSERT INTO users (username, password_hash, display_name, role) VALUES (?, ?, ?, ?)'
    ).run(adminUser, adminPass, 'Admin', 'admin');
    console.log('✅ Admin user created (admin/admin2026)');
  } else {
    console.log('ℹ️ Admin user already exists');
  }
} catch (err) {
  console.error('⚠️ Could not create admin user:', (err as Error).message);
}

console.log('\n════════════════════════════════');
console.log('🎉 Seed hoàn tất!');
console.log(`📊 Tổng câu hỏi: ${total}`);
bySection.forEach(s => {
  console.log(`   ${s.chapter_section}: ${s.c} câu`);
});
console.log('════════════════════════════════\n');

db.close();
