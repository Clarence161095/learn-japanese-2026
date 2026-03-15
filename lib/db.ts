import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.join(process.cwd(), 'data', 'database');
const DB_PATH = process.env.DATABASE_PATH
  ? path.resolve(process.env.DATABASE_PATH)
  : path.join(DB_DIR, 'nihongo.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  // Ensure database directory exists
  const dbDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = new Database(DB_PATH);

  // Enable WAL mode for better performance
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Initialize tables
  initializeDatabase(db);

  return db;
}

function initializeDatabase(db: Database.Database): void {
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

  // Migration: add columns if missing on existing DB
  try {
    db.exec(`ALTER TABLE questions ADD COLUMN content_with_red_highlight TEXT`);
  } catch { /* column already exists */ }
  try {
    db.exec(`ALTER TABLE user_progress ADD COLUMN consecutive_correct INTEGER DEFAULT 0`);
  } catch { /* column already exists */ }
  try {
    db.exec(`ALTER TABLE user_progress ADD COLUMN weight INTEGER DEFAULT 0`);
  } catch { /* column already exists */ }
  try {
    db.exec(`ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'`);
  } catch { /* column already exists */ }
}

// --- Question Operations ---

export function insertQuestion(q: {
  id: string;
  book_level: string;
  chapter_week: string;
  chapter_day: string;
  chapter_section: string;
  question_number: number;
  question_type: string;
  content_original: string;
  content_with_ruby: string;
  content_with_red_highlight?: string;
  options: string;
  correct_answer_id: number;
  explanation: string;
  metadata: string;
}): void {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO questions 
    (id, book_level, chapter_week, chapter_day, chapter_section, 
     question_number, question_type, content_original, content_with_ruby,
     content_with_red_highlight, options, correct_answer_id, explanation, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    q.id, q.book_level, q.chapter_week, q.chapter_day, q.chapter_section,
    q.question_number, q.question_type, q.content_original, q.content_with_ruby,
    q.content_with_red_highlight || '', q.options, q.correct_answer_id, q.explanation, q.metadata
  );
}

export function getQuestions(filters?: {
  section?: string;
  level?: string;
  starred?: boolean;
  wrong?: boolean;
  userId?: number;
  limit?: number;
  random?: boolean;
}): import('./types').QuestionRow[] {
  const db = getDb();
  let query = 'SELECT q.* FROM questions q';
  const params: (string | number)[] = [];
  const conditions: string[] = [];

  if (filters?.starred || filters?.wrong) {
    query += ' LEFT JOIN user_progress up ON q.id = up.question_id AND up.user_id = ?';
    params.push(filters.userId || 0);
  }

  if (filters?.section) {
    conditions.push('q.chapter_section = ?');
    params.push(filters.section);
  }

  if (filters?.level) {
    if (filters.level === 'N4-N5') {
      conditions.push("(q.book_level = 'N4-N5' OR q.book_level = 'N4' OR q.book_level = 'N5')");
    } else {
      conditions.push('q.book_level = ?');
      params.push(filters.level);
    }
  }

  if (filters?.starred) {
    conditions.push('up.is_starred = 1');
  }

  if (filters?.wrong) {
    conditions.push('up.is_correct = 0 AND up.attempts > 0');
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  if (filters?.random) {
    query += ' ORDER BY RANDOM()';
  } else {
    query += ' ORDER BY q.book_level, q.chapter_week, q.chapter_day, q.question_number';
  }

  if (filters?.limit) {
    query += ' LIMIT ?';
    params.push(filters.limit);
  }

  return db.prepare(query).all(...params) as import('./types').QuestionRow[];
}

export function getQuestionById(id: string): import('./types').QuestionRow | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM questions WHERE id = ?').get(id) as import('./types').QuestionRow | undefined;
}

