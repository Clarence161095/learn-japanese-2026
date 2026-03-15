'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import QuizCard from '@/components/QuizCard';
import type { Question } from '@/lib/types';

export default function QuizSectionPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const section = (params.section as string)?.toUpperCase();
  
  const level = searchParams.get('level') || undefined;
  const random = searchParams.get('random') === 'true';
  const starred = searchParams.get('starred') === 'true';
  const wrong = searchParams.get('wrong') === 'true';

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [starredMap, setStarredMap] = useState<Record<string, boolean>>({});
  const [progressMap, setProgressMap] = useState<Record<string, boolean>>({});

  // Load questions
  useEffect(() => {
    const params = new URLSearchParams();
    if (section && section !== 'ALL') params.set('section', section);
    if (level) params.set('level', level);
    if (random) params.set('random', 'true');
    if (starred) params.set('starred', 'true');
    if (wrong) params.set('wrong', 'true');

    fetch(`/api/questions?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        setQuestions(data.questions || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Load progress for star status
    fetch('/api/progress')
      .then(res => res.json())
      .then(data => {
        const stars: Record<string, boolean> = {};
        data.progress?.forEach((p: { question_id: string; is_starred: boolean }) => {
          stars[p.question_id] = p.is_starred;
        });
        setStarredMap(stars);
      })
      .catch(console.error);
  }, [section, level, random, starred, wrong]);

  const handleAnswer = useCallback((questionId: string, isCorrect: boolean) => {
    if (isCorrect) setScore(prev => prev + 1);
    setProgressMap(prev => ({ ...prev, [questionId]: isCorrect }));

    // Save progress
    fetch('/api/progress', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId, is_correct: isCorrect }),
    }).catch(console.error);
  }, []);

  const handleNext = useCallback(() => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setFinished(true);
    }
  }, [currentIndex, questions.length]);

  const handleStar = useCallback((questionId: string, isStarred: boolean) => {
    setStarredMap(prev => ({ ...prev, [questionId]: isStarred }));
    fetch('/api/progress', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId, is_starred: isStarred }),
    }).catch(console.error);
  }, []);

  const handleRestart = () => {
    setCurrentIndex(0);
    setScore(0);
    setFinished(false);
    setProgressMap({});
    if (random) {
      // Re-shuffle
      setQuestions(prev => [...prev].sort(() => Math.random() - 0.5));
    }
  };

  const getSectionTitle = () => {
    if (starred) return '⭐ Câu đánh dấu sao';
    if (wrong) return '❌ Câu hay sai';
    switch (section) {
      case 'MOJI': return '🔤 MOJI (文字)';
      case 'GOI': return '📚 GOI (語彙)';
      case 'BUNPO': return '📐 BUNPO (文法)';
      default: return '📝 Quiz';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-center">
          <div className="text-5xl mb-3">📝</div>
          <p className="text-slate-500">Đang tải câu hỏi...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="text-5xl mb-4">😅</div>
        <h2 className="text-2xl font-bold text-slate-700 mb-2">Không có câu hỏi nào</h2>
        <p className="text-slate-500 mb-6">
          {starred && 'Bạn chưa đánh dấu sao câu nào.'}
          {wrong && 'Tuyệt vời! Bạn chưa trả lời sai câu nào.'}
          {!starred && !wrong && 'Hãy import data từ JSON để có câu hỏi.'}
        </p>
        <div className="flex justify-center gap-3">
          <Link href="/quiz" className="btn-secondary">← Quay lại</Link>
          <Link href="/import" className="btn-primary">📥 Import Data</Link>
        </div>
      </div>
    );
  }

  if (finished) {
    const accuracy = Math.round((score / questions.length) * 100);
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center animate-bounce-in">
        <div className="card">
          <div className="text-6xl mb-4">
            {accuracy >= 80 ? '🎉' : accuracy >= 50 ? '💪' : '📚'}
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-2">Hoàn thành!</h2>
          <div className="text-5xl font-bold text-primary-600 my-6">
            {score}/{questions.length}
          </div>
          <p className="text-lg text-slate-600 mb-2">
            Độ chính xác: <span className="font-bold">{accuracy}%</span>
          </p>
          <p className="text-slate-500 mb-8">
            {accuracy >= 80 && 'Xuất sắc! 素晴らしい！Tiếp tục phát huy nhé! 🌟'}
            {accuracy >= 50 && accuracy < 80 && 'Khá lắm! まあまあ！Cố gắng thêm chút nữa nhé! 💪'}
            {accuracy < 50 && 'Cần luyện tập thêm! がんばって！Đừng bỏ cuộc! 📖'}
          </p>

          {/* Question review */}
          <div className="text-left mb-6">
            <h3 className="font-medium text-slate-700 mb-3">📋 Chi tiết kết quả:</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {questions.map((q, idx) => (
                <div key={q.id} className={`flex items-center gap-2 p-2 rounded-lg text-sm ${
                  progressMap[q.id] ? 'bg-emerald-50' : 'bg-rose-50'
                }`}>
                  <span>{progressMap[q.id] ? '✅' : '❌'}</span>
                  <span className="text-slate-600 truncate">
                    Câu {idx + 1}: {q.question.content.original.slice(0, 50)}...
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center gap-3">
            <button onClick={handleRestart} className="btn-secondary">
              🔄 Làm lại
            </button>
            <Link href="/quiz" className="btn-primary">
              📝 Chọn quiz khác
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/quiz" className="text-sm text-primary-600 hover:text-primary-700 mb-1 inline-block">
            ← Quay lại
          </Link>
          <h1 className="text-2xl font-bold text-slate-800">
            {getSectionTitle()}
            {level && <span className="text-lg text-slate-500 ml-2">({level})</span>}
            {random && <span className="text-lg text-slate-500 ml-2">🎲</span>}
          </h1>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary-600">{score}</div>
          <div className="text-xs text-slate-500">điểm</div>
        </div>
      </div>

      {/* Quiz Card */}
      <QuizCard
        key={questions[currentIndex].id}
        question={questions[currentIndex]}
        questionIndex={currentIndex}
        totalQuestions={questions.length}
        onAnswer={handleAnswer}
        onNext={handleNext}
        onStar={handleStar}
        isStarred={starredMap[questions[currentIndex].id] || false}
      />
    </div>
  );
}
