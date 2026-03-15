// ============================================
// Type definitions for the Japanese Learning App
// ============================================

// --- Question Types ---

export interface QuestionOption {
  id: number;
  text: string;
  is_correct: boolean;
}

export interface QuestionContent {
  original: string;
  with_ruby: string;
  with_red_highlight?: string; // with <span style="color: red;"> marking the asked word
}

export interface Chapter {
  week: string;
  day: string;
  section: 'MOJI' | 'GOI' | 'BUNPO';
}

// --- Translation Types (with IPA support) ---

export interface Translations {
  english: string;
  english_with_ipa?: string; // English with <ruby>word<rt>/IPA/</rt></ruby> tags
  vietnamese: string;
}

// --- MOJI Explanation Types ---

export interface KanjiExample {
  original: string;
  with_ruby: string;
  english: string;
  english_with_ipa?: string;
  vietnamese: string;
}

export interface RelatedWord {
  word: string;
  reading: string;
  meaning_vi: string;
  is_special_reading: boolean;
  examples_for_it_context: KanjiExample[];
}

export interface KanjiFocus {
  kanji: string;
  sino_vietnamese: string;
  meanings: {
    english: string;
    vietnamese: string;
  };
  readings: {
    onyomi: string[];
    kunyomi: string[];
  };
  related_words: RelatedWord[];
}

export interface MojiExplanation {
  translations: Translations;
  kanji_focus: KanjiFocus[];
}

// --- GOI Explanation Types ---

export interface KanjiComponent {
  kanji: string;
  sino_vietnamese: string;
  meanings: string;
}

export interface Antonym {
  word: string;
  kanji_writing: string;
  kanji_components: KanjiComponent[];
  meaning_vi: string;
}

export interface VocabularyAnalysis {
  word: string;
  kanji_writing: string;
  kanji_components: KanjiComponent[];
  meaning_vi: string;
  meaning_en: string;
  usage_notes: string;
  antonyms: Antonym[];
  examples_for_it_context: KanjiExample[];
}

export interface GoiExplanation {
  translations: Translations;
  grammar_and_usage_context: string;
  vocabulary_analysis: VocabularyAnalysis[];
}

// --- BUNPO Explanation Types ---

export interface GrammarPattern {
  grammar_pattern: string;
  meaning_vi: string;
  meaning_en: string;
  formation: string;
  usage_notes: string;
  textbook_examples: KanjiExample[];
  it_context_examples: KanjiExample[];
}

export interface BunpoExplanation {
  translations: Translations;
  general_explanation: string;
  grammar_breakdown: GrammarPattern[];
}

// --- Unified Question Type ---

export type SectionType = 'MOJI' | 'GOI' | 'BUNPO';
export type BookLevel = 'N1' | 'N2' | 'N3' | 'N4-N5';

export interface Question {
  id: string;
  book_level: string;
  chapter: Chapter;
  question: {
    number: number;
    type: string;
    content: QuestionContent;
  };
  options: QuestionOption[];
  correct_answer_id: number;
  explanation: MojiExplanation | GoiExplanation | BunpoExplanation;
  metadata: {
    section_type: SectionType;
    difficulty: number;
    source_file?: string;
    tags: string[];
  };
}

// --- Database Row Types ---

export interface QuestionRow {
  id: string;
  book_level: string;
  chapter_week: string;
  chapter_day: string;
  chapter_section: string;
  question_number: number;
  question_type: string;
  content_original: string;
  content_with_ruby: string;
  content_with_red_highlight: string;
  options: string; // JSON string
  correct_answer_id: number;
  explanation: string; // JSON string
  metadata: string; // JSON string
  created_at: string;
}

export interface UserRow {
  id: number;
  username: string;
  password_hash: string;
  display_name: string;
  created_at: string;
}

export interface ProgressRow {
  id: number;
  user_id: number;
  question_id: string;
  is_correct: number; // SQLite boolean
  is_starred: number;
  is_learned: number;
  attempts: number;
  consecutive_correct: number; // streak counter
  weight: number; // -1=weak, 0=not studied, +1/+2=learning, +3=mastered
  last_attempted: string;
}

export interface KanjiProgressRow {
  id: number;
  user_id: number;
  kanji: string;
  consecutive_correct: number;
  weight: number;
  attempts: number;
  last_practiced: string;
}

// --- Mastery Types ---

export type MasteryLevel = 'mastered' | 'learning' | 'not_studied' | 'weak';

export interface MasteryBreakdown {
  mastered: number;     // weight +3
  learning: number;     // weight +1 or +2
  not_studied: number;  // weight 0
  weak: number;         // weight -1
}

// --- API Response Types ---

export interface QuestionWithProgress extends Question {
  progress?: {
    is_correct: boolean;
    is_starred: boolean;
    is_learned: boolean;
    attempts: number;
    consecutive_correct: number;
    weight: number;
    last_attempted: string | null;
  };
}

export interface UserStats {
  total_questions: number;
  answered_questions: number;
  correct_answers: number;
  starred_questions: number;
  learned_questions: number;
  accuracy_rate: number;
  mastery: MasteryBreakdown;
  by_section: {
    MOJI: SectionStats;
    GOI: SectionStats;
    BUNPO: SectionStats;
  };
  by_level: Record<string, LevelStats>;
}

export interface SectionStats {
  total: number;
  answered: number;
  correct: number;
  accuracy: number;
  mastery: MasteryBreakdown;
}

export interface LevelStats {
  total: number;
  answered: number;
  correct: number;
}

// --- Auth Types ---

export interface User {
  id: number;
  username: string;
  display_name: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
}

// --- Import Types ---

export interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
  filename?: string;
}

// --- App Settings Types ---

export interface AppSettings {
  furiganaQuestionSize: number;      // rem unit for question furigana
  furiganaExplanationSize: number;   // rem unit for explanation furigana
  showIPA: boolean;
  darkMode: boolean;
  fontSize: number;                  // px
  fontFamily: string;
  textColor: string;                 // empty = default
}

export const DEFAULT_SETTINGS: AppSettings = {
  furiganaQuestionSize: 0.65,
  furiganaExplanationSize: 0.5,
  showIPA: true,
  darkMode: false,
  fontSize: 16,
  fontFamily: '"Noto Sans JP", sans-serif',
  textColor: '',
};