export function getQuestionCount(): { total: number; bySection: Record<string, number>; byLevel: Record<string, number> } {
  const db = getDb();
  const total = (db.prepare('SELECT COUNT(*) as count FROM questions').get() as { count: number }).count;
  
  const bySectionRows = db.prepare(
    'SELECT chapter_section, COUNT(*) as count FROM questions GROUP BY chapter_section'
  ).all() as { chapter_section: string; count: number }[];
  
  const byLevelRows = db.prepare(
    'SELECT book_level, COUNT(*) as count FROM questions GROUP BY book_level'
  ).all() as { book_level: string; count: number }[];

  const bySection: Record<string, number> = {};
  bySectionRows.forEach(r => { bySection[r.chapter_section] = r.count; });

  const byLevel: Record<string, number> = {};
  byLevelRows.forEach(r => { byLevel[r.book_level] = r.count; });

  return { total, bySection, byLevel };
}

// --- User Operations ---

export function createUser(username: string, passwordHash: string, displayName: string, role: string = 'user'): number {
  const db = getDb();
  const result = db.prepare(
    'INSERT INTO users (username, password_hash, display_name, role) VALUES (?, ?, ?, ?)'
  ).run(username, passwordHash, displayName, role);
  return result.lastInsertRowid as number;
}

export function getUserByUsername(username: string): import('./types').UserRow | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username) as import('./types').UserRow | undefined;
}

export function getUserById(id: number): import('./types').UserRow | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as import('./types').UserRow | undefined;
}

export function getAllUsers(): import('./types').UserRow[] {
  const db = getDb();
  return db.prepare('SELECT id, username, display_name, role, created_at FROM users ORDER BY id').all() as import('./types').UserRow[];
}

export function updateUser(id: number, data: { display_name?: string; role?: string }): void {
  const db = getDb();
  const updates: string[] = [];
  const params: (string | number)[] = [];

  if (data.display_name !== undefined) {
    updates.push('display_name = ?');
    params.push(data.display_name);
  }
  if (data.role !== undefined) {
    updates.push('role = ?');
    params.push(data.role);
  }

  if (updates.length > 0) {
    params.push(id);
    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  }
}

export function updateUserPassword(id: number, passwordHash: string): void {
  const db = getDb();
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, id);
}

export function deleteUser(id: number): void {
  const db = getDb();
  // Delete user progress first (cascade should handle it, but be explicit)
  db.prepare('DELETE FROM user_progress WHERE user_id = ?').run(id);
  db.prepare('DELETE FROM kanji_progress WHERE user_id = ?').run(id);
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
}

// --- Backup / Export all data as JSON ---
export function exportAllData(): { users: import('./types').UserRow[]; questions: import('./types').QuestionRow[]; user_progress: import('./types').ProgressRow[]; kanji_progress: import('./types').KanjiProgressRow[] } {
  const db = getDb();
  const users = db.prepare('SELECT * FROM users').all() as import('./types').UserRow[];
  const questions = db.prepare('SELECT * FROM questions').all() as import('./types').QuestionRow[];
  const user_progress = db.prepare('SELECT * FROM user_progress').all() as import('./types').ProgressRow[];
  const kanji_progress = db.prepare('SELECT * FROM kanji_progress').all() as import('./types').KanjiProgressRow[];
  return { users, questions, user_progress, kanji_progress };
}

