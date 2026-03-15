'use client';

import { useState } from 'react';
import type { Question, QuestionOption } from '@/lib/types';
import FuriganaText from './FuriganaText';
import ExplanationPanel from './ExplanationPanel';

interface QuizCardProps {
  question: Question;
  questionIndex: number;
  totalQuestions: number;
  onAnswer: (questionId: string, isCorrect: boolean) => void;
  onNext: () => void;
  onStar: (questionId: string, starred: boolean) => void;
  isStarred?: boolean;
}

export default function QuizCard({
  question,
  questionIndex,
  totalQuestions,
  onAnswer,
  onNext,
  onStar,
  isStarred = false,
}: QuizCardProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [starred, setStarred] = useState(isStarred);

  const handleSelect = (option: QuestionOption) => {
    if (answered) return;
    setSelectedOption(option.id);
    setAnswered(true);
    onAnswer(question.id, option.is_correct);
  };

  const handleNext = () => {
    setSelectedOption(null);
    setAnswered(false);
    onNext();
  };

  const handleStar = () => {
    const newStarred = !starred;
    setStarred(newStarred);
    onStar(question.id, newStarred);
  };

  const getSectionBadge = () => {
    const section = question.chapter?.section || question.metadata?.section_type;
    switch (section) {
      case 'MOJI': return <span className="badge-moji">🔤 MOJI</span>;
      case 'GOI': return <span className="badge-goi">📚 GOI</span>;
      case 'BUNPO': return <span className="badge-bunpo">📐 BUNPO</span>;
      default: return null;
    }
  };

  const getOptionClass = (option: QuestionOption) => {
    if (!answered) {
      return selectedOption === option.id ? 'option-btn selected' : 'option-btn';
    }

    if (option.is_correct) return 'option-btn correct';
    if (selectedOption === option.id && !option.is_correct) return 'option-btn incorrect';
    return 'option-btn opacity-50';
  };

  return (
    <div className="animate-fade-in">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-500">
            Câu {questionIndex + 1} / {totalQuestions}
          </span>
          <div className="flex items-center gap-2">
            {getSectionBadge()}
            <span className="badge-level">{question.book_level}</span>
          </div>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div
            className="bg-primary-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${((questionIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="card mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="question-text">
              <FuriganaText
                original={question.question.content.original}
                withRuby={question.question.content.with_red_highlight || question.question.content.with_ruby}
              />
            </div>
          </div>
          <button
            onClick={handleStar}
            className={`ml-3 text-2xl transition-all ${
              starred ? 'text-amber-400 star-pop' : 'text-slate-300 hover:text-amber-300'
            }`}
          >
            {starred ? '★' : '☆'}
          </button>
        </div>

        {/* Metadata info */}
        {question.question.type && (
          <div className="text-xs text-slate-400 mb-4">
            {question.question.type === 'kanji_reading' && '📖 Tìm cách đọc Kanji'}
            {question.question.type === 'kanji_writing' && '✍️ Tìm Kanji từ Hiragana'}
            {question.question.type === 'fill_in_the_blank' && '📝 Điền vào chỗ trống'}
            {question.question.type === 'multiple_choice' && '✅ Trắc nghiệm'}
          </div>
        )}

        {/* Options */}
        <div className="space-y-3">
          {question.options.map((option, idx) => (
            <button
              key={option.id}
              onClick={() => handleSelect(option)}
              disabled={answered}
              className={getOptionClass(option)}
            >
              <span className="inline-flex items-center gap-3">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  answered && option.is_correct
                    ? 'bg-emerald-500 text-white'
                    : answered && selectedOption === option.id && !option.is_correct
                    ? 'bg-rose-500 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {idx + 1}
                </span>
                <span>{option.text}</span>
              </span>
              {answered && option.is_correct && (
                <span className="float-right text-emerald-500">✓</span>
              )}
              {answered && selectedOption === option.id && !option.is_correct && (
                <span className="float-right text-rose-500">✗</span>
              )}
            </button>
          ))}
        </div>

        {/* Result feedback */}
        {answered && (
          <div className={`mt-4 p-3 rounded-xl text-center font-medium animate-slide-up ${
            selectedOption === question.correct_answer_id
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}>
            {selectedOption === question.correct_answer_id
              ? '🎉 Chính xác! Giỏi lắm!'
              : '😔 Sai rồi! Xem giải thích bên dưới nhé.'}
          </div>
        )}
      </div>

      {/* Explanation */}
      {answered && (
        <div className="animate-slide-up">
          <ExplanationPanel
            explanation={question.explanation}
            section={question.chapter?.section || question.metadata?.section_type}
          />
        </div>
      )}

      {/* Next button */}
      {answered && (
        <div className="mt-6 flex justify-center animate-slide-up">
          <button onClick={handleNext} className="btn-primary text-lg px-8">
            {questionIndex + 1 < totalQuestions ? 'Câu tiếp theo →' : '🏁 Xem kết quả'}
          </button>
        </div>
      )}
    </div>
  );
}