// --- Stats by level (for level-specific filtering) ---
export function getUserStatsByLevel(userId: number, level: string): import('./types').UserStats {
  const db = getDb();

  // Build level condition
  let levelCondition: string;
  const levelParams: string[] = [];
  if (level === 'N4-N5') {
    levelCondition = "(q.book_level = 'N4-N5' OR q.book_level = 'N4' OR q.book_level = 'N5')";
  } else {
    levelCondition = "q.book_level = ?";
    levelParams.push(level);
  }

  const totalQ = (db.prepare(`SELECT COUNT(*) as c FROM questions q WHERE ${levelCondition}`).get(...levelParams) as { c: number }).c;
  
  const answered = (db.prepare(
    `SELECT COUNT(*) as c FROM user_progress up JOIN questions q ON up.question_id = q.id WHERE up.user_id = ? AND up.attempts > 0 AND ${levelCondition}`
  ).get(userId, ...levelParams) as { c: number }).c;
  
  const correct = (db.prepare(
    `SELECT COUNT(*) as c FROM user_progress up JOIN questions q ON up.question_id = q.id WHERE up.user_id = ? AND up.is_correct = 1 AND ${levelCondition}`
  ).get(userId, ...levelParams) as { c: number }).c;
  
  const starred = (db.prepare(
    `SELECT COUNT(*) as c FROM user_progress up JOIN questions q ON up.question_id = q.id WHERE up.user_id = ? AND up.is_starred = 1 AND ${levelCondition}`
  ).get(userId, ...levelParams) as { c: number }).c;
  
  const learned = (db.prepare(
    `SELECT COUNT(*) as c FROM user_progress up JOIN questions q ON up.question_id = q.id WHERE up.user_id = ? AND up.is_learned = 1 AND ${levelCondition}`
  ).get(userId, ...levelParams) as { c: number }).c;

  // Mastery breakdown
  const masteryRows = db.prepare(`
    SELECT up.weight, COUNT(*) as c FROM user_progress up JOIN questions q ON up.question_id = q.id WHERE up.user_id = ? AND up.attempts > 0 AND ${levelCondition} GROUP BY up.weight
  `).all(userId, ...levelParams) as { weight: number; c: number }[];

  const mastery: import('./types').MasteryBreakdown = {
    mastered: 0, learning: 0, not_studied: totalQ - answered, weak: 0,
  };
  masteryRows.forEach(r => {
    if (r.weight >= 3) mastery.mastered += r.c;
    else if (r.weight >= 1) mastery.learning += r.c;
    else if (r.weight === -1) mastery.weak += r.c;
  });

  const emptyMastery = (): import('./types').MasteryBreakdown => ({
    mastered: 0, learning: 0, not_studied: 0, weak: 0,
  });

  // By section (with mastery)
  const sectionStats = db.prepare(`
    SELECT q.chapter_section as section,
           COUNT(q.id) as total,
           COUNT(CASE WHEN up.attempts > 0 THEN 1 END) as answered,
           COUNT(CASE WHEN up.is_correct = 1 THEN 1 END) as correct,
           COUNT(CASE WHEN up.weight >= 3 THEN 1 END) as mastered,
           COUNT(CASE WHEN up.weight >= 1 AND up.weight < 3 THEN 1 END) as learning,
           COUNT(CASE WHEN up.weight = -1 THEN 1 END) as weak
    FROM questions q
    LEFT JOIN user_progress up ON q.id = up.question_id AND up.user_id = ?
    WHERE ${levelCondition}
    GROUP BY q.chapter_section
  `).all(userId, ...levelParams) as { section: string; total: number; answered: number; correct: number; mastered: number; learning: number; weak: number }[];

  const bySection: Record<string, import('./types').SectionStats> = {
    MOJI: { total: 0, answered: 0, correct: 0, accuracy: 0, mastery: emptyMastery() },
    GOI: { total: 0, answered: 0, correct: 0, accuracy: 0, mastery: emptyMastery() },
    BUNPO: { total: 0, answered: 0, correct: 0, accuracy: 0, mastery: emptyMastery() },
  };

  sectionStats.forEach(s => {
    if (bySection[s.section]) {
      bySection[s.section] = {
        total: s.total,
        answered: s.answered,
        correct: s.correct,
        accuracy: s.answered > 0 ? Math.round((s.correct / s.answered) * 100) : 0,
        mastery: {
          mastered: s.mastered,
          learning: s.learning,
          not_studied: s.total - s.answered,
          weak: s.weak,
        },
      };
    }
  });

  // By level
  const byLevel: Record<string, import('./types').LevelStats> = {};
  byLevel[level] = { total: totalQ, answered, correct };

  return {
    total_questions: totalQ,
    answered_questions: answered,
    correct_answers: correct,
    starred_questions: starred,
    learned_questions: learned,
    accuracy_rate: answered > 0 ? Math.round((correct / answered) * 100) : 0,
    mastery,
    by_section: bySection as import('./types').UserStats['by_section'],
    by_level: byLevel,
  };
}

// --- Progress Operations (Streak-based mastery) ---

/**
 * Weight system:
 *  +3 = Mastered (3 consecutive correct)
 *  +2 = Learning (2 consecutive correct)
 *  +1 = Learning (1 consecutive correct)
 *   0 = Not studied
 *  -1 = Weak (any wrong answer resets to -1, needs 4 consecutive correct to reach +3)
 */
function calculateWeight(consecutiveCorrect: number, hasEverBeenWrong: boolean): number {
  if (consecutiveCorrect <= 0) return hasEverBeenWrong ? -1 : 0;
  if (hasEverBeenWrong) {
    // After wrong: needs 4 consecutive correct → weight progression: -1 → 0 → +1 → +2 → +3
    return Math.min(consecutiveCorrect - 1, 3);
  }
  return Math.min(consecutiveCorrect, 3);
}

export function upsertProgress(
  userId: number,
  questionId: string,
  data: { is_correct?: boolean; is_starred?: boolean; is_learned?: boolean }
): void {
  const db = getDb();
  
  const existing = db.prepare(
    'SELECT * FROM user_progress WHERE user_id = ? AND question_id = ?'
  ).get(userId, questionId) as import('./types').ProgressRow | undefined;

  if (existing) {
    const updates: string[] = [];
    const params: (string | number)[] = [];

    if (data.is_correct !== undefined) {
      if (data.is_correct) {
        // Correct answer: increment consecutive_correct
        const newConsecutive = (existing.consecutive_correct || 0) + 1;
        const hasEverBeenWrong = existing.weight < 0 || (existing.attempts > 0 && !data.is_correct);
        const newWeight = calculateWeight(newConsecutive, hasEverBeenWrong || existing.weight === -1);
        updates.push('is_correct = 1');
        updates.push('consecutive_correct = ?');
        params.push(newConsecutive);
        updates.push('weight = ?');
        params.push(newWeight);
        // Mark as learned if mastered
        if (newWeight >= 3) {
          updates.push('is_learned = 1');
        }
      } else {
        // Wrong answer: reset consecutive_correct to 0, set weight to -1
        updates.push('is_correct = 0');
        updates.push('consecutive_correct = 0');
        updates.push('weight = -1');
      }
      updates.push('attempts = attempts + 1');
      updates.push('last_attempted = CURRENT_TIMESTAMP');
    }
    if (data.is_starred !== undefined) {
      updates.push('is_starred = ?');
      params.push(data.is_starred ? 1 : 0);
    }
    if (data.is_learned !== undefined) {
      updates.push('is_learned = ?');
      params.push(data.is_learned ? 1 : 0);
    }

    if (updates.length > 0) {
      params.push(userId, questionId);
      db.prepare(
        `UPDATE user_progress SET ${updates.join(', ')} WHERE user_id = ? AND question_id = ?`
      ).run(...params);
    }
  } else {
    const isCorrect = data.is_correct ? 1 : 0;
    const consecutiveCorrect = data.is_correct ? 1 : 0;
    const weight = data.is_correct === undefined ? 0 : (data.is_correct ? 1 : -1);
    
    db.prepare(
      `INSERT INTO user_progress (user_id, question_id, is_correct, is_starred, is_learned, attempts, consecutive_correct, weight, last_attempted) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
    ).run(
      userId,
      questionId,
      isCorrect,
      data.is_starred ? 1 : 0,
      data.is_learned ? 1 : 0,
      data.is_correct !== undefined ? 1 : 0,
      consecutiveCorrect,
      weight
    );
  }
}

// --- Kanji Progress Operations ---

export function upsertKanjiProgress(
  userId: number,
  kanji: string,
  isCorrect: boolean
): void {
  const db = getDb();
  
  const existing = db.prepare(
    'SELECT * FROM kanji_progress WHERE user_id = ? AND kanji = ?'
  ).get(userId, kanji) as import('./types').KanjiProgressRow | undefined;

  if (existing) {
    if (isCorrect) {
      const newConsecutive = (existing.consecutive_correct || 0) + 1;
      const hasEverBeenWrong = existing.weight === -1;
      const newWeight = calculateWeight(newConsecutive, hasEverBeenWrong);
      db.prepare(
        `UPDATE kanji_progress SET consecutive_correct = ?, weight = ?, attempts = attempts + 1, last_practiced = CURRENT_TIMESTAMP WHERE user_id = ? AND kanji = ?`
      ).run(newConsecutive, newWeight, userId, kanji);
    } else {
      db.prepare(
        `UPDATE kanji_progress SET consecutive_correct = 0, weight = -1, attempts = attempts + 1, last_practiced = CURRENT_TIMESTAMP WHERE user_id = ? AND kanji = ?`
      ).run(userId, kanji);
    }
  } else {
    db.prepare(
      `INSERT INTO kanji_progress (user_id, kanji, consecutive_correct, weight, attempts, last_practiced) VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP)`
    ).run(userId, kanji, isCorrect ? 1 : 0, isCorrect ? 1 : -1);
  }
}

export function getKanjiProgress(userId: number): import('./types').KanjiProgressRow[] {
  const db = getDb();
  return db.prepare('SELECT * FROM kanji_progress WHERE user_id = ?').all(userId) as import('./types').KanjiProgressRow[];
}

export function getUserProgress(userId: number, questionId?: string): import('./types').ProgressRow[] {
  const db = getDb();
  if (questionId) {
    const row = db.prepare(
      'SELECT * FROM user_progress WHERE user_id = ? AND question_id = ?'
    ).get(userId, questionId) as import('./types').ProgressRow | undefined;
    return row ? [row] : [];
  }
  return db.prepare(
    'SELECT * FROM user_progress WHERE user_id = ?'
  ).all(userId) as import('./types').ProgressRow[];
}

export function getUserStats(userId: number): import('./types').UserStats {
  const db = getDb();

  const totalQ = (db.prepare('SELECT COUNT(*) as c FROM questions').get() as { c: number }).c;
  const answered = (db.prepare(
    'SELECT COUNT(*) as c FROM user_progress WHERE user_id = ? AND attempts > 0'
  ).get(userId) as { c: number }).c;
  const correct = (db.prepare(
    'SELECT COUNT(*) as c FROM user_progress WHERE user_id = ? AND is_correct = 1'
  ).get(userId) as { c: number }).c;
  const starred = (db.prepare(
    'SELECT COUNT(*) as c FROM user_progress WHERE user_id = ? AND is_starred = 1'
  ).get(userId) as { c: number }).c;
  const learned = (db.prepare(
    'SELECT COUNT(*) as c FROM user_progress WHERE user_id = ? AND is_learned = 1'
  ).get(userId) as { c: number }).c;

  // Mastery breakdown (global)
  const masteryRows = db.prepare(`
    SELECT weight, COUNT(*) as c FROM user_progress WHERE user_id = ? AND attempts > 0 GROUP BY weight
  `).all(userId) as { weight: number; c: number }[];

  const mastery: import('./types').MasteryBreakdown = {
    mastered: 0, learning: 0, not_studied: totalQ - answered, weak: 0,
  };
  masteryRows.forEach(r => {
    if (r.weight >= 3) mastery.mastered += r.c;
    else if (r.weight >= 1) mastery.learning += r.c;
    else if (r.weight === -1) mastery.weak += r.c;
  });

  const emptyMastery = (): import('./types').MasteryBreakdown => ({
    mastered: 0, learning: 0, not_studied: 0, weak: 0,
  });

  // By section (with mastery)
  const sectionStats = db.prepare(`
    SELECT q.chapter_section as section,
           COUNT(q.id) as total,
           COUNT(CASE WHEN up.attempts > 0 THEN 1 END) as answered,
           COUNT(CASE WHEN up.is_correct = 1 THEN 1 END) as correct,
           COUNT(CASE WHEN up.weight >= 3 THEN 1 END) as mastered,
           COUNT(CASE WHEN up.weight >= 1 AND up.weight < 3 THEN 1 END) as learning,
           COUNT(CASE WHEN up.weight = -1 THEN 1 END) as weak
    FROM questions q
    LEFT JOIN user_progress up ON q.id = up.question_id AND up.user_id = ?
    GROUP BY q.chapter_section
  `).all(userId) as { section: string; total: number; answered: number; correct: number; mastered: number; learning: number; weak: number }[];

  const bySection: Record<string, import('./types').SectionStats> = {
    MOJI: { total: 0, answered: 0, correct: 0, accuracy: 0, mastery: emptyMastery() },
    GOI: { total: 0, answered: 0, correct: 0, accuracy: 0, mastery: emptyMastery() },
    BUNPO: { total: 0, answered: 0, correct: 0, accuracy: 0, mastery: emptyMastery() },
  };

  sectionStats.forEach(s => {
    if (bySection[s.section]) {
      bySection[s.section] = {
        total: s.total,
        answered: s.answered,
        correct: s.correct,
        accuracy: s.answered > 0 ? Math.round((s.correct / s.answered) * 100) : 0,
        mastery: {
          mastered: s.mastered,
          learning: s.learning,
          not_studied: s.total - s.answered,
          weak: s.weak,
        },
      };
    }
  });

  // By level
  const levelStats = db.prepare(`
    SELECT q.book_level as level,
           COUNT(q.id) as total,
           COUNT(CASE WHEN up.attempts > 0 THEN 1 END) as answered,
           COUNT(CASE WHEN up.is_correct = 1 THEN 1 END) as correct
    FROM questions q
    LEFT JOIN user_progress up ON q.id = up.question_id AND up.user_id = ?
    GROUP BY q.book_level
  `).all(userId) as { level: string; total: number; answered: number; correct: number }[];

  const byLevel: Record<string, import('./types').LevelStats> = {};
  levelStats.forEach(l => {
    byLevel[l.level] = { total: l.total, answered: l.answered, correct: l.correct };
  });

  return {
    total_questions: totalQ,
    answered_questions: answered,
    correct_answers: correct,
    starred_questions: starred,
    learned_questions: learned,
    accuracy_rate: answered > 0 ? Math.round((correct / answered) * 100) : 0,
    mastery,
    by_section: bySection as import('./types').UserStats['by_section'],
    by_level: byLevel,
  };
}

// --- Duplicate Detection ---

export function findDuplicateByContent(contentOriginal: string): import('./types').QuestionRow | undefined {
  const db = getDb();
  return db.prepare(
    'SELECT * FROM questions WHERE content_original = ?'
  ).get(contentOriginal) as import('./types').QuestionRow | undefined;
}

// --- Ensure Admin User ---

export function ensureAdminUser(): void {
  const db = getDb();
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminUsername || !adminPassword) return;

  const existing = db.prepare('SELECT * FROM users WHERE username = ?').get(adminUsername) as import('./types').UserRow | undefined;
  if (!existing) {
    // Lazy import to avoid circular dependency
    const { hashSync } = require('bcryptjs');
    const hash = hashSync(adminPassword, 10);
    db.prepare(
      'INSERT INTO users (username, password_hash, display_name, role) VALUES (?, ?, ?, ?)'
    ).run(adminUsername, hash, 'Admin', 'admin');
    console.log(`✅ Admin user "${adminUsername}" created`);
  } else if (existing.role !== 'admin') {
    db.prepare('UPDATE users SET role = ? WHERE username = ?').run('admin', adminUsername);
  }
}

// --- Mastery-based question filters ---

export function getQuestionsByMastery(userId: number, masteryLevel: string, section?: string): import('./types').QuestionRow[] {
  const db = getDb();
  let query = `SELECT q.* FROM questions q LEFT JOIN user_progress up ON q.id = up.question_id AND up.user_id = ?`;
  const params: (string | number)[] = [userId];
  const conditions: string[] = [];

  if (section) {
    conditions.push('q.chapter_section = ?');
    params.push(section);
  }

  switch (masteryLevel) {
    case 'mastered':
      conditions.push('up.weight >= 3');
      break;
    case 'learning':
      conditions.push('up.weight >= 1 AND up.weight < 3');
      break;
    case 'weak':
      conditions.push('up.weight = -1');
      break;
    case 'not_studied':
      conditions.push('(up.attempts IS NULL OR up.attempts = 0)');
      break;
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY q.book_level, q.chapter_week, q.chapter_day, q.question_number';
  return db.prepare(query).all(...params) as import('./types').QuestionRow[];
}
